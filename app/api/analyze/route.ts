import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getMarketData(query: string) {
  try {
    const cleanQuery = query.trim().replace(/\$/g, "");
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${cleanQuery}`);
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    const pair = data.pairs[0];
    
    return `
    [SCAN RESULT]
    > PROJECT: ${pair.baseToken.name} (${pair.baseToken.symbol})
    > PRICE: $${pair.priceUsd}
    > 24H: ${pair.priceChange.h24}%
    > VOL: $${pair.volume.h24.toLocaleString()}
    > LIQ: $${pair.liquidity.usd.toLocaleString()}
    `;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";
    let isScanning = false; // Penanda apakah user lagi minta scan

    // 1. Cek apakah ini CA (Solana Address)
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    if (caMatch) {
      isScanning = true;
      const marketInfo = await getMarketData(caMatch[0]);
      if (marketInfo) systemData = marketInfo;
    } 
    // 2. Cek apakah ini Ticker ($MIKO) atau keyword "price"
    else if (message.includes("$") || message.toLowerCase().includes("price") || message.toLowerCase().includes("cek")) {
      isScanning = true;
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query);
      if (marketInfo) systemData = marketInfo;
    }

    // 3. Status Koneksi Bags
    const bagsStatus = process.env.BAGS_API_KEY ? "ONLINE" : "OFFLINE";

    // 4. LOGIKA AI YANG SUDAH DIPERBAIKI
    const systemPrompt = `
      You are Miko, an AI Terminal Agent on Solana.
      STATUS: Bags Network ${bagsStatus}

      RULES:
      1. If [SCAN RESULT] is present below: Analyze the data like a pro trader. Be critical.
      2. If [SCAN RESULT] is MISSING but user asked to scan (e.g. sent a CA): Say "⚠️ Data not found on DexScreener. Check CA."
      3. If user is just CHATTING (saying 'hi', 'gm', 'who are you'): DO NOT SCAN. Just chat back in a cool, cyberpunk style.
      4. Keep answers short (max 2-3 sentences).

      MARKET DATA:
      ${systemData || (isScanning ? "SCAN_FAILED" : "NO_SCAN_NEEDED")}
    `;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const responseText = (msg.content[0] as any).text;
    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "⚠️ SYSTEM ERROR." }, { status: 500 });
  }
}