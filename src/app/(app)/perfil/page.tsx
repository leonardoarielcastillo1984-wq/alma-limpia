import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { PerfilClient } from "./PerfilClient";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <PerfilClient user={user} />;
}
