import { Starfield } from "@/components/cosmic/Starfield";
import { SplashClient } from "./SplashClient";

export default function SplashPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield density={80} />
      <SplashClient />
    </main>
  );
}
