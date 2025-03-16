"use client"
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ResizablePanes from "../reaction-recorder/recorder-home";
import { useSource } from "@/context/source";
const OriginalDownloadCheck = () => {
  const { requestId, playbackUrl, originalVideoDownloadtatus } = useSource();

  if (originalVideoDownloadtatus != "ready") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-2xl font-bold mb-4"> getting the video </span>
        <Loader2 className="h-10 w-10 animate-spin" />
        {/* start a timer, if it's been 10 seconds, show a message */}
        {/*          
        {timer > 10 && (
          <div className="flex flex-col items-center justify-center">
            If its taking too long, please try this link:{" "}
            <Button onClick={() => router.push("/home")}>Home</Button>
          </div>
        )} */}
        {/* show a button to router navigate to home */}
      </div>
    );
  }
  return (
    <div className="w-full h-full">
      {requestId && playbackUrl && originalVideoDownloadtatus == "ready" && (
        // <div className="flex flex-col items-center justify-center h-full">
        //   <h1 className="text-2xl font-bold mb-4">Original Download</h1>
        //   <p className="text-lg mb-8">Your original download is ready!</p>
        //   <Button
        //     variant="outline"
        //     onClick={() => router.push("/home")}
        //   >
        //     Go to Home
        //   </Button>
        // </div>
        // <div>here goes the remeianing app</div>
        <ResizablePanes />
      )}
    </div>
  );
};

export default OriginalDownloadCheck;
