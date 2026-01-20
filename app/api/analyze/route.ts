import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Setup Kunci-Kunci
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fungsi Cek Harga (DexScreener) - Paling Stabil buat Token
async function getMarketData(query: string) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    const bestPair = data.pairs[0];
    
    return `
    [LIVE MARKET FEED]
    Token: ${bestPair.baseToken.name} ($${bestPair.baseToken.symbol})
    Price: $${bestPair.priceUsd}
    Change 24h: ${bestPair.priceChange.h24}%
    Liquidity: $${bestPair.liquidity.usd}
    Market Cap: $${bestPair.fdv}
    Link: ${bestPair.url}
    `;
  } catch (e) { return null; }
}

// Fungsi Persiapan Bags API (Siap Pakai)
async function getBagsData() {
  // Nanti kita isi endpoint spesifik Bags di sini
  // Sekarang kita tes koneksi kuncinya dulu
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) return "Bags API Key Not Found";
  return "Bags API Connected (Ready for endpoints)";
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";

    // 1. Cek Apakah User Tanya Harga?
    if (message.includes("$") || message.toLowerCase().includes("price")) {
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query.replace("$", ""));
      if (marketInfo) systemData += marketInfo;
    }

    // 2. Kirim ke Otak Miko (Pakai Haiku biar Cepat & Stabil)
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      system: `You are Miko, an AI Agent on Bags.fm.
      Status: ${process.env.BAGS_API_KEY ? "CONNECTED TO BAGS_API" : "STANDALONE MODE"}
      
      INSTRUCTIONS:
      - Speak in short, cool, cyberpunk terminal style.
      - Use crypto slang (bullish, rekt, alpha, wagmi).
      - If [LIVE MARKET FEED] is provided below, use it to analyze the price.
      - Never hallucinate prices. Only use the data provided.
      
      DATA FEED:
      ${systemData || "No market data requested."}`,
      messages: [{ role: "user", content: message }],
    });

    return NextResponse.json({ reply: (msg.content[0] as any).text });

  } catch (error) {
    return NextResponse.json({ reply: "⚠️ System Error. Try again." }, { status: 500 });
  }
}