import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Terima pesan dari kamu
    const { message } = await req.json();

    // 2. Miko mikir (Kirim ke Claude)
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      // Ini kepribadian Miko:
      system: "You are Miko, an advanced AI Analyst for Bags.fm. Persona: Cyberpunk, cool, mysterious, and sharp. Use crypto slang (Alpha, bags, whale, LFG, wagmi). STRICTLY speak in English only. Never speak Indonesian. Keep answers short and punchy.",
      messages: [
        { role: "user", content: message }
      ],
    });

    // 3. Ambil jawaban
    // @ts-ignore
    const text = msg.content[0].text;
    
    return NextResponse.json({ result: text });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ result: "⚠️ Neural Link Offline. Check API Key." }, { status: 500 });
  }
}