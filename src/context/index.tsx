"use client";

import { RecorderProvider } from "./RecorderContext";
import { SourceProvider } from "./source";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SourceProvider>
      <RecorderProvider>
        {children}
      </RecorderProvider>
    </SourceProvider>
  );
}
