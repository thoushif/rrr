import { NextResponse } from "next/server";

import { createBunnyVideo, generatePlaybackUrl, uploadVideoToBunny } from "@/lib/bunny";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { initialUrl, requestId } = await req.json();
  try {
    // Convert video using yt-dlp
    const ytDlpResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/yt-dlp`,
      {
        method: "POST",
        body: JSON.stringify({ requestId, url: initialUrl }),
      }
    );

    if (ytDlpResponse.status !== 200) {
      return NextResponse.json(
        { error: "Failed to convert video" },
        { status: 500 }
      );
    }
    const convertedVideo = await ytDlpResponse.json();
    console.log("converted video response", convertedVideo);
    const videoPath = path.join(
      process.cwd(),
      "public",
      convertedVideo.videoUrl
    );

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }

    // Upload to Bunny Stream
    const { guid: videoId } = await createBunnyVideo(requestId);
    await uploadVideoToBunny(videoId, videoPath);
    return NextResponse.json(
      { message: "Video file upload started..", playbackUrl:generatePlaybackUrl(videoId) },
      { status: 200 }
    );
  } catch (e) {
    console.log("Error during bunny upload", e);
  }
}
