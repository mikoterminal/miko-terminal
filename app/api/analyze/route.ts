import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Setup Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fungsi Cek Market (DexScreener)
async function getMarketData(query: string) {
  try {
    // Bersihkan query
    const cleanQuery = query.trim().replace(/\$/g, "");
    
    // Cek ke DexScreener
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${cleanQuery}`);
    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) return null;

    // Ambil pair terbaik (biasanya yang likuiditasnya paling tinggi)
    const pair = data.pairs[0];
    
    return `
    [TERMINAL SCAN RESULT]
    > PROJECT: ${pair.baseToken.name} (${pair.baseToken.symbol})
    > PRICE: $${pair.priceUsd}
    > AGE: ${pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toLocaleDateString() : "Unknown"}
    > 24H CHG: ${pair.priceChange.h24}%
    > VOL 24H: $${pair.volume.h24.toLocaleString()}
    > LIQUIDITY: $${pair.liquidity.usd.toLocaleString()}
    > DEX: ${pair.dexId}
    > URL: ${pair.url}
    `;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    let systemData = "";
    let detectedToken = "";

    // === LOGIKA BARU: DETEKSI CA SOLANA OTOMATIS ===
    // Regex ini mendeteksi string panjang khas Solana Address (32-44 karakter)
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const caMatch = message.match(solanaAddressRegex);

    if (caMatch) {
      // KASUS 1: User kirim CA
      detectedToken = caMatch[0];
      const marketInfo = await getMarketData(detectedToken);
      if (marketInfo) systemData = marketInfo;
      
    } else if (message.includes("$") || message.toLowerCase().includes("price") || message.toLowerCase().includes("analisa")) {
      // KASUS 2: User kirim Ticker ($MIKO) atau tanya harga
      const query = message.split(" ").find((w: string) => w.startsWith("$")) || message;
      const marketInfo = await getMarketData(query);
      if (marketInfo) systemData = marketInfo;
    }

    // Status Koneksi (Visual)
    const connectionStatus = process.env.BAGS_API_KEY ? "LINKED_TO_BAGS" : "STANDALONE";

    // Panggil Otak AI (Claude)
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      system: `You are Miko Terminal.
      STATUS: ${connectionStatus}
      
      TASK:
      Analyze the crypto data provided below.
      
      STYLE GUIDE:
      - If [TERMINAL SCAN RESULT] exists: Act like a professional analyst. Comment on Liquidity, Volume, and Price action.
      - If Price is UP: "Bullish divergence detected." / "Systems green."
      - If Price is DOWN: "Bearish momentum." / "Rekt imminent."
      - If NO DATA found: Say "Contract not found on scanner. Check CA."
      - Keep it short, cool, cyberpunk style.

      DATA INPUT:
      ${systemData || "NO_MARKET_DATA_FOUND"}`,
      messages: [{ role: "user", content: message }],
    });

    const responseText = (msg.content[0] as any).text;
    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "⚠️ SCAN ERROR. Manual override required." }, { status: 500 });
  }
}