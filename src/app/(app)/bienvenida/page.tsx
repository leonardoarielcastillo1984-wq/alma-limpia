import { getCurrentUser } from "@/server/auth";
import { BienvenidaClient } from "./BienvenidaClient";

export const metadata = { title: "Bienvenida — ALMA LIMPIA" };

export default async function BienvenidaPage() {
  const user = await getCurrentUser();
  return <BienvenidaClient initialName={user?.profile?.displayName ?? user?.name ?? ""} />;
}
