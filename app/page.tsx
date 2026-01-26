"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { role: "system", content: "MIKO TERMINAL v1.2.0 // INITIALIZING...\n> NEURAL LINK ESTABLISHED.\n> READY FOR INPUT." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Tampilkan pesan user
    const userMsg = input;
    setHistory((prev) => [...prev, { role: "user", content: `> ${userMsg}` }]);
    setInput("");
    setLoading(true);

    try {
      // 2. Kirim ke Backend
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      // 3. Tampilkan balasan Miko
      if (data.reply) {
        setHistory((prev) => [...prev, { role: "miko", content: data.reply }]);
      } else {
        setHistory((prev) => [...prev, { role: "error", content: "⚠️ No Signal. Try again." }]);
      }
    } catch (error) {
      setHistory((prev) => [...prev, { role: "error", content: "⚠️ Connection Lost." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden flex justify-center">
      
      {/* ================= BACKGROUND GRID EFFECT ================= */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0 opactiy-50"></div>

      {/* ================= SIDEBAR PANEL (HANYA MUNCUL DI LAPTOP/PC) ================= */}
      <div className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 w-64 bg-gray-900/80 border-l border-green-800 p-4 rounded text-xs z-20 shadow-[0_0_15px_rgba(34,197,94,0.2)] backdrop-blur-sm">
        <h3 className="text-purple-400 font-bold mb-2 border-b border-purple-800 pb-1">[ SYSTEM STATUS ]</h3>
        <ul className="space-y-1 text-green-300/70 mb-6">
          <li>> CORES: ONLINE</li>
          <li>> BAGS_API: CONNECTED</li>
          <li>> DEX_FEED: ACTIVE</li>
          <li>> LATENCY: 4ms</li>
        </ul>

        <h3 className="text-purple-400 font-bold mb-2 border-b border-purple-800 pb-1">[ CONTRACT ADDRESS ]</h3>
        {/* GANTI "MASUKKAN_CA_DISINI" DENGAN CA TOKEN ABANG */}
        <div className="bg-black/50 p-2 rounded border border-green-900 break-all font-bold text-green-100 select-all cursor-pointer hover:border-green-500 transition-all">
          MASUKKAN_CA_DISINI
        </div>
        <p className="text-[10px] text-gray-500 mt-1 text-center">(Double click to copy)</p>

        <div className="mt-6 text-center">
           <a 
            href="https://www.apps.fun/" 
            target="_blank"
            className="block w-full border border-green-600 bg-green-900/30 text-green-400 py-2 rounded hover:bg-green-500 hover:text-black transition-all font-bold"
           >
            BUY ON APPS.FUN
           </a>
        </div>
      </div>
      
      {/* ================= MAIN CENTER TERMINAL ================= */}
      <div className="flex flex-col items-center z-10 p-4 w-full max-w-2xl h-screen py-10">
        {/* LOGO AREA */}
        <div className="mb-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-b from-green-900 to-black rounded-full mx-auto border-2 border-green-500 shadow-[0_0_20px_#22c55e] flex items-center justify-center overflow-hidden animate-pulse">
            <img src="/miko-logo.png" alt="Miko Terminal" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mt-4 tracking-widest text-white text-shadow-[0_0_10px_#22c55e]">
            MIKO <span className="text-purple-500">TERMINAL</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 tracking-[0.2em]">SOLANA AI ANALYST // v1.2.0</p>
          
          {/* Tombol Link ke Twitter */}
          <a 
            href="https://x.com/mikobags" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 border border-purple-500 text-purple-400 px-6 py-2 rounded text-sm hover:bg-purple-500 hover:text-black hover:scale-105 transition-all inline-block cursor-pointer hover:shadow-[0_0_15px_#a855f7]"
          >
            [ FOLLOW UPDATES ]
          </a>
        </div>

        {/* CHAT BOX */}
        <div 
          ref={scrollRef}
          className="w-full flex-1 overflow-y-auto border border-green-800/50 bg-black/80 p-4 rounded-lg mb-4 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)] backdrop-blur"
        >
          {history.map((msg, i) => (
            <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block px-3 py-2 rounded md:text-base text-sm ${
                msg.role === "user" ? "bg-gray-900 text-cyan-300 border-r-2 border-cyan-500" : 
                msg.role === "system" ? "text-xs text-gray-500 italic" :
                "bg-green-900/20 text-green-300 border-l-2 border-green-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]"
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
          {loading && <div className="text-purple-400 animate-pulse text-sm">> Neural Processing...</div>}
        </div>

        {/* INPUT AREA */}
        <div className="w-full flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Enter ticker (e.g., $SOL) or command..."
            className="flex-1 bg-black/90 border border-green-800 text-green-400 p-3 rounded focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all placeholder:text-green-800"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-green-700 hover:bg-green-500 text-black font-bold px-6 py-3 rounded transition-all disabled:opacity-50 hover:shadow-[0_0_15px_#22c55e]"
          >
            SEND_
          </button>
        </div>
      </div>
    </main>
  );
}