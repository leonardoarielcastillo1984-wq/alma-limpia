import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? user.profile?.displayName ?? null,
      role: user.role,
      guest: user.isGuest,
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthCity: user.birthCity,
      birthCountry: user.birthCountry,
      sunSign: user.profile?.sunSign ?? null,
      moonSign: user.profile?.moonSign ?? null,
      risingSign: user.profile?.risingSign ?? null,
      lifePath: user.profile?.lifePath ?? null,
      credits: user.creditWallet?.balance ?? 0,
      consentMemory: user.consentMemory,
      preferences: user.preferences,
    },
  });
}
