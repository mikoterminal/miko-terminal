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
    [STATUS: FOUND]
    > NAME: ${pair.baseToken.name} (${pair.baseToken.symbol})
    > PRICE: $${pair.priceUsd}
    > 24H: ${pair.priceChange.h24}%
    > VOL: $${pair.volume.h24.toLocaleString()}
    > LIQ: $${pair.liquidity.usd.toLocaleString()}
    > LINK: ${pair.url}
    `;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";
    let detectedCA = "";

    // 1. DETEKSI CA (Termasuk Address Bags yang akhiran "BAGS")
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    if (caMatch) {
      detectedCA = caMatch[0];
      const marketInfo = await getMarketData(detectedCA);
      // Kalau data ketemu, pakai data itu. Kalau gak, kasih link manual.
      systemData = marketInfo || `[STATUS: NOT_FOUND] CA detected (${detectedCA}), but DexScreener hasn't indexed it yet (Too new/No Liquidity). CHECK MANUALLY: https://dexscreener.com/solana/${detectedCA}`;
    } 
    // 2. Cek Ticker Biasa ($MIKO)
    else if (message.includes("$") || message.toLowerCase().includes("price")) {
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query);
      systemData = marketInfo || "[STATUS: FAILED] Ticker not found.";
    }

    // 3. SYSTEM PROMPT (PERINTAH KERAS BIAR GAK HALUSINASI)
    const systemPrompt = `
      You are Miko, a Crypto Terminal.
      
      STRICT RULES:
      1. IF [STATUS: FOUND]: Display the data clearly. Say "Target acquired."
      2. IF [STATUS: NOT_FOUND]: Do NOT say "beep boop". SAY EXACTLY: "⚠️ Token not yet indexed by scanners. Likely too new. Check this link:" and paste the manual link provided in DATA FEED.
      3. IF USER CHATS (Hi/Gm): Just reply casually ("System online", "Gm dev").
      4. DO NOT make up fake prices.

      DATA FEED:
      ${systemData || "USER_IS_JUST_CHATTING"}
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
    return NextResponse.json({ reply: "⚠️ SYSTEM OVERLOAD." }, { status: 500 });
  }
}