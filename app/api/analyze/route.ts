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
    
    // Kalau DexScreener gak nemu data, return NULL (Jangan ngarang!)
    if (!data.pairs || data.pairs.length === 0) return null;
    
    const pair = data.pairs[0];
    return `
    [DATA FOUND]
    > NAME: ${pair.baseToken.name} (${pair.baseToken.symbol})
    > PRICE: $${pair.priceUsd}
    > MKTCAP: $${pair.fdv}
    > VOL 24H: $${pair.volume.h24.toLocaleString()}
    `;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";
    let detectedCA = "";
    let bagsLink = "";

    // 1. DETEKSI CA (Solana Address)
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    if (caMatch) {
      detectedCA = caMatch[0];
      // Bikin Link Otomatis ke Website Bags
      bagsLink = `https://bags.fm/tokens/${detectedCA}`; 
      
      const marketInfo = await getMarketData(detectedCA);
      
      if (marketInfo) {
        // SKENARIO 1: Data Ada di DexScreener
        systemData = marketInfo + `\n> [OFFICIAL LINK]: ${bagsLink}`;
      } else {
        // SKENARIO 2: Data Belum Ada (Koin Baru Lahir)
        systemData = `[STATUS: NEW_LAUNCH]
        > CA: ${detectedCA}
        > NOTE: Token is too new for global scanners.
        > ACTION: Click the official link below to view live price on Bags.
        > LINK: ${bagsLink}`;
      }
    } 
    // 2. LOGIKA CHAT BIASA
    else if (message.includes("$")) {
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query);
      systemData = marketInfo || "Token not found.";
    }

    // 3. OTAK AI (DIPAKSA JUJUR)
    const systemPrompt = `
      You are Miko Terminal.
      
      CRITICAL RULES:
      1. IF [DATA FOUND]: Show the stats.
      2. IF [STATUS: NEW_LAUNCH]: Do NOT invent a price. Say "⚠️ Global data syncing..." and provide the [OFFICIAL LINK] from the data feed.
      3. NEVER hallucinate/make up numbers like "4321 CRED". If data is missing, provide the link.
      4. If user sends a CA, ALWAYS give them the bags.fm link.

      DATA FEED:
      ${systemData || "User is chatting casually."}
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