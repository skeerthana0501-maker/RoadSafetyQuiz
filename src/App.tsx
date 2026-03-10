import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Timer, Trophy, Play, CheckCircle2, XCircle, ChevronRight, Settings, Plus, Trash2, Save, LogIn, Sparkles, Crown, Link as LinkIcon, Copy, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface User {
  id: string;
  name: string;
  score: number;
  answeredCorrectly?: boolean;
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

interface ActiveQuestion {
  text: string;
  options: string[];
  index: number;
  total: number;
}

const BackgroundAnimation = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1515549832467-8783363e19b6?auto=format&fit=crop&q=80&w=2000')`,
        filter: 'brightness(0.4) saturate(1.1)'
      }}
    />
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
  </div>
);

const SessionEndedView = () => (
  <div className="min-h-screen bg-[#1A0B2E] flex items-center justify-center p-4 font-sans text-white">
    <BackgroundAnimation />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 shadow-2xl max-w-md text-center space-y-6"
    >
      <div className="bg-purple-500/20 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <XCircle className="text-purple-400 w-10 h-10" />
      </div>
      <h2 className="text-4xl font-black tracking-tighter">Session Ended</h2>
      <p className="text-purple-300/60 serif italic text-lg">
        This quiz session has already concluded. You can't join this one anymore!
      </p>
      <button
        onClick={() => window.location.href = window.location.origin}
        className="w-full bg-white text-black py-4 rounded-2xl font-black hover:scale-[1.02] transition-all"
      >
        START YOUR OWN SESSION
      </button>
    </motion.div>
  </div>
);

