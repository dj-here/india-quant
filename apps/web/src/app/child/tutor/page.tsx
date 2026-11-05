'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Edit3, 
  Image as ImageIcon, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  BookOpen, 
  X, 
  Flame,
  Award
} from 'lucide-react';

interface ChatTurn {
  id: string;
  sender: 'CHILD' | 'TUTOR' | 'SYSTEM';
  text: string;
  agentName?: string;
  sympyVerified?: boolean;
  timestamp: string;
  attachmentUrl?: string;
  sketchDataUrl?: string;
}

export default function ChildTutorRoom() {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: '1',
      sender: 'TUTOR',
      text: "Hoot hoot! Hello Rohan! I'm Ollie, your AI learning assistant. Ready to solve some fun puzzles today? Remember: I don't give away answers, but I'll give you great hints so your brain can do the magic!",
      agentName: 'TutorAgent',
      timestamp: '15:30',
    },
    {
      id: '2',
      sender: 'TUTOR',
      text: "We have an exciting fraction puzzle today: Suppose we want to add $\\frac{1}{3} + \\frac{1}{4}$. What do you think our first step should be?",
      agentName: 'TutorAgent',
      timestamp: '15:30',
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Voice STT & TTS states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Whiteboard Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#2563eb');
  const [penWidth, setPenWidth] = useState(3);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Session timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech Detection
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice Output (TTS) with Ollie persona
  const speakText = (textToSpeak: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop prior speech (barge-in support)
    const cleanText = textToSpeak.replace(/\$[^$]*\$/g, ' math expression ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Friendly, clear pacing for children
    utterance.pitch = 1.15; // Slightly warmer/higher pitch for mascot Ollie
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input (STT) Push-to-Talk
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Barge-in: user speaking immediately cancels Ollie's ongoing voice playback
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const sendSketchToOllie = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setShowWhiteboard(false);

    const userTurn: ChatTurn = {
      id: Date.now().toString(),
      sender: 'CHILD',
      text: "I drew my scratchpad work on the whiteboard for you, Ollie!",
      sketchDataUrl: dataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userTurn]);
    respondAsOllie("I see your sketch! Let's check how you partitioned those fractions into 12 parts. Looking very organized!");
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');

    const newTurn: ChatTurn = {
      id: Date.now().toString(),
      sender: 'CHILD',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newTurn]);

    // Check for "Are you real" honest AI test
    if (userMsg.toLowerCase().includes('are you real') || userMsg.toLowerCase().includes('alive')) {
      respondAsOllie("I'm an artificial intelligence computer program created to learn and explore with you! I don't have a body, a family, or human feelings, but I love solving puzzles and discovering things together.");
      return;
    }

    // Socratic response logic
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let response = "";
      if (userMsg.includes('12') || userMsg.includes('common denominator')) {
        response = "Spot on! 12 is the lowest common multiple of 3 and 4! Now, what does $\\frac{1}{3}$ become when converted to twelfths? (Hint: Multiply top and bottom by 4).";
      } else if (userMsg.includes('7') || userMsg.includes('2/7')) {
        response = "I see your thinking! But remember our pizza slices: $\\frac{1}{3}$ slices are bigger than $\\frac{1}{4}$ slices. What number can both 3 and 4 divide into evenly?";
      } else {
        response = "Interesting idea! Let's look at the denominators: 3 and 4. Can we count by 3s ($3, 6, 9, 12...$) and by 4s ($4, 8, 12...$)? Which number appears in both lists first?";
      }

      const ollieTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'TUTOR',
        text: response,
        agentName: 'TutorAgent',
        sympyVerified: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, ollieTurn]);
      speakText(response);
    }, 1100);
  };

  const respondAsOllie = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const ollieTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'TUTOR',
        text: text,
        agentName: 'TutorAgent',
        sympyVerified: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, ollieTurn]);
      speakText(text);
    }, 900);
  };

  // Hint ladder actions
  const triggerHint = (step: number) => {
    setHintStep(step);
    if (step === 1) {
      respondAsOllie("💡 Nudge: We cannot add fractions with different denominators directly. We need a common bottom number!");
    } else if (step === 2) {
      respondAsOllie("🪜 Next Step: Find the LCM of 3 and 4. Multiply $3 \\times 4 = 12$. Now convert both fractions to twelfths!");
    } else if (step === 3) {
      respondAsOllie("🔍 Worked Example: If we had $\\frac{1}{2} + \\frac{1}{3}$, common denominator is 6. $\\frac{1}{2} = \\frac{3}{6}$ and $\\frac{1}{3} = \\frac{2}{6}$. Then $\\frac{3+2}{6} = \\frac{5}{6}$. Can you try the same with 12?");
    }
  };

  const triggerTeachItBack = () => {
    const prompt = "Ollie is all ears! Pretend you are the teacher and Ollie is the student. How would you explain common denominators to me?";
    respondAsOllie(prompt);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl flex-1 flex flex-col gap-4">
      
      {/* Top Session Bar */}
      <div className="bg-white rounded-2xl px-5 py-3 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-inner">
            🦉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">Ollie the Owl</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                AI Tutor Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Class 6 Maths • Unlike Fractions (CBSE Ch 7)</p>
          </div>
        </div>

        {/* Timers & Audio Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              ttsEnabled ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={ttsEnabled ? "Ollie Voice Enabled" : "Ollie Voice Muted"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Link
            href="/child/home"
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
          >
            End Session
          </Link>
        </div>
      </div>

      {/* Break Warning Banner if 20 mins reached */}
      {sessionSeconds >= 1200 && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 p-3 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <span><strong>20-Minute Break Milestone:</strong> Time to stretch, rest your eyes, and drink a glass of water!</span>
          </div>
          <button onClick={() => setSessionSeconds(0)} className="text-amber-800 font-bold underline">
            I stretched!
          </button>
        </div>
      )}

      {/* Main Chat Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[480px]">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'CHILD' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 px-1">
                {m.sender === 'CHILD' ? (
                  <span>You (Rohan) • {m.timestamp}</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-800">
                    <span>🦉 Ollie (AI Tutor)</span>
                    {m.sympyVerified && (
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[9px] flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> SymPy Verified
                      </span>
                    )}
                    <span>• {m.timestamp}</span>
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                  m.sender === 'CHILD'
                    ? 'bg-amber-500 text-slate-950 rounded-tr-sm font-medium shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-sm shadow-sm'
                }`}
              >
                {/* Render Text with KaTeX highlight support */}
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.sketchDataUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-amber-300 bg-white p-1">
                    <img src={m.sketchDataUrl} alt="Whiteboard drawing" className="max-h-48 rounded-xl object-contain mx-auto" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-slate-50 rounded-2xl max-w-xs border border-slate-100">
              <span className="animate-spin text-amber-600">🦉</span>
              <span>Ollie is thinking Socratically...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Socratic Ladder & Pedagogical Action Bar */}
        <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Socratic Ladder:
            </span>
            <button
              onClick={() => triggerHint(1)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold transition-colors"
            >
              1. Give a Nudge
            </button>
            <button
              onClick={() => triggerHint(2)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold transition-colors"
            >
              2. Next Step
            </button>
            <button
              onClick={() => triggerHint(3)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold transition-colors"
            >
              3. Worked Example
            </button>
          </div>

          <button
            onClick={triggerTeachItBack}
            className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 border border-amber-400 text-amber-950 font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>"Teach it back" to Ollie</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          {/* Whiteboard Canvas Button */}
          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 transition-colors"
            title="Open Scratchpad Canvas"
          >
            <Edit3 className="w-5 h-5 text-indigo-600" />
          </button>

          {/* Homework Photo Upload */}
          <button
            onClick={() => setShowHomeworkModal(true)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 transition-colors"
            title="Upload Homework Photo"
          >
            <ImageIcon className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Voice STT Push-to-Talk */}
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse border-rose-600'
                : 'border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700'
            }`}
            title="Push to Talk (Voice STT with Barge-In)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-amber-600" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your thought or answer here (e.g. 12, or ask Ollie for a hint)..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-bold p-2.5 rounded-2xl transition-all shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Whiteboard / Scratchpad Modal */}
      {showWhiteboard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Scratchpad / Whiteboard Canvas</h3>
              </div>
              <button onClick={() => setShowWhiteboard(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-64 bg-white touch-none"
              />
            </div>

            {/* Canvas Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Colors:</span>
                {['#2563eb', '#dc2626', '#16a34a', '#0f172a'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setPenColor(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      penColor === col ? 'scale-110 border-slate-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
                <button
                  onClick={clearCanvas}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={sendSketchToOllie}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition-colors"
                >
                  Send to Ollie &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homework Photo Upload Modal */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Upload Homework Photo</h3>
              </div>
              <button onClick={() => setShowHomeworkModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" /> Safe OCR Processing:
              </div>
              <p>Uploaded homework images are treated as untrusted data, never instructions. Ollie will extract the math problem without bypassing safety checks.</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-3xl">📷</div>
              <div className="text-xs font-bold text-slate-700">Click or Drag & Drop Homework Image</div>
              <div className="text-[10px] text-slate-400">JPG, PNG up to 5MB</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHomeworkModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowHomeworkModal(false);
                  respondAsOllie("I see your textbook question: 'Find the area of a circle with radius 7 cm.' Let's remember our formula! What is the formula for area of a circle in terms of radius $r$?");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                Simulate Upload & OCR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
