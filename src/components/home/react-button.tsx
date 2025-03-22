"use client";
import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useSource } from "@/context/source";
import { generatePlaybackUrl, waitForVideoStatusInDB } from "@/lib/bunny";
import ReactLoader from "./react-loader";

const dbCheck = async (initialUrl: string, userId: string) => {
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
  console.log("respose", response);
  if (response.ok) {
    const data = await response.json();
    console.log("req... inside the db check", data);
    return data?.data;
  } else {
    throw Error("db check errror");
  }
};

const bunnyCheckAndUpload = async (initialUrl: string, requestId: string) => {
  let videoId;
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
  console.log("verified in bunny");
  if (response.ok) {
    const data = await response.json();
    console.log("verified in bunny, ", data);
    videoId = data?.videoId;
  } else if (response.status == 404) {
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
    if (uploadResponse.ok) {
      const data = await uploadResponse.json();
      return data?.videoId;
    }
  }
  return videoId;
};

const processVideo = async (initialUrl: string, userId: string) => {
  const dbData = await dbCheck(initialUrl, userId);
  const requestId = dbData?.requestId;
  if (dbData?.bsOriginalVideoId) {
    const playbackUrl = generatePlaybackUrl(dbData?.bsOriginalVideoId);
    return { playbackUrl, requestId };
  }
  const videoId = await bunnyCheckAndUpload(initialUrl, requestId);
  const playbackUrl = generatePlaybackUrl(videoId);
  return { playbackUrl, requestId };
};

const ReactButton = () => {
  const router = useRouter();
  const {
    initialUrl,
    originalVideoDownloadtatus,
    setOriginalVideoDownloadtatus,
    setRequestId,
    setPlaybackUrl,
  } = useSource();
  const disableReactButton =
    (!initialUrl && originalVideoDownloadtatus !== "pristine") ||
    (initialUrl && originalVideoDownloadtatus === "pristine");
  const handleReactClick = async () => {
    // Handle the click event here
    setOriginalVideoDownloadtatus("processing");
    console.log("React button clicked!");
    const { playbackUrl, requestId } = await processVideo(initialUrl, "userid");
    console.log("after processVideo", playbackUrl, requestId);
    if (playbackUrl) {
      const uploadComplete = await waitForVideoStatusInDB(requestId);
      if (uploadComplete) {
        setPlaybackUrl(playbackUrl);
        setRequestId(requestId);
        setOriginalVideoDownloadtatus("ready");
        router.push("/home");
      } else {
        setOriginalVideoDownloadtatus("failed");
      }
    } else {
      setOriginalVideoDownloadtatus("failed");
    }
  };

  return (
    <>
      <Button onClick={handleReactClick} disabled={!disableReactButton}>
        React to this
      </Button>

      <ReactLoader />
    </>
  );
};

export default ReactButton;