export default function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const isOrganizerRef = useRef(false);
  const [name, setName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [quizState, setQuizState] = useState<"setup" | "joining" | "question" | "answer" | "leaderboard">("setup");
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null);
  const [timer, setTimer] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredUsers, setAnsweredUsers] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState({ numQuestions: 5, numOptions: 4, timePerQuestion: 25 });
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hostPassword, setHostPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showHostAuth, setShowHostAuth] = useState(false);
  const [hostAuthPassword, setHostAuthPassword] = useState("");
  const [hostAuthError, setHostAuthError] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const currentVersion = "1.1.1-20260310-0145";

  // Check for updates
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version");
        const data = await res.json();
        if (data.version && data.version !== currentVersion) {
          setShowUpdateToast(true);
        }
      } catch (err) {
        console.warn("Version check failed", err);
      }
    };

    const interval = setInterval(checkVersion, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Check for completion on session ID change
  useEffect(() => {
    if (sessionId) {
      const completed = localStorage.getItem(`quiz_completed_${sessionId}`);
      if (completed === "true" && !isUnlocked) {
        setShowPasswordPrompt(true);
      }
    }
  }, [sessionId, isUnlocked]);

  // Persist session info
  useEffect(() => {
    if (sessionId) {
      const savedName = sessionStorage.getItem(`quiz_name_${sessionId}`);
      const savedJoined = sessionStorage.getItem(`quiz_joined_${sessionId}`);
      if (savedName && savedJoined === "true" && !isJoined) {
        setName(savedName);
        setIsJoined(true);
        // Re-join on server
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "join", name: savedName, sessionId }));
        }
      }
    }
  }, [sessionId, socket, isJoined]);

  useEffect(() => {
    isOrganizerRef.current = isOrganizer;
  }, [isOrganizer]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get("session");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Persist userId
      let storedUserId = sessionStorage.getItem("quiz_user_id");
      const wsUrl = new URL(`${protocol}//${window.location.host}`);
      if (storedUserId) {
        wsUrl.searchParams.set("userId", storedUserId);
      }
      
      ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        console.log("Connected to server");
        setError(null);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "init":
            setUserId(data.userId);
            sessionStorage.setItem("quiz_user_id", data.userId);
            setIsOrganizer(data.isOrganizer);
            setQuizState(data.state);
            setConfig(data.config);
            setSessionId(data.sessionId);
            
            const urlParams = new URLSearchParams(window.location.search);
            const hasSession = urlParams.has("session");
            const isHost = urlParams.get("host") === "true";

            // If we have a host flag in URL, show the host auth prompt automatically
            if (isHost && !data.isOrganizer) {
              setShowHostAuth(true);
            }

            // If we are the organizer and had the host flag, clean up the URL
            if (isHost && data.isOrganizer) {
              const newUrl = window.location.origin + (hasSession ? `?session=${urlParams.get("session")}` : "");
              window.history.replaceState({}, "", newUrl);
            }
            
            // If we have a session ID in URL, but the server says it's different or none, 
            // and we aren't the organizer, we might be in an expired session.
            if (urlSessionId && data.sessionId !== urlSessionId && !data.isOrganizer) {
              setError("This quiz session has already concluded or is no longer available.");
            }
            break;
          case "organizer_confirmed":
            setIsOrganizer(data.isOrganizer);
            setShowHostAuth(false);
            break;
          case "password_verified":
            if (data.success) {
              setIsUnlocked(true);
              setShowPasswordPrompt(false);
              setPasswordError(false);
            } else {
              setPasswordError(true);
              setTimeout(() => setPasswordError(false), 2000);
            }
            break;
          case "joined":
            setIsJoined(true);
            if (data.isOrganizer !== undefined) {
              setIsOrganizer(data.isOrganizer);
            }
            break;
          case "user_list":
            setUsers(data.users);
            break;
          case "timer":
            setTimer(data.value);
            break;
          case "quiz_ready":
            setQuizState("joining");
            setConfig(data.config);
            setSessionId(data.sessionId);
            
            if (isOrganizerRef.current) {
              const link = `${window.location.origin}?session=${data.sessionId}`;
              navigator.clipboard.writeText(link).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }
            break;
          case "ai_questions_generated":
            setManualQuestions(data.questions);
            setIsGenerating(false);
            break;
          case "quiz_start":
          case "next_question":
            setQuizState("question");
            setCurrentQuestion(data.question);
            setCorrectAnswer(null);
            setSelectedAnswer(null);
            setAnsweredUsers(new Set());
            break;
          case "user_answered":
            setAnsweredUsers(prev => new Set(prev).add(data.userId));
            break;
          case "reveal_answer":
            setQuizState("answer");
            setCorrectAnswer(data.correctAnswer);
            setUsers(data.leaderboard);
            break;
          case "quiz_end":
            setQuizState("leaderboard");
            setUsers(data.leaderboard);
            if (sessionId) {
              localStorage.setItem(`quiz_completed_${sessionId}`, "true");
            }
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#A855F7', '#6366F1', '#D946EF']
            });
            break;
          case "session_reset":
            window.location.href = window.location.origin;
            break;
          case "error":
            if (data.message === "Invalid host password.") {
              setHostAuthError(true);
              setTimeout(() => setHostAuthError(false), 3000);
            } else {
              setError(data.message);
            }
            setIsGenerating(false);
            break;
        }
      };

      ws.onclose = () => {
        console.log("Disconnected from server, retrying...");
        reconnectTimeout = setTimeout(connect, 2000);
      };

      setSocket(ws);
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const joinGame = () => {
    if (name.trim() && socket) {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get("session") || sessionId;
      socket.send(JSON.stringify({ type: "join", name, sessionId: urlSessionId }));
      
      // Persist locally
      if (urlSessionId) {
        sessionStorage.setItem(`quiz_name_${urlSessionId}`, name);
        sessionStorage.setItem(`quiz_joined_${urlSessionId}`, "true");
      }
    }
  };

  const generateAIQuestions = () => {
    if (socket && topic.trim()) {
      setIsGenerating(true);
      socket.send(JSON.stringify({ 
        type: "generate_ai_questions", 
        topic,
        config 
      }));
    }
  };

  const handleSetupSubmit = () => {
    if (socket && manualQuestions.length > 0) {
      socket.send(JSON.stringify({ 
        type: "setup_quiz", 
        questions: manualQuestions,
        config: { ...config, numQuestions: manualQuestions.length }
      }));
    }
  };

  const startQuiz = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "start_quiz" }));
    }
  };

  const stopQuiz = () => {
    if (socket && isOrganizer) {
      socket.send(JSON.stringify({ type: "stop_quiz" }));
      setShowStopConfirm(false);
    }
  };

  const submitAnswer = (index: number) => {
    if (socket && quizState === "question" && selectedAnswer === null) {
      setSelectedAnswer(index);
      socket.send(JSON.stringify({ type: "submit_answer", answerIndex: index }));
    }
  };

  const resetSession = () => {
    if (socket && isOrganizer) {
      socket.send(JSON.stringify({ type: "reset_session" }));
    }
  };

  const copyLink = () => {
    if (sessionId) {
      const link = `${window.location.origin}?session=${sessionId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePasswordSubmit = () => {
    if (socket && hostPassword.trim()) {
      socket.send(JSON.stringify({ type: "verify_password", password: hostPassword }));
    }
  };

  const handleHostAuthSubmit = () => {
    if (socket && hostAuthPassword.trim()) {
      socket.send(JSON.stringify({ type: "claim_organizer", password: hostAuthPassword }));
      setHostAuthPassword("");
    }
  };

  if (showPasswordPrompt && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#1A0B2E] flex items-center justify-center p-4 font-sans text-white">
        <BackgroundAnimation />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 text-center space-y-8"
        >
          <div className="bg-purple-500/20 p-5 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto">
            <LogIn className="text-purple-400 w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Host Access Required</h2>
            <p className="text-purple-300/50 serif italic">This quiz has concluded. Enter host password to view results.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-black uppercase tracking-widest text-purple-300/30 ml-2">Host Password</label>
              <input
                type="password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                placeholder="Enter password..."
                className={`w-full px-6 py-4 rounded-2xl bg-white/5 border ${passwordError ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              />
              {passwordError && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">Incorrect Password</p>}
            </div>
            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-white text-black py-5 rounded-2xl font-black hover:scale-[1.02] transition-all uppercase tracking-widest"
            >
              Unlock Results
            </button>
            <button
              onClick={() => window.location.href = window.location.origin}
              className="w-full bg-transparent text-purple-300/50 py-2 rounded-2xl font-bold text-xs hover:text-purple-300 transition-all"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const addQuestion = () => {
    setManualQuestions([...manualQuestions, { 
      text: "", 
      options: Array(config.numOptions).fill(""), 
      correctAnswer: 0 
    }]);
  };

  const updateQuestion = (qIdx: number, text: string) => {
    const newQs = [...manualQuestions];
    newQs[qIdx].text = text;
    setManualQuestions(newQs);
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    const newQs = [...manualQuestions];
    newQs[qIdx].options[oIdx] = text;
    setManualQuestions(newQs);
  };

  const setCorrect = (qIdx: number, oIdx: number) => {
    const newQs = [...manualQuestions];
    newQs[qIdx].correctAnswer = oIdx;
    setManualQuestions(newQs);
  };

  const removeQuestion = (idx: number) => {
    setManualQuestions(manualQuestions.filter((_, i) => i !== idx));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
        <BackgroundAnimation />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-600 p-12 rounded-[2rem] border-4 border-white shadow-2xl max-w-md text-center space-y-6"
        >
          <div className="bg-white p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <XCircle className="text-red-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Road Closed</h2>
          <p className="text-white font-bold italic">{error}</p>
          <button
            onClick={() => window.location.href = window.location.origin}
            className="w-full bg-white text-black py-4 rounded-xl font-black hover:scale-[1.02] transition-all border-2 border-black"
          >
            BACK TO START
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isJoined && !(isOrganizer && quizState !== "setup")) {
    if (quizState === "leaderboard") {
      return <SessionEndedView />;
    }
    
    if (quizState === "setup") {
      if (isOrganizer) {
        return (
          <div className="min-h-screen bg-[#1A0B2E] font-sans text-white p-8">
            <BackgroundAnimation />
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">Quiz Setup</h2>
                  <p className="text-purple-300/50 serif italic">Design your custom session</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <input 
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter a topic (e.g. 80s Pop Music)"
                      className="bg-transparent px-4 py-2 outline-none text-sm w-48"
                    />
                    <button
                      onClick={generateAIQuestions}
                      disabled={isGenerating || !topic.trim()}
                      className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      AI GENERATE
                    </button>
                  </div>
                  <button
                    onClick={addQuestion}
                    className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all"
                  >
                    <Plus size={20} /> Add Question
                  </button>
                  <button
                    onClick={handleSetupSubmit}
                    disabled={manualQuestions.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                  >
                    <Save size={20} /> Finalize Questions
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {manualQuestions.map((q, qIdx) => (
                  <motion.div
                    layout
                    key={qIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6 relative group"
                  >
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      className="absolute top-6 right-6 text-white/20 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-300/30">Question {qIdx + 1}</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(qIdx, e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full bg-transparent text-2xl font-bold border-b-2 border-white/10 focus:border-purple-500 outline-none pb-2 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                          <button
                            onClick={() => setCorrect(qIdx, oIdx)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              q.correctAnswer === oIdx ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                            }`}
                          >
                            {q.correctAnswer === oIdx && <CheckCircle2 size={14} className="text-white" />}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="bg-transparent flex-1 font-medium outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {manualQuestions.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
                    <p className="text-purple-300/30 font-bold uppercase tracking-widest">No questions added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="min-h-screen bg-[#1A0B2E] flex items-center justify-center p-4 font-sans text-white">
            <BackgroundAnimation />
            <div className="text-center space-y-8 max-w-md">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse border border-white/10">
                <Settings className="text-purple-400 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter">Waiting for Organizer</h2>
                <p className="text-purple-300/50 italic serif">The questions are being prepared. Hang tight!</p>
              </div>
              
              <div className="pt-8 border-t border-white/5">
                {!new URLSearchParams(window.location.search).has("session") && (
                  <>
                    {!showHostAuth ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Are you the host?</p>
                        <button 
                          onClick={() => setShowHostAuth(true)}
                          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold transition-colors"
                        >
                          <Crown size={16} /> Enter Setup Mode
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Host Authentication</p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={hostAuthPassword}
                            onChange={(e) => setHostAuthPassword(e.target.value)}
                            placeholder="Host Password"
                            className={`bg-white/5 border ${hostAuthError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-colors`}
                            onKeyDown={(e) => e.key === "Enter" && handleHostAuthSubmit()}
                          />
                          <button
                            onClick={handleHostAuthSubmit}
                            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl text-xs font-black transition-all"
                          >
                            VERIFY
                          </button>
                        </div>
                        {hostAuthError && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Invalid Password</p>}
                        <button
                          onClick={() => setShowHostAuth(false)}
                          className="text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center p-4 font-sans">
        <BackgroundAnimation />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20"
        >
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-purple-400 to-indigo-600 p-5 rounded-3xl shadow-lg">
              <Trophy className="text-white w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center mb-2 text-white tracking-tight">ROAD SAFETY QUIZ</h1>
          <p className="text-center text-purple-200/60 mb-10 serif italic">Enter your name to join</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/50 ml-2">Player Identity</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's your name?"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                onKeyDown={(e) => e.key === "Enter" && joinGame()}
              />
            </div>
            <button
              onClick={joinGame}
              disabled={!name.trim()}
              className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 border-b-4 border-emerald-700 shadow-lg uppercase tracking-widest"
            >
              Start Journey <LogIn size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A0B2E] font-sans text-white selection:bg-purple-500/30 overflow-x-hidden">
      <BackgroundAnimation />
      
      {/* Header */}
      {quizState !== "leaderboard" && (
        <header className="bg-black/40 backdrop-blur-md border-b-4 border-white/10 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500 p-2.5 rounded-xl shadow-lg border-2 border-black">
              <Trophy className="text-black w-5 h-5" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase">
              RoadSafety Quest
            </span>
          </div>

          <div className="flex items-center gap-8">
            {isOrganizer && (quizState === "question" || quizState === "answer") && (
              <div className="relative">
                <button
                  onClick={() => setShowStopConfirm(!showStopConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-xs font-black border-2 border-white transition-all flex items-center gap-2 shadow-lg"
                >
                  <XCircle size={14} /> STOP
                </button>
                
                <AnimatePresence>
                  {showStopConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-4 w-64 bg-white p-6 rounded-3xl shadow-2xl border-4 border-red-600 z-[60] text-black"
                    >
                      <p className="font-black text-sm mb-4 leading-tight uppercase">End session for all?</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={stopQuiz}
                          className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all border-2 border-black"
                        >
                          YES, STOP
                        </button>
                        <button
                          onClick={() => setShowStopConfirm(false)}
                          className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          CANCEL
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="flex items-center gap-3 bg-blue-600 px-4 py-2 rounded-2xl border-2 border-white shadow-lg">
              <Users size={18} className="text-white" />
              <span className="text-sm font-black text-white">{users.length}</span>
            </div>
            {quizState === "question" && (
              <div className="flex items-center gap-3 bg-emerald-500 text-white px-5 py-2 rounded-2xl shadow-lg border-2 border-white">
                <Timer size={18} className="text-white" />
                <span className="text-sm font-mono font-black">{timer}s</span>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Timer Progress Bar */}
      {quizState === "question" && (
        <div className="fixed top-[72px] left-0 w-full h-1 bg-white/5 z-50">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: `${(timer / config.timePerQuestion) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className={`h-full ${timer < 5 ? "bg-rose-500" : "bg-purple-500"}`}
          />
        </div>
      )}

      <main className="max-w-5xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {quizState === "joining" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
                  <div className="space-y-2 mb-10">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-5xl font-black tracking-tighter">Ready to Start?</h2>
                      {isOrganizer && (
                        <span className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          Organizer
                        </span>
                      )}
                    </div>
                    <p className="text-purple-300/50 serif italic text-lg">
                      The session is configured and ready.
                    </p>
                  </div>

                  {isOrganizer ? (
                    <div className="space-y-8">
                      <div className="bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 flex flex-col items-center text-center space-y-4">
                        <div className="bg-emerald-500 p-3 rounded-full">
                          <CheckCircle2 className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-emerald-400">Quiz is Ready!</h3>
                          <p className="text-purple-300/60 text-sm">The invitation link is ready to be shared.</p>
                        </div>
                        <div className="w-full bg-black/20 p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5">
                          <code className="text-xs font-mono text-purple-300 truncate">
                            {window.location.origin}?session={sessionId}
                          </code>
                          <button 
                            onClick={copyLink}
                            className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                          >
                            {copied ? "COPIED!" : "COPY LINK"}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={startQuiz}
                        className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl border-b-8 border-emerald-700 uppercase tracking-tighter"
                      >
                        <Play fill="white" size={24} /> GO! Start Session
                      </button>
                    </div>
                  ) : (
                    <div className="bg-purple-500/10 p-8 rounded-[2rem] border border-purple-500/20 text-center">
                      <p className="text-purple-300 font-bold uppercase tracking-widest animate-pulse">Waiting for Organizer to start...</p>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-black">{config.numQuestions}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-300/30">Questions</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-3xl font-black">{config.timePerQuestion}s</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-300/30">Per Question</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-purple-300/50 uppercase tracking-widest">Session ID</p>
                    <p className="font-mono font-bold text-purple-300">#{sessionId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 h-fit">
                <h3 className="font-black mb-6 text-purple-300/30 uppercase text-[10px] tracking-[0.3em]">
                  Players Joined ({users.length})
                </h3>
                <div className="space-y-4">
                  {users.map((u) => (
                    <motion.div 
                      layout
                      key={u.id} 
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block">{u.name}</span>
                        {u.id === userId && <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">You</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {(quizState === "question" || quizState === "answer") && currentQuestion && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-12 py-10"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ rotate: -2, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="bg-yellow-400 text-black px-12 py-12 rounded-[3rem] border-8 border-black shadow-2xl max-w-4xl mx-auto relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-black/10" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-black/40 block mb-4">
                    Question {currentQuestion.index + 1} of {currentQuestion.total}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter uppercase">
                    {currentQuestion.text}
                  </h2>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {currentQuestion.options.map((option, idx) => {
                  const isCorrect = correctAnswer === idx;
                  const isSelected = selectedAnswer === idx;
                  const isWrong = quizState === "answer" && isSelected && !isCorrect;
                  
                  const signColors = [
                    "bg-red-600 border-red-800",
                    "bg-blue-600 border-blue-800",
                    "bg-emerald-600 border-emerald-800",
                    "bg-orange-500 border-orange-700"
                  ];

                  return (
                    <motion.button
                      whileHover={quizState === "question" && selectedAnswer === null ? { scale: 1.02, rotate: 1 } : {}}
                      whileTap={quizState === "question" && selectedAnswer === null ? { scale: 0.98 } : {}}
                      key={idx}
                      onClick={() => submitAnswer(idx)}
                      disabled={selectedAnswer !== null || quizState === "answer"}
                      className={`
                        relative p-8 rounded-[2rem] text-left transition-all border-4 flex items-center justify-between group shadow-2xl
                        ${quizState === "question"
                          ? isSelected
                            ? "bg-white text-black border-black scale-105 z-10"
                            : `${signColors[idx % 4]} text-white hover:brightness-110`
                          : isCorrect
                            ? "bg-emerald-500 text-white border-white scale-105 z-10"
                            : isWrong
                              ? "bg-red-600 text-white border-white"
                              : "bg-black/40 border-white/10 opacity-20"
                        }
                      `}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl border-4 ${
                          isSelected ? "bg-black text-white border-black" : "bg-white text-black border-black"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-2xl font-black uppercase tracking-tight">{option}</span>
                      </div>
                      {quizState === "answer" && isCorrect && <CheckCircle2 size={40} className="text-white" />}
                      {quizState === "answer" && isWrong && <XCircle size={40} className="text-white" />}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-center gap-3">
                {users.map((u) => (
                  <motion.div
                    key={u.id}
                    title={u.name}
                    animate={{ 
                      scale: answeredUsers.has(u.id) ? 1.2 : 1,
                      backgroundColor: answeredUsers.has(u.id) ? "#A855F7" : "rgba(255,255,255,0.1)"
                    }}
                    className="w-4 h-4 rounded-full border border-white/10"
                  />
                ))}
              </div>

              {quizState === "answer" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-3 bg-white/5 px-8 py-4 rounded-3xl border border-white/10">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                    <p className="text-purple-300/50 font-black uppercase tracking-[0.2em] text-[10px]">Preparing next question...</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {quizState === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-2xl p-16 rounded-[4rem] border-8 border-white/20 shadow-2xl max-w-3xl mx-auto text-center"
            >
              <div className="mb-16">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block bg-emerald-500 p-10 rounded-full mb-10 shadow-[0_0_60px_rgba(16,185,129,0.4)] border-4 border-white"
                >
                  <CheckCircle2 className="text-white w-20 h-20" />
                </motion.div>
                <h2 className="text-8xl font-black tracking-tighter mb-4 uppercase">Quiz Done!</h2>
                <p className="text-emerald-400 font-black italic text-3xl tracking-tight">You've reached the destination.</p>
              </div>

              <div className="space-y-8 max-w-xl mx-auto">
                <div className="bg-white/5 p-10 rounded-[3rem] border-4 border-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-8">Final Standings</p>
                  <div className="space-y-6">
                    {users.slice(0, 5).map((u, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={u.id}
                        className={`flex items-center justify-between p-6 rounded-3xl border-2 ${
                          idx === 0 
                            ? "bg-yellow-500 text-black border-white scale-105 shadow-2xl" 
                            : "bg-white/5 border-white/10 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black w-10">#{idx + 1}</span>
                          <span className="text-2xl font-black tracking-tight">{u.name}</span>
                        </div>
                        <span className="text-3xl font-mono font-black">{u.score}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <p className="text-white/20 font-black uppercase tracking-widest text-xs pt-8">
                  Thank you for playing. Drive safely!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Update Toast */}
      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-black px-6 py-4 rounded-2xl shadow-2xl border-2 border-purple-500 flex items-center gap-4"
          >
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Sparkles className="text-purple-600 w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-black text-xs uppercase tracking-widest">Update Available</p>
              <p className="text-[10px] text-slate-500 font-bold">New features are ready for you!</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Refresh Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Version Tracking */}
      <footer className="max-w-5xl mx-auto px-8 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">RoadSafety Quest v1.1.0</p>
        <p className="text-[10px] font-mono">Last Updated: 2026-03-10 01:45:09</p>
      </footer>
    </div>
  );
}
