import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// FUNGSI CEK DATA YANG LEBIH STRICT (KETAT)
async function getSolanaTokenData(ca: string) {
  try {
    // 1. Tembak langsung ke alamat token (Pasti Akurat)
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const data = await response.json();

    // 2. Kalau kosong, langsung nyerah (Jangan maksa)
    if (!data.pairs || data.pairs.length === 0) return null;

    // 3. Ambil pair yang valid (urutkan berdasarkan likuiditas tertinggi)
    const pair = data.pairs.sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd)[0];

    return {
      found: true,
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      price: pair.priceUsd,
      mcap: pair.fdv || 0,
      liquidity: pair.liquidity.usd,
      vol24h: pair.volume.h24,
      change24h: pair.priceChange.h24,
      url: pair.url
    };
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemContext = "";
    
    // REGEX: Deteksi CA Solana (Huruf acak 32-44 karakter)
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    if (caMatch) {
      // === KASUS 1: USER KIRIM CA ===
      const ca = caMatch[0];
      const tokenData = await getSolanaTokenData(ca);
      const bagsLink = `https://bags.fm/tokens/${ca}`;

      if (tokenData && tokenData.found) {
        // JIKA DATA ADA DI DEXSCREENER
        systemContext = `
        [STATUS: DATA_FOUND]
        > TOKEN: ${tokenData.name} ($${tokenData.symbol})
        > PRICE: $${tokenData.price}
        > MCAP: $${tokenData.mcap}
        > LIQ: $${tokenData.liquidity}
        > LINK: ${tokenData.url}
        > BAGS LINK: ${bagsLink}
        
        INSTRUCTION: Present these stats cleanly.
        `;
      } else {
        // JIKA DATA KOSONG (TOKEN BARU LAHIR)
        // KITA PAKSA MIKO JUJUR, JANGAN NGARANG ANGKA!
        systemContext = `
        [STATUS: NOT_INDEXED]
        > CA: ${ca}
        > INFO: Token is too new. No trading data on DexScreener yet.
        > ACTION: Provide the Official Bags Link below so user can check manually.
        > OFFICIAL LINK: ${bagsLink}
        
        INSTRUCTION: Say "⚠️ Token data not synced yet (Too New)." and provide the link. DO NOT INVENT PRICES.
        `;
      }
    } else {
      // === KASUS 2: NGOBROL BIASA ===
      systemContext = "User is just chatting. Reply casually in Cyberpunk style.";
    }

    // SYSTEM PROMPT: PENJAGA BIAR GAK HALU
    const systemPrompt = `
      You are Miko Terminal.
      
      RULES:
      1. If [STATUS: DATA_FOUND], show the stats.
      2. If [STATUS: NOT_INDEXED], give the BAGS LINK. Do NOT make up a price like "4321 CRED". 
      3. Be concise.
      
      CONTEXT DATA:
      ${systemContext}
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
    return NextResponse.json({ reply: "⚠️ SYSTEM ERROR." }, { status: 500 });
  }
}