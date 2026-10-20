import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ChakrasClient } from "./ChakrasClient";

export const metadata = { title: "Los siete chakras — ALMA LIMPIA" };

export default async function ChakrasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <ChakrasClient />;
}
