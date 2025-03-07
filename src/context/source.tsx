"use client";

import { createContext, useContext, useState } from "react";

interface SourceContextType {
  initialUrl: string;
  playbackUrl: string;
  requestId: string;
  setInitialUrl: (url: string) => void;
  setPlaybackUrl: (url: string) => void;
  setRequestId: (id: string) => void;
  reset: () => void;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [requestId, setRequestId] = useState<string>("");
  const [initialUrl, setInitialUrl] = useState<string>("");
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
    
  const reset = () => {
    setInitialUrl('');
    setPlaybackUrl('');
    setRequestId('');
  };

  return (
    <SourceContext.Provider
      value={{
        initialUrl,
        playbackUrl,
        requestId,
        setInitialUrl,
        setPlaybackUrl,
        setRequestId,
        reset
      }}
    >
      {children}
    </SourceContext.Provider>
  );
}

export function useSource() {
  const context = useContext(SourceContext);
  if (context === undefined) {
    throw new Error("useSource must be used within a SourceProvider");
  }
  return context;
}
