import type { PropsWithChildren } from "react";

import { AppHeader } from "@/components/layout/AppHeader";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="scroll-area">
        <div className="scroll-area-content mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
