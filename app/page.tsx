"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { role: "system", content: "MIKO TERMINAL v1.0.0 // SYSTEM ONLINE" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah setiap ada chat baru
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
        setHistory((prev) => [...prev, { role: "error", content: "⚠️ No Signal." }]);
      }
    } catch (error) {
      setHistory((prev) => [...prev, { role: "error", content: "⚠️ Connection Lost." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col items-center">
      {/* LOGO AREA */}
      <div className="mt-10 mb-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-b from-green-900 to-black rounded-full mx-auto border-2 border-green-500 shadow-[0_0_20px_#22c55e] flex items-center justify-center overflow-hidden">
           <span className="text-4xl">🤖</span>
        </div>
        <h1 className="text-3xl font-bold mt-4 tracking-widest text-white">
          MIKO <span className="text-purple-500">TERMINAL</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">SYSTEM ONLINE // v1.2.0</p>
      </div>

      {/* CHAT BOX */}
      <div 
        ref={scrollRef}
        className="w-full max-w-2xl h-[50vh] overflow-y-auto border border-gray-800 bg-gray-900/50 p-4 rounded-lg mb-4 shadow-inner"
      >
        {history.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right text-cyan-400" : "text-left text-green-400"}`}>
            <span className="block whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {loading && <div className="text-purple-500 animate-pulse">Computing...</div>}
      </div>

      {/* INPUT AREA */}
      <div className="w-full max-w-2xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Enter command..."
          className="flex-1 bg-gray-900 border border-green-800 text-white p-3 rounded focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-green-700 hover:bg-green-600 text-black font-bold px-6 py-3 rounded transition-all disabled:opacity-50"
        >
          SEND
        </button>
      </div>
    </main>
  );
}