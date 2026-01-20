"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const askMiko = async () => {
    if (!input) return;
    setLoading(true);
    setResponse(""); // Kosongkan jawaban lama

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setResponse(data.result);
    } catch (error) {
      setResponse("⚠️ Error: Neural Link Disconnected.");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-green-400 p-4 font-mono">
      {/* 1. Miko Avatar */}
      <div className="relative mb-6 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-green-600 rounded-full blur opacity-75 animate-pulse"></div>
        <div className="relative rounded-full p-1 bg-black">
          <Image
            src="/miko-logo.png"
            alt="Miko"
            width={120}
            height={120}
            className="rounded-full border-2 border-green-500/50"
          />
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-2 tracking-tighter text-white">
        MIKO <span className="text-purple-500">TERMINAL</span>
      </h1>
      <p className="text-xs text-gray-500 mb-4">SYSTEM ONLINE // v1.0.0</p>

      {/* --- INI KODE BARU TWITTER --- */}
      <a 
        href="https://x.com/mikobags" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mb-8 text-xs text-purple-400 hover:text-green-400 transition tracking-widest uppercase border border-purple-900/50 px-4 py-2 rounded hover:border-green-500/50 hover:bg-purple-900/20"
      >
        [ FOLLOW UPDATES ]
      </a>
      {/* ----------------------------- */}
      {/* 2. Kotak Chat & Output */}
      <div className="w-full max-w-md space-y-4">
        
        {/* Area Jawaban Miko */}
        {response && (
          <div className="bg-gray-900/50 border border-green-500/30 p-4 rounded-lg text-sm shadow-[0_0_15px_rgba(74,222,128,0.1)]">
            <span className="text-purple-400 font-bold">MIKO &gt;</span> {response}
          </div>
        )}

        {/* Input Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command / Ask alpha..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            onKeyDown={(e) => e.key === "Enter" && askMiko()}
          />
          <button
            onClick={askMiko}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "SEND"}
          </button>
        </div>

      </div>
    </main>
  );
}