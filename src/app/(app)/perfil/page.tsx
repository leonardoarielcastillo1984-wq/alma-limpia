import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { PerfilClient } from "./PerfilClient";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <PerfilClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthCity: user.birthCity,
        birthCountry: user.birthCountry,
        consentMemory: user.consentMemory,
        profile: user.profile ? { displayName: user.profile.displayName } : null,
        preferences: user.preferences
          ? {
              notificationsEnabled: user.preferences.notificationsEnabled,
              reduceMotion: user.preferences.reduceMotion,
              soundEnabled: user.preferences.soundEnabled,
              deckPreference: user.preferences.deckPreference,
            }
          : null,
      }}
      isAdmin={user.role === "ADMIN" || user.role === "SUPERADMIN"}
    />
  );
}
