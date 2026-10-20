import { Starfield } from "@/components/cosmic/Starfield";
import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <Starfield density={50} />
      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-28 pt-6 pt-safe">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
