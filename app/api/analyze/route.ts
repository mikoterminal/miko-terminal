import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Kita pakai model "Haiku" yang paling ringan & cepat (Anti-Error)
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", 
      max_tokens: 1000,
      system: "You are Miko, a Crypto AI Agent. Speak in cool, short, cyberpunk style. Use English only.",
      messages: [
        { role: "user", content: message },
      ],
    });

    const responseText = (msg.content[0] as any).text;
    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error("Critical Error:", error);
    // Ini biar kita tau errornya apa kalau gagal lagi
    return NextResponse.json(
        { reply: "⚠️ System Failure. Error: " + (error as any).message }, 
        { status: 500 }
    );
  }
}