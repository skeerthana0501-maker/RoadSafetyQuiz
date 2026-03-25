import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Timer, Trophy, Play, CheckCircle2, XCircle, ChevronRight, Settings, Plus, Trash2, Save, LogIn, Sparkles, Crown, Link as LinkIcon, Copy, AlertCircle, Car, TrafficCone, Map as MapIcon, Navigation, ShieldCheck, Flag } from "lucide-react";
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

const ROAD_SAFETY_QUESTIONS: Question[] = [
  {
    text: "Which factor most critically determines accident severity?",
    options: ["Vehicle speed", "Road color", "Driver age", "Fuel type"],
    correctAnswer: 0
  },
  {
    text: "Reaction distance increases mainly with:",
    options: ["Vehicle weight", "Driver experience", "Speed of the vehicle", "Tire size"],
    correctAnswer: 2
  },
  {
    text: "Total stopping distance is the sum of:",
    options: ["Reaction distance + braking distance", "Speed + time", "Distance + velocity", "Friction + energy"],
    correctAnswer: 0
  },
  {
    text: "Why is night driving riskier than day driving?",
    options: ["Roads are longer", "Vehicles are heavier", "Reduced depth perception and visibility", "Less traffic signals"],
    correctAnswer: 2
  },
  {
    text: "Which condition increases braking distance the most?",
    options: ["Dry road", "Wet or slippery road", "New tires", "Low speed"],
    correctAnswer: 1
  },
  {
    text: "What is the main purpose of speed limits?",
    options: ["Increase travel time", "Reduce fuel usage", "Ensure safety based on road conditions", "Control vehicle sales"],
    correctAnswer: 2
  },
  {
    text: "Which driver behavior shows “risk compensation”?",
    options: ["Driving slower in rain", "Driving faster due to safety features like ABS", "Wearing a seatbelt", "Using indicators"],
    correctAnswer: 1
  },
  {
    text: "What happens during hydroplaning?",
    options: ["Tires grip stronger", "Tires lose contact with road due to water layer", "Engine stops", "Brakes fail"],
    correctAnswer: 1
  },
  {
    text: "Which is an example of active safety?",
    options: ["Airbags", "Seat belts", "ABS system", "Crumple zones"],
    correctAnswer: 2
  },
  {
    text: "Why is tailgating dangerous?",
    options: ["Reduces fuel consumption", "Increases braking efficiency", "Reduces reaction time to avoid collision", "Improves traffic flow"],
    correctAnswer: 2
  },
  {
    text: "Which factor most affects driver reaction time?",
    options: ["Vehicle color", "Fatigue and distraction", "Road length", "Engine capacity"],
    correctAnswer: 1
  },
  {
    text: "Safest action if someone tailgates you?",
    options: ["Brake suddenly", "Speed up", "Maintain speed and allow overtaking", "Block them"],
    correctAnswer: 2
  },
  {
    text: "Which absorbs crash impact energy?",
    options: ["Median", "Guardrails/crash barriers", "Speed breakers", "Lane markings"],
    correctAnswer: 1
  },
  {
    text: "Why are reflective signs used?",
    options: ["Decoration", "Reduce speed", "Improve visibility in low light", "Improve road quality"],
    correctAnswer: 2
  },
  {
    text: "Why does over-speeding increase risk sharply?",
    options: ["Tires wear faster", "Reaction time decreases", "Kinetic energy increases with square of speed", "Fuel burns faster"],
    correctAnswer: 2
  },
  {
    text: "Highest accident probability occurs in:",
    options: ["Straight road", "Empty highway", "Parked zone", "Sharp turn at high speed"],
    correctAnswer: 3
  },
  {
    text: "Purpose of lane discipline?",
    options: ["Save fuel", "Increase overtaking", "Maintain predictable traffic flow", "Reduce vehicle size"],
    correctAnswer: 2
  },
  {
    text: "What is a conflict point?",
    options: ["Parking area", "Toll booth", "Fuel station", "Intersection where paths cross"],
    correctAnswer: 3
  },
  {
    text: "Why are pedestrians more vulnerable?",
    options: ["Walk slowly", "Ignore signals", "Lack protective structure", "Use roads less"],
    correctAnswer: 2
  },
  {
    text: "Effect of fatigue on driving?",
    options: ["Improves focus", "Slows reaction and decision-making", "Increases energy", "Improves braking"],
    correctAnswer: 1
  },
  {
    text: "Why avoid sudden braking at high speed?",
    options: ["Increases fuel usage", "Damages engine", "Improves stopping", "Causes skidding/instability"],
    correctAnswer: 3
  },
  {
    text: "Defensive driving is based on:",
    options: ["Aggression", "High speed", "Prediction and anticipation of hazards", "Ignoring others"],
    correctAnswer: 2
  },
  {
    text: "Which reduces friction the most?",
    options: ["Dry asphalt", "Concrete", "Rough road", "Oil or mud on road"],
    correctAnswer: 3
  },
  {
    text: "Why is overtaking on curves dangerous?",
    options: ["Narrow roads", "Slower vehicles", "More signals", "Limited visibility of oncoming traffic"],
    correctAnswer: 3
  },
  {
    text: "What does “right of way” mean?",
    options: ["Right turn", "Driving on right", "Priority to proceed in traffic", "Overtaking"],
    correctAnswer: 2
  },
  {
    text: "Safe speed during heavy rain?",
    options: ["Same as normal", "Maximum speed", "Reduced based on visibility and grip", "Higher speed"],
    correctAnswer: 2
  },
  {
    text: "Why speed breakers near schools?",
    options: ["Decoration", "Increase traffic", "Control pollution", "Reduce speed for safety"],
    correctAnswer: 3
  },
  {
    text: "Function of road markings?",
    options: ["Beautification", "Increase friction", "Reduce cost", "Guide and regulate traffic"],
    correctAnswer: 3
  },
  {
    text: "Most effective accident prevention?",
    options: ["Driving fast", "Using horn", "Ignoring signals", "Following rules and staying alert"],
    correctAnswer: 3
  },
  {
    text: "Why is driver training important?",
    options: ["Learn vehicle color", "Reduce fuel use", "Increase speed", "Improve skills and decision-making"],
    correctAnswer: 3
  }
];

interface ActiveQuestion {
  text: string;
  options: string[];
  index: number;
  total: number;
}

const RoadAnimation = () => (
  <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden opacity-20">
    <motion.div 
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/4 text-white/20"
    >
      <Car size={120} />
    </motion.div>
    <motion.div 
      initial={{ x: "200%" }}
      animate={{ x: "-200%" }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5 }}
      className="absolute bottom-1/4 text-white/10"
    >
      <Car size={80} className="scale-x-[-1]" />
    </motion.div>
    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 border-t border-b border-dashed border-white/10" />
  </div>
);

const RoadSignPattern = () => {
  const signs = [TrafficCone, ShieldCheck, Navigation, MapIcon, AlertCircle, Car, Flag];
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-4 md:grid-cols-8 gap-16 p-10 overflow-hidden">
      {Array.from({ length: 64 }).map((_, i) => {
        const Icon = signs[i % signs.length];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.01 }}
            className="text-white/40"
          >
            <Icon size={48} className={i % 2 === 0 ? "rotate-12" : "-rotate-12"} />
          </motion.div>
        );
      })}
    </div>
  );
};

const TrafficLight = () => (
  <div className="flex flex-col gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 shadow-lg">
    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
    <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-30" />
    <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-30" />
  </div>
);

const BackgroundAnimation = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505]">
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&q=80&w=2000')`,
        filter: 'brightness(0.4) saturate(1.3) contrast(1.2)'
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
    <RoadSignPattern />
    <RoadAnimation />
    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
  </div>
);

const SessionEndedView = ({ onHostLogin }: { onHostLogin: () => void }) => (
  <div className="min-h-screen bg-[#1A0B2E] flex items-center justify-center p-4 font-sans text-white">
    <BackgroundAnimation />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 backdrop-blur-xl p-8 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/10 shadow-2xl max-w-md text-center space-y-6"
    >
      <div className="bg-purple-500/20 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <XCircle className="text-purple-400 w-10 h-10" />
      </div>
      <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Session Ended</h2>
      <p className="text-purple-100 serif italic text-lg">
        This quiz session has already concluded. You can't join this one anymore!
      </p>
      <div className="space-y-4">
        <button
          onClick={() => window.location.href = window.location.origin}
          className="w-full bg-white text-black py-4 rounded-2xl font-black hover:scale-[1.02] transition-all"
        >
          START YOUR OWN SESSION
        </button>
        <button
          onClick={onHostLogin}
          className="w-full bg-white/5 text-purple-200 py-3 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
        >
          <Crown size={16} /> HOST LOGIN
        </button>
      </div>
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
  const [showShareModal, setShowShareModal] = useState(false);
  const audioRef = useRef<{ correct: HTMLAudioElement | null, incorrect: HTMLAudioElement | null }>({ correct: null, incorrect: null });
  const currentVersion = "1.1.1-20260310-0145";

  useEffect(() => {
    // Using extremely reliable sound URLs
    audioRef.current.correct = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
    audioRef.current.incorrect = new Audio("https://www.soundjay.com/buttons/sounds/button-10.mp3");
    
    // Set volumes
    if (audioRef.current.correct) audioRef.current.correct.volume = 0.5;
    if (audioRef.current.incorrect) audioRef.current.incorrect.volume = 0.5;
  }, []);

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const playSound = (type: 'correct' | 'incorrect') => {
    if (!isSoundEnabled) return;
    const sound = audioRef.current[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay errors
    }
  };

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
            
            // Play sound based on user's answer
            const currentUser = data.leaderboard.find((u: any) => u.id === userId);
            if (currentUser && currentUser.answeredCorrectly) {
              playSound('correct');
            } else if (selectedAnswer !== null) {
              playSound('incorrect');
            }
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
          className="bg-white/10 backdrop-blur-xl p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 text-center space-y-8"
        >
          <div className="bg-purple-500/20 p-5 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto">
            <LogIn className="text-purple-400 w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Host Access Required</h2>
            <p className="text-purple-100 serif italic">This quiz has concluded. Enter host password to view results.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-black uppercase tracking-widest text-purple-200 ml-2">Host Password</label>
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
              className="w-full bg-transparent text-purple-200 py-2 rounded-2xl font-bold text-xs hover:text-white transition-all"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  useEffect(() => {
    if (isOrganizer && quizState === "setup" && manualQuestions.length === 0) {
      setManualQuestions(ROAD_SAFETY_QUESTIONS);
    }
  }, [isOrganizer, quizState]);

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
      return (
        <>
          <SessionEndedView onHostLogin={() => setShowHostAuth(true)} />
          <AnimatePresence>
            {showHostAuth && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#1A0B2E] p-8 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-xs w-full space-y-6 text-center"
                >
                  <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="text-purple-400 w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-widest">Host Login</h3>
                    <p className="text-purple-300/50 text-xs italic serif">Enter password to claim session</p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="password"
                      value={hostAuthPassword}
                      onChange={(e) => setHostAuthPassword(e.target.value)}
                      placeholder="Host Password"
                      className={`bg-white/5 border ${hostAuthError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-colors`}
                      onKeyDown={(e) => e.key === "Enter" && handleHostAuthSubmit()}
                    />
                    {hostAuthError && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Invalid Password</p>}
                    <button
                      onClick={handleHostAuthSubmit}
                      className="w-full bg-purple-500 hover:bg-purple-600 py-3 rounded-xl font-black transition-all uppercase tracking-widest text-sm"
                    >
                      VERIFY
                    </button>
                    <button
                      onClick={() => setShowHostAuth(false)}
                      className="text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      );
    }
    
    if (quizState === "setup") {
      if (isOrganizer) {
        return (
          <div className="min-h-screen bg-[#1A0B2E] font-sans text-white p-4 md:p-8">
            <BackgroundAnimation />
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">Quiz Setup</h2>
                  <p className="text-purple-200 serif italic">Design your custom session</p>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-white/5 hover:bg-white/10 px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all text-sm"
                  >
                    <LinkIcon size={18} /> Share Link
                  </button>
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-1 md:flex-none">
                    <input 
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Topic (e.g. 80s Pop)"
                      className="bg-transparent px-3 md:px-4 py-2 outline-none text-sm w-full md:w-48"
                    />
                    <button
                      onClick={generateAIQuestions}
                      disabled={isGenerating || !topic.trim()}
                      className="bg-purple-500 hover:bg-purple-600 px-3 md:px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      AI
                    </button>
                  </div>
                  <button
                    onClick={() => setManualQuestions(ROAD_SAFETY_QUESTIONS)}
                    className="bg-emerald-500 hover:bg-emerald-600 px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all shadow-lg text-sm"
                  >
                    <CheckCircle2 size={18} /> Reset Set
                  </button>
                  <button
                    onClick={addQuestion}
                    className="bg-white/5 hover:bg-white/10 px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all text-sm"
                  >
                    <Plus size={18} /> Add
                  </button>
                  <button
                    onClick={handleSetupSubmit}
                    disabled={manualQuestions.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 md:px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 text-sm"
                  >
                    <Save size={18} /> Finalize
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
                    className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl md:rounded-[2rem] space-y-6 relative group"
                  >
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      className="absolute top-4 right-4 md:top-6 md:right-6 text-white/20 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-200">Question {qIdx + 1}</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(qIdx, e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full bg-transparent text-xl md:text-2xl font-bold border-b-2 border-white/10 focus:border-purple-500 outline-none pb-2 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3 bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
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
                            className="bg-transparent flex-1 font-medium outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {manualQuestions.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-white/10">
                    <p className="text-purple-200 font-bold uppercase tracking-widest">No questions added yet</p>
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
            <div className="text-center space-y-8 max-w-md w-full">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse border border-white/10">
                <Settings className="text-purple-400 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter">Waiting for Organizer</h2>
                <p className="text-purple-100 italic serif">The questions are being prepared. Hang tight!</p>
              </div>
              
              <div className="pt-8 border-t border-white/5">
                {!showHostAuth ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-4">Are you the host?</p>
                    <button 
                      onClick={() => setShowHostAuth(true)}
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold transition-colors"
                    >
                      <Crown size={16} /> Enter Setup Mode
                    </button>
                  </>
                ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Host Authentication</p>
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
                          className="text-[10px] font-bold text-white/40 hover:text-white/60 uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="min-h-screen bg-[#1A0B2E] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <BackgroundAnimation />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-3xl md:rounded-[3rem] border-4 md:border-8 border-white/20 shadow-2xl space-y-8 md:space-y-10"
        >
          <div className="text-center space-y-4">
            <div className="bg-yellow-500 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(234,179,8,0.3)] border-4 border-black">
              <Car className="text-black w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
              RoadSense <span className="text-yellow-400">Quest</span>
            </h1>
            <p className="text-purple-100 serif italic text-lg md:text-xl">
              Enter your name to start the journey.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300/60 ml-2">Player Name</label>
              <input
                type="text"
                placeholder="Type your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all text-lg font-bold"
                onKeyDown={(e) => e.key === "Enter" && joinGame()}
              />
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={joinGame}
                disabled={!name.trim()}
                className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 border-b-8 border-emerald-700 shadow-2xl uppercase tracking-widest text-lg"
              >
                Start Journey <LogIn size={24} />
              </button>
              <button
                onClick={() => playSound('correct')}
                className="text-xs font-black text-white/60 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <AlertCircle size={14} /> Test Sound
              </button>
            </div>
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
        <header className="bg-black/40 backdrop-blur-md border-b-4 border-white/10 px-4 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-yellow-500 p-2 md:p-2.5 rounded-xl shadow-lg border-2 border-black">
              <Car className="text-black w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="font-black text-lg md:text-2xl tracking-tighter text-white uppercase leading-none italic">
                  RoadSense <span className="text-yellow-400">Quest</span>
                </span>
                <div className="hidden sm:block">
                  <TrafficLight />
                </div>
              </div>
              {isJoined && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 md:h-1.5 w-16 md:w-24 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion?.index || 0) / (currentQuestion?.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    {users.find(u => u.id === userId)?.score || 0} PTS
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled);
                  if (!isSoundEnabled) playSound('correct');
                }}
                className={`p-2 md:p-2.5 rounded-xl border-2 transition-all ${isSoundEnabled ? "bg-yellow-400 border-black text-black" : "bg-white/5 border-white/10 text-white/40"}`}
                title={isSoundEnabled ? "Mute Sound" : "Unmute Sound"}
              >
                {isSoundEnabled ? <Sparkles size={16} className="md:w-[18px] md:h-[18px]" /> : <AlertCircle size={16} className="md:w-[18px] md:h-[18px]" />}
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 md:p-2.5 rounded-xl bg-white/5 border-2 border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all hidden sm:flex"
                title="Toggle Fullscreen"
              >
                <Plus size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-bold border border-white/10"
            >
              <LinkIcon size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Share Quiz</span>
            </button>
            {isOrganizer && (quizState === "question" || quizState === "answer") && (
              <div className="relative">
                <button
                  onClick={() => setShowStopConfirm(!showStopConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black border-2 border-white transition-all flex items-center gap-2 shadow-lg"
                >
                  <XCircle size={12} className="md:w-[14px] md:h-[14px]" /> STOP
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
            <div className="flex items-center gap-2 md:gap-3 bg-blue-600 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border-2 border-white shadow-lg">
              <Users size={14} className="text-white md:w-[18px] md:h-[18px]" />
              <span className="text-xs md:text-sm font-black text-white">{users.length}</span>
            </div>
            {quizState === "question" && (
              <div className="flex items-center gap-2 md:gap-3 bg-emerald-500 text-white px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-lg border-2 border-white">
                <Timer size={14} className="text-white md:w-[18px] md:h-[18px]" />
                <span className="text-xs md:text-sm font-mono font-black">{timer}s</span>
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
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            >
              <div className="md:col-span-2 space-y-6 md:space-y-8">
                <div className="bg-white/5 backdrop-blur-xl p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/10 shadow-2xl">
                  <div className="space-y-2 mb-8 md:mb-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Ready to Start?</h2>
                      {isOrganizer && (
                        <span className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">
                          Organizer
                        </span>
                      )}
                    </div>
                    <p className="text-purple-100 serif italic text-base md:text-lg">
                      The session is configured and ready.
                    </p>
                  </div>

                  {isOrganizer ? (
                    <div className="space-y-6 md:space-y-8">
                      <div className="bg-emerald-500/10 p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-emerald-500/20 flex flex-col items-center text-center space-y-4">
                        <div className="bg-emerald-500 p-3 rounded-full">
                          <CheckCircle2 className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-emerald-400">Quiz is Ready!</h3>
                          <p className="text-purple-100 text-sm">The invitation link is ready to be shared.</p>
                        </div>
                        <div className="w-full bg-black/20 p-4 rounded-xl flex items-center justify-between gap-4 border border-white/5">
                          <code className="text-xs font-mono text-purple-200 truncate">
                            {window.location.origin}?session={sessionId}
                          </code>
                          <button 
                            onClick={copyLink}
                            className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                          >
                            {copied ? "COPIED!" : "COPY LINK"}
                          </button>
                        </div>
                        <div className="flex items-start gap-2 text-left bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                          <p className="text-[10px] text-amber-100 leading-tight">
                            <span className="font-bold text-amber-400">Note:</span> Share the link above. Do not copy the URL from your browser's address bar if you are using AI Studio.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={startQuiz}
                        className="w-full bg-emerald-500 text-white py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl flex items-center justify-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl border-b-8 border-emerald-700 uppercase tracking-tighter"
                      >
                        <Play fill="white" size={24} /> GO! Start Session
                      </button>
                    </div>
                  ) : (
                    <div className="bg-purple-500/10 p-8 rounded-3xl md:rounded-[2rem] border border-purple-500/20 text-center">
                      <p className="text-purple-100 font-bold uppercase tracking-widest animate-pulse">Waiting for Organizer to start...</p>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-black">{config.numQuestions}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Questions</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-black">{config.timePerQuestion}s</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Per Question</div>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs font-bold text-purple-200 uppercase tracking-widest">Session ID</p>
                    <p className="font-mono font-bold text-purple-100">#{sessionId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-white/10 h-fit">
                <h3 className="font-black mb-6 text-purple-200 uppercase text-[10px] tracking-[0.3em]">
                  Players Joined ({users.length})
                </h3>
                <div className="space-y-3 md:space-y-4">
                  {users.map((u) => (
                    <motion.div 
                      layout
                      key={u.id} 
                      className="flex items-center gap-4 p-3 md:p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block text-sm md:text-base">{u.name}</span>
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
              <div className="text-center space-y-6 md:space-y-8">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-400 text-black p-1.5 md:p-2 rounded-lg rotate-3 shadow-lg border-2 border-black">
                        <TrafficCone size={16} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/80">
                        Question {currentQuestion.index + 1} / {currentQuestion.total}
                      </span>
                    </div>
                    <div className="flex-1 max-w-[120px] md:max-w-[200px] h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden ml-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion.index + 1) / currentQuestion.total) * 100}%` }}
                        className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      />
                    </div>
                  </div>

                  <motion.div 
                    initial={{ rotate: -1, scale: 0.95 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="bg-black/60 backdrop-blur-2xl text-white px-6 py-8 md:px-10 md:py-12 rounded-2xl md:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                    <h2 className="text-xl md:text-5xl font-black leading-tight tracking-tighter uppercase">
                      {currentQuestion.text}
                    </h2>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
                        relative p-6 md:p-8 rounded-2xl md:rounded-[2rem] text-left transition-all border-4 flex items-center justify-between group shadow-2xl
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
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg md:text-2xl border-4 ${
                          isSelected ? "bg-black text-white border-black" : "bg-white text-black border-black"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-lg md:text-2xl font-black uppercase tracking-tight">{option}</span>
                      </div>
                      {quizState === "answer" && isCorrect && <CheckCircle2 size={32} className="text-white md:w-10 md:h-10" />}
                      {quizState === "answer" && isWrong && <XCircle size={32} className="text-white md:w-10 md:h-10" />}
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
              className="bg-white/10 backdrop-blur-2xl p-8 md:p-16 rounded-3xl md:rounded-[4rem] border-4 md:border-8 border-white/20 shadow-2xl max-w-4xl mx-auto text-center"
            >
              <div className="mb-8 md:mb-16 space-y-4">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="inline-block bg-yellow-500 p-6 md:p-10 rounded-full mb-4 md:mb-6 shadow-[0_0_60px_rgba(234,179,8,0.4)] border-4 border-black"
                >
                  <Trophy className="text-black w-12 h-12 md:w-20 md:h-20" />
                </motion.div>
                <h2 className="text-4xl md:text-8xl font-black tracking-tighter mb-2 md:mb-4 uppercase italic text-white">Final Standings</h2>
                <p className="text-emerald-400 font-black italic text-xl md:text-3xl tracking-tight">The journey concludes. Who ruled the road?</p>
              </div>

              <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
                <div className="bg-white/5 p-6 md:p-10 rounded-2xl md:rounded-[3rem] border-2 md:border-4 border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 md:mb-8">Leaderboard Badges</p>
                  <div className="space-y-2 md:space-y-6 max-h-[65vh] overflow-y-auto pr-2 scrollbar-hide hover:scrollbar-default">
                    {users.map((u, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        key={u.id}
                        className={`flex items-center justify-between p-2 md:p-6 rounded-lg md:rounded-3xl border-2 relative overflow-hidden group ${
                          idx === 0 
                            ? "bg-yellow-500 text-black border-white scale-105 shadow-2xl" 
                            : idx === 1 
                            ? "bg-slate-300 text-black border-white"
                            : idx === 2
                            ? "bg-amber-600 text-white border-white"
                            : "bg-white/5 border-white/10 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-6">
                          <div className={`w-6 h-6 md:w-12 md:h-12 rounded-md md:rounded-xl flex items-center justify-center font-black text-xs md:text-2xl border-2 ${
                            idx === 0 ? "bg-black text-yellow-500 border-black" : "bg-white/10 border-white/20"
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="text-left">
                            <span className="text-sm md:text-2xl font-black tracking-tight block truncate max-w-[100px] md:max-w-none">{u.name}</span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[6px] md:text-[10px] font-black uppercase tracking-widest px-1 py-0.5 rounded ${
                                idx === 0 ? "bg-black/20" : "bg-white/10"
                              }`}>
                                {idx === 0 ? "🏆 Grand Champion" : idx === 1 ? "🥈 Silver Racer" : idx === 2 ? "🥉 Bronze Driver" : "🏁 Finisher"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base md:text-3xl font-mono font-black">{u.score}</span>
                          <div className={`text-[6px] md:text-[10px] font-black uppercase tracking-widest ${idx < 3 ? "opacity-60" : "opacity-20"}`}>Points</div>
                        </div>
                        {idx === 0 && (
                          <motion.div 
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-8 md:pt-12 space-y-4">
                  {isOrganizer && (
                    <button
                      onClick={resetSession}
                      className="w-full bg-purple-500 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-purple-600 transition-all shadow-xl uppercase tracking-widest border-b-4 border-purple-700 active:scale-95"
                    >
                      <Plus size={20} /> START NEW JOURNEY
                    </button>
                  )}
                  <p className="text-white/20 font-black uppercase tracking-widest text-[10px] md:text-xs">
                    Thank you for playing. Drive safely!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#1A0B2E] border border-white/10 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl max-w-lg w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="bg-purple-500/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <LinkIcon className="text-purple-400 w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white">Share Your Quiz</h3>
                <p className="text-purple-300/60 serif italic text-sm md:text-base">
                  Send this link to your friends to let them join the session!
                </p>
              </div>

              <div className="bg-black/40 p-4 md:p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300/40">Direct Quiz Link</span>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <code className="text-[10px] md:text-xs font-mono text-purple-300 truncate flex-1">
                      {window.location.origin}{sessionId ? `?session=${sessionId}` : ""}
                    </code>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}${sessionId ? `?session=${sessionId}` : ""}`;
                        navigator.clipboard.writeText(link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all shrink-0"
                    >
                      {copied ? "COPIED" : "COPY"}
                    </button>
                  </div>
                </div>
                
                <div className="p-3 md:p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={16} />
                  <p className="text-[10px] md:text-xs text-amber-200/80 leading-relaxed">
                    <span className="font-bold text-amber-400">Important:</span> Do not copy the link from your browser's address bar if you are in AI Studio. Use the link above to ensure users open the quiz directly.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 md:py-4 rounded-2xl font-black transition-all text-sm md:text-base"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

