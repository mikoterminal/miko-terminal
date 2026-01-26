import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// FUNGSI BACA DATA (KITA PAKAI ENDPOINT KHUSUS TOKEN, LEBIH AKURAT)
async function getSolanaTokenData(ca: string) {
  try {
    // Pakai endpoint spesifik token, bukan search biasa
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) return null;

    // Ambil pair dengan likuiditas terbesar (paling valid)
    const pair = data.pairs.sort((a: any, b: any) => b.liquidity.usd - a.liquidity.usd)[0];

    return {
      found: true,
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      price: pair.priceUsd,
      mcap: pair.fdv || 0,
      liquidity: pair.liquidity.usd,
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
    
    // 1. DETEKSI CA SOLANA (Format: 32-44 Karakter)
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    // DEFAULT DATA (Kalau user cuma ngobrol)
    let systemContext = "User is just chatting. Reply casually.";

    // 2. JIKA ADA CA, KITA SCAN!
    if (caMatch) {
      const ca = caMatch[0];
      const tokenData = await getSolanaTokenData(ca);
      const bagsLink = `https://bags.fm/tokens/${ca}`;

      if (tokenData && tokenData.found) {
        // SKENARIO A: DATA KETEMU (AKURAT)
        systemContext = `
        [DATA_FOUND]
        Token: ${tokenData.name} ($${tokenData.symbol})
        Price: $${tokenData.price}
        Mkt Cap: $${tokenData.mcap}
        Liq: $${tokenData.liquidity}
        24h Change: ${tokenData.change24h}%
        Dex Link: ${tokenData.url}
        Bags Link: ${bagsLink}
        
        INSTRUCTION: Display the stats above cleanly. Be professional.
        `;
      } else {
        // SKENARIO B: DATA KOSONG (KOIN BARU LAHIR)
        // KITA PAKSA DIA JUJUR, JANGAN NGARANG ANGKA!
        systemContext = `
        [DATA_NOT_FOUND]
        CA: ${ca}
        Status: Token is newly deployed or has low liquidity. DexScreener hasn't indexed it yet.
        
        INSTRUCTION: 
        1. SAY STRICTLY: "⚠️ Token Data Not Synced Yet."
        2. DO NOT INVENT A PRICE. DO NOT SAY "4321 CRED".
        3. Provide this Official Bags Link: ${bagsLink}
        `;
      }
    }

    // 3. KIRIM KE OTAK CLAUDE (DENGAN ANCAMAN BIAR NURUT)
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      system: `You are Miko Terminal, a precise crypto analyzer.
      
      ABSOLUTE RULES:
      1. If the input contains [DATA_FOUND], output the stats exactly as shown.
      2. If the input contains [DATA_NOT_FOUND], tell the user the token is too new and give them the Link.
      3. NEVER hallucinate prices. If you don't see a dollar sign in the data, DO NOT output a price.
      4. Be concise. Cyberpunk style.
      
      CONTEXT:
      ${systemContext}`,
      messages: [{ role: "user", content: message }],
    });

    const responseText = (msg.content[0] as any).text;
    return NextResponse.json({ reply: responseText });

  } catch (error) {
    return NextResponse.json({ reply: "⚠️ SYSTEM CRITICAL ERROR." }, { status: 500 });
  }
}