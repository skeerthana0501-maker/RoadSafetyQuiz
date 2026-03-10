import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;
const VERSION = "1.1.1-20260310-0145";

// API routes go here
app.get("/api/version", (req, res) => {
  res.json({ version: VERSION });
});

// Initialize AI
const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not set. AI features will fail.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

// Quiz State
interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface User {
  id: string;
  name: string;
  score: number;
  lastAnswerTime?: number;
  answeredCorrectly?: boolean;
}

let currentSessionId: string | null = null;
let questions: Question[] = [];
let users = new Map<string, User>();
let organizerId: string | null = null;
let currentQuestionIndex = -1;
let quizState: "setup" | "joining" | "question" | "answer" | "leaderboard" = "setup";
let timerValue = 0;
let timerInterval: NodeJS.Timeout | null = null;
let config = {
  numQuestions: 5,
  numOptions: 4,
  timePerQuestion: 25,
};

function broadcast(data: any) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function startTimer(duration: number, onComplete: () => void) {
  if (timerInterval) clearInterval(timerInterval);
  timerValue = duration;
  broadcast({ type: "timer", value: timerValue });

  timerInterval = setInterval(() => {
    if (timerValue > 0) {
      timerValue--;
      broadcast({ type: "timer", value: timerValue });
    } else {
      clearInterval(timerInterval!);
      onComplete();
    }
  }, 1000);
}

function nextStep() {
  if (quizState === "joining") {
    currentQuestionIndex = 0;
    quizState = "question";
    broadcast({
      type: "quiz_start",
      question: {
        text: questions[currentQuestionIndex].text,
        options: questions[currentQuestionIndex].options,
        index: currentQuestionIndex,
        total: questions.length,
      },
    });
    startTimer(config.timePerQuestion, revealAnswer);
  } else if (quizState === "answer") {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      quizState = "question";
      users.forEach(u => {
        u.answeredCorrectly = false;
        u.lastAnswerTime = undefined;
      });
      broadcast({
        type: "next_question",
        question: {
          text: questions[currentQuestionIndex].text,
          options: questions[currentQuestionIndex].options,
          index: currentQuestionIndex,
          total: questions.length,
        },
      });
      startTimer(config.timePerQuestion, revealAnswer);
    } else {
      quizState = "leaderboard";
      // Session expires when leaderboard is shown
      const finalLeaderboard = Array.from(users.values()).sort((a, b) => b.score - a.score);
      broadcast({
        type: "quiz_end",
        leaderboard: finalLeaderboard,
      });
      // We don't null currentSessionId immediately so people can see the leaderboard,
      // but we'll prevent new joins with this ID.
    }
  }
}

function revealAnswer() {
  quizState = "answer";
  broadcast({
    type: "reveal_answer",
    correctAnswer: questions[currentQuestionIndex].correctAnswer,
    leaderboard: Array.from(users.values()).sort((a, b) => b.score - a.score),
  });
  setTimeout(nextStep, 5000);
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId") || Math.random().toString(36).substring(7);
  
  ws.send(JSON.stringify({ 
    type: "init", 
    userId, 
    isOrganizer: userId === organizerId,
    state: quizState,
    config,
    sessionId: currentSessionId
  }));

  ws.on("message", async (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "claim_organizer":
        const hostPassword = process.env.HOST_PASSWORD || "admin123";
        if (message.password === hostPassword) {
          organizerId = userId;
          ws.send(JSON.stringify({ type: "organizer_confirmed", isOrganizer: true }));
          broadcast({ type: "user_list", users: Array.from(users.values()) });
        } else {
          ws.send(JSON.stringify({ type: "error", message: "Invalid host password." }));
        }
        break;

      case "verify_password":
        const verifyPassword = process.env.HOST_PASSWORD || "admin123";
        if (message.password === verifyPassword) {
          ws.send(JSON.stringify({ type: "password_verified", success: true }));
        } else {
          ws.send(JSON.stringify({ type: "password_verified", success: false }));
        }
        break;

      case "setup_quiz":
        if (userId === organizerId) {
          questions = message.questions.map((q: any, i: number) => ({
            id: `q-${i}`,
            ...q,
          }));
          config = { ...config, ...message.config };
          currentSessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
          quizState = "joining";
          broadcast({ type: "quiz_ready", config, sessionId: currentSessionId });
        }
        break;

      case "join":
        // Validate session ID if one is provided or required
        // If the user is at the base URL (no sessionId in message), allow joining if a session is active
        const effectiveSessionId = message.sessionId || currentSessionId;
        
        if (quizState !== "setup" && effectiveSessionId !== currentSessionId) {
          ws.send(JSON.stringify({ type: "error", message: "This quiz session has expired or is invalid." }));
          return;
        }
        
        // Don't add organizer to the player list
        if (userId === organizerId) {
          ws.send(JSON.stringify({ type: "joined", userId, isOrganizer: true }));
          return;
        }
        
        users.set(userId, { id: userId, name: message.name, score: 0 });
        ws.send(JSON.stringify({ type: "joined", userId, isOrganizer: userId === organizerId }));
        broadcast({ type: "user_list", users: Array.from(users.values()) });
        break;

      case "start_quiz":
        if (userId === organizerId && quizState === "joining" && questions.length > 0) {
          nextStep();
        }
        break;

      case "stop_quiz":
        if (userId === organizerId && (quizState === "question" || quizState === "answer")) {
          if (timerInterval) clearInterval(timerInterval);
          quizState = "leaderboard";
          const finalLeaderboard = Array.from(users.values()).sort((a, b) => b.score - a.score);
          broadcast({
            type: "quiz_end",
            leaderboard: finalLeaderboard,
          });
        }
        break;

      case "reset_session":
        if (userId === organizerId) {
          currentSessionId = null;
          questions = [];
          users.clear();
          currentQuestionIndex = -1;
          quizState = "setup";
          broadcast({ type: "session_reset" });
        }
        break;

      case "submit_answer":
        const user = users.get(userId);
        if (user && quizState === "question" && user.lastAnswerTime === undefined) {
          const isCorrect = message.answerIndex === questions[currentQuestionIndex].correctAnswer;
          user.lastAnswerTime = Date.now();
          user.answeredCorrectly = isCorrect;

          if (isCorrect) {
            const timeTaken = config.timePerQuestion - timerValue;
            const points = Math.max(100, Math.floor(1000 * (1 - timeTaken / config.timePerQuestion)));
            user.score += points;
          }
          broadcast({ type: "user_answered", userId });
        }
        break;

      case "generate_ai_questions":
        if (userId === organizerId) {
          try {
            const aiInstance = getAI();
            if (!aiInstance) {
              throw new Error("AI service not configured (missing API key)");
            }
            
            const response = await aiInstance.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Generate a fun and engaging quiz with ${message.config.numQuestions} questions about "${message.topic}". 
              Each question must have exactly ${message.config.numOptions} options and exactly one correct answer (0-indexed).
              Ensure the questions are diverse in difficulty.
              Return ONLY a valid JSON array of objects.`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING, description: "The question text" },
                      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options" },
                      correctAnswer: { type: Type.NUMBER, description: "Index of the correct option (0-3)" },
                    },
                    required: ["text", "options", "correctAnswer"],
                  },
                },
              },
            });

            let text = response.text;
            // Strip markdown if present
            if (text.includes("```json")) {
              text = text.split("```json")[1].split("```")[0].trim();
            } else if (text.includes("```")) {
              text = text.split("```")[1].split("```")[0].trim();
            }
            
            const generatedQuestions = JSON.parse(text);
            ws.send(JSON.stringify({ 
              type: "ai_questions_generated", 
              questions: generatedQuestions 
            }));
          } catch (err: any) {
            console.error("AI Generation Error:", err);
            ws.send(JSON.stringify({ 
              type: "error", 
              message: err.message || "Failed to generate questions with AI." 
            }));
          }
        }
        break;
    }
  });

  ws.on("close", () => {
    users.delete(userId);
    if (userId === organizerId) {
      // If organizer leaves, pick a new one if quiz hasn't started
      if (quizState === "setup" || quizState === "joining") {
        organizerId = null; // Next person to connect or message will become organizer
        // In a real app we'd notify someone, but here we'll just let the next connection take over
      }
    }
    broadcast({ type: "user_list", users: Array.from(users.values()) });
  });
});

async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

init();
