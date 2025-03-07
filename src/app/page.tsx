"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSource } from "@/context/source";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { initialUrl, setInitialUrl } = useSource();
  useEffect(() => {
    setInitialUrl("https://www.youtube.com/shorts/fF6iaKc2xek");
    console.log("setting  initialUrl");
  }, []);
  return (
    <div className="w-full max-w-[400px] p-4 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-8">RRR</h1>
      <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder="Paste reel link here..."
          value={initialUrl}
          className="w-full"
          onChange={(e) => setInitialUrl(e.target.value)}
        />
      </div>
      <div className="mt-4 w-full max-w-md">
        <Link href="/home" className="w-full">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            React to this..
          </Button>
        </Link>
      </div>
    </div>
  );
}
