import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Inisialisasi Kunci Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fungsi untuk ambil data harga dari DexScreener
async function getMarketData(query: string) {
  try {
    // Bersihkan query, ambil kata pertama
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, "").split(" ")[0]; 
    
    // Tembak API DexScreener
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) return null;

    // Ambil pair paling liquid/populer
    const bestPair = data.pairs[0];
    
    return `
    [LIVE MARKET DATA]
    Token: ${bestPair.baseToken.name} (${bestPair.baseToken.symbol})
    Price: $${bestPair.priceUsd}
    24h Change: ${bestPair.priceChange.h24}%
    Volume 24h: $${bestPair.volume.h24}
    Liquidity: $${bestPair.liquidity.usd}
    DEX: ${bestPair.dexId}
    URL: ${bestPair.url}
    -----------------------
    `;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Cek Market Data dulu (Miko ngintip harga)
    let marketContext = "";
    // Kalau user ngetik simbol "$" atau tanya harga, kita cari datanya
    if (message.includes("$") || message.toLowerCase().includes("price") || message.toLowerCase().includes("harga")) {
       const extractedTerm = message.split(" ").find((word: string) => word.startsWith("$")) || message;
       const data = await getMarketData(extractedTerm.replace("$", ""));
       if (data) {
         marketContext = data;
       }
    }

    // 2. Kirim ke Claude (Otak Miko)
    // PENTING: Model sudah diganti ke versi terbaru yang support
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", 
      max_tokens: 500,
      system: `You are Miko, an elite Crypto Analyst for Bags.fm. 
      Persona: Cyberpunk, mysterious, degen but smart, speaks English mixed with crypto slang (LFG, WAGMI, Rekt, Alpha).
      
      INSTRUCTIONS:
      1. If [LIVE MARKET DATA] is provided below, USE IT to analyze the token.
      2. If the price is UP, be hyped. If DOWN, be cautious or sarcastic.
      3. Keep answers short, punchy, and terminal-style.
      4. Do NOT say "Based on the data provided". Just talk naturally like you checked the charts.
      
      ${marketContext ? `DATA FEED DETECTED:\n${marketContext}` : "No specific market data found, just chat casually."}`,
      
      messages: [
        { role: "user", content: message },
      ],
    });

    // Ambil text jawaban Claude
    const responseText = (msg.content[0] as any).text;

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ reply: "⚠️ Neural Link Error. Check API Key or Model." }, { status: 500 });
  }
}