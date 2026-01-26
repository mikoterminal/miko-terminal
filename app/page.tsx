"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { role: "system", content: "MIKO TERMINAL v1.2.0 // SYSTEM READY\n> CONNECTING TO BAGS NETWORK...\n> WAITING FOR COMMAND." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setHistory((prev) => [...prev, { role: "user", content: `> ${userMsg}` }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      if (data.reply) {
        setHistory((prev) => [...prev, { role: "miko", content: data.reply }]);
      } else {
        setHistory((prev) => [...prev, { role: "error", content: "⚠️ Signal Weak. Retrying..." }]);
      }
    } catch (error) {
      setHistory((prev) => [...prev, { role: "error", content: "⚠️ Connection Lost." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND EFFECT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0 opacity-50"></div>

      {/* MAIN TERMINAL CONTAINER */}
      <div className="z-10 w-full max-w-3xl h-[85vh] flex flex-col border border-green-900 bg-gray-900/90 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.15)] backdrop-blur-md">
        
        {/* HEADER */}
        <div className="p-6 border-b border-green-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full border border-green-500 overflow-hidden shadow-[0_0_15px_#22c55e]">
                <img src="/miko-logo.png" alt="Miko" className="w-full h-full object-cover" />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-widest text-white text-shadow">MIKO TERMINAL</h1>
                <p className="text-xs text-green-600 tracking-[0.3em]">BAGS INTEGRATION // ONLINE</p>
             </div>
          </div>
          <div className="hidden md:block">
            <a 
              href="https://x.com/mikobags" 
              target="_blank"
              className="text-xs border border-green-700 px-3 py-1 rounded hover:bg-green-500 hover:text-black transition-all"
            >
              [ @mikobags ]
            </a>
          </div>
        </div>

        {/* CHAT OUTPUT */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm md:text-base"
        >
          {history.map((msg, i) => (
            <div key={i} className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block px-4 py-2 rounded-lg max-w-[85%] ${
                msg.role === "user" ? "bg-green-900/20 text-cyan-300 border border-cyan-900/50" : 
                msg.role === "system" ? "text-gray-500 italic text-xs" :
                "text-green-300"
              }`}>
                {msg.role === "miko" && <span className="mr-2 text-green-500 font-bold">➜</span>}
                {msg.content}
              </span>
            </div>
          ))}
          {loading && <div className="text-green-500/50 animate-pulse text-xs pl-2">Analyzing market data...</div>}
        </div>

        {/* INPUT FIELD */}
        <div className="p-4 border-t border-green-800 bg-black/60">
          <div className="flex gap-2">
            <span className="text-green-500 py-3 pl-2 font-bold">{`>`}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Miko regarding Bags or Crypto..."
              className="flex-1 bg-transparent border-none text-white focus:ring-0 focus:outline-none py-3 placeholder:text-gray-700"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 bg-green-800 hover:bg-green-600 text-black font-bold rounded transition-all"
            >
              EXEC
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}