import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Kita matikan AI dulu, kita tes jalur komunikasi
  return NextResponse.json({ 
    reply: "🟢 TES KONEKSI: SUKSES! Jalur aman, Bang. Masalahnya ada di AI Key/Model." 
  });
}