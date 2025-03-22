"use client"
import OriginalDownloadCheck from "@/components/home/original-download";
import ReactButton from "@/components/home/react-button";
import ReactInput from "@/components/home/react-input";
import ReactLoader from "@/components/home/react-loader";
import { Button } from "@/components/ui/button";
import { useSource } from "@/context/source";
import Link from "next/link";
import React from "react";

export default function Home() {
  const { requestId, playbackUrl, originalVideoDownloadtatus } = useSource();
  

  if(!playbackUrl && originalVideoDownloadtatus != "ready") return (
    <div className="w-full max-w-[400px] p-4 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-8">RRR</h1>
      <ReactInput />
      <div className=" flex flex-row mt-4 w-full max-w-md gap-3">
        <ReactButton />
        <Link href="/dashboard" className="w-full">
        <Button>Go to dashboard</Button>
            
        </Link>
      </div>
      
    </div>
  );

  return (
     <div className="w-full h-full">
      <OriginalDownloadCheck />
      </div>

  )
}
