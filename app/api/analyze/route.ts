import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Setup
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fungsi Cek Harga (DexScreener)
async function getMarketData(query: string) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    const bestPair = data.pairs[0];
    
    return `
    [LIVE DATA]
    Coin: ${bestPair.baseToken.name}
    Price: $${bestPair.priceUsd}
    24h: ${bestPair.priceChange.h24}%
    Link: ${bestPair.url}
    `;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";

    // Cek Harga jika ada simbol $
    if (message.includes("$") || message.toLowerCase().includes("price")) {
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query.replace("$", ""));
      if (marketInfo) systemData += marketInfo;
    }

    // Panggil Claude (Model Haiku - Paling Aman & Cepat)
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      system: `You are Miko, a cyberpunk AI agent.
      Current Status: ${process.env.BAGS_API_KEY ? "CONNECTED" : "OFFLINE_MODE"}
      
      INSTRUCTIONS:
      - Style: Short, cool, terminal hacker style.
      - If user asks for price and [LIVE DATA] is present, use it.
      - If no data, just chat casually.
      
      MARKET DATA FEED:
      ${systemData || "None"}`,
      messages: [{ role: "user", content: message }],
    });

    return NextResponse.json({ reply: (msg.content[0] as any).text });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "⚠️ SYSTEM FAILURE. Check API Key." }, { status: 500 });
  }
}