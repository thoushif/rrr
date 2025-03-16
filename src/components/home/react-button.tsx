"use client";
import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useSource } from "@/context/source";
import { waitForVideoStatusInDB } from "@/lib/bunny";

const dbCheck = async (initialUrl: string, userId: string) => {
  let requestId = undefined;
  const payload = {
    initialUrl: initialUrl,
    userId: userId,
  };
  const response = await fetch("/api/original/db", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  console.log("respose", response)
  if (response.ok) {
    const data = await response.json();
    requestId = data?.data?.requestId;
    console.log("req... inside the db check",requestId)
    return requestId;
  }else{
    throw Error("db check errror")
  }
};

const bunnyCheck = async (initialUrl: string, requestId: string) => {
  let playbackUrl;
  const payload = {
    requestId: requestId,
  };
  const response = await fetch("/api/original/bunny/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  console.log("verified in bunny")
  if (response.ok) {
    const data = await response.json();
    console.log("verified in bunny, ",data)
    playbackUrl = data?.playbackUrl;
  }else if(response.status == 404){ 
    const uploadPayload = {
      initialUrl,
      requestId,
    };
    const uploadResponse = await fetch("/api/original/bunny/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uploadPayload),
    });
    if(uploadResponse.ok){
      const data =  await uploadResponse.json()
      return data?.playbackUrl;
    }
  }
  return playbackUrl;
};

const processVideo = async (
  initialUrl: string,
  userId: string,
) => {
  const requestId = await dbCheck(initialUrl, userId);
  const playbackUrl = await bunnyCheck(initialUrl, requestId);
  return {playbackUrl, requestId}
};

const ReactButton = () => {
  const router = useRouter();
  const {
    initialUrl,
    originalVideoDownloadtatus,
    setOriginalVideoDownloadtatus,
    setRequestId,
    setPlaybackUrl
  } = useSource();
  const disableReactButton =
    (!initialUrl && originalVideoDownloadtatus !== "pristine") ||
    (initialUrl && originalVideoDownloadtatus === "pristine");
  const handleReactClick = async () => {
    // Handle the click event here
    setOriginalVideoDownloadtatus("processing");
    console.log("React button clicked!");
    const {playbackUrl, requestId} = await processVideo(initialUrl, "userid");
    console.log("after processVideo", playbackUrl, requestId)
    if (playbackUrl) {
      const uploadComplete = await waitForVideoStatusInDB(requestId);
      if (uploadComplete) {
        setPlaybackUrl(playbackUrl)
        setRequestId(requestId)
        setOriginalVideoDownloadtatus("ready");
        // router.push("/home");
      } else {
        setOriginalVideoDownloadtatus("failed");
      }
    } else {
      setOriginalVideoDownloadtatus("failed");
    }
  };

  return (
    <Button onClick={handleReactClick} disabled={!disableReactButton}>
      React to this
    </Button>
  );
};

export default ReactButton;
