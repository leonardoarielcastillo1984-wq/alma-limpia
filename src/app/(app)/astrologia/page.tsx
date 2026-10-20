import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { AstrologiaClient } from "./AstrologiaClient";

export const metadata = { title: "El Universo — ALMA LIMPIA" };

export default async function AstrologiaPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { modo } = await searchParams;
  return <AstrologiaClient modo={modo ?? "horoscopo"} hasBirthData={!!user.birthDate} />;
}
