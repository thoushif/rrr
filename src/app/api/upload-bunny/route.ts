import { NextResponse } from "next/server";
import path from "path";
import uuidByString from "uuid-by-string";
import {
  createBunnyVideo,
  uploadVideoToBunny,
  cleanupVideoFiles,
  generatePlaybackUrl,
  listVideosInLibrary,
} from "@/lib/bunny";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// upload video to bunny
export async function POST(req: Request) {
  const { videoTitle, initialUrl, userId } = await req.json();
  const requestId = uuidByString(initialUrl);
  try {
    if (!requestId) {
      return NextResponse.json(
        { error: "No requestId provided" },
        { status: 400 }
      );
    }

    // Check if video already exists
    const existingRecord = await prisma.recordRequest.findUnique({
      where: { requestId },
      select: {
        bsOriginalVideoId: true,
        requestId: true,
      },
    });

    if (existingRecord) {
      console.log("Video already exists in database, checking bunny library");
      const videosData = await listVideosInLibrary();
      const video = videosData.items.find(
        (video: any) => video.title == existingRecord.requestId
      );
      if (video) {
        console.log("yes, Video already exists in bunny library");
        return NextResponse.json({
          success: true,
          requestId,
          playbackUrl: generatePlaybackUrl(video.guid),
        });
      }else{
        console.log("no, Video does not exist in bunny library, deleting record");
        // delete the record from the database
        await prisma.recordRequest.delete({
          where: { requestId },
        });
      }
    }


    // Create new record in database
    await prisma.recordRequest.create({
      data: {
        userId,
        requestId,
        originalUrl: initialUrl,
        videoTitle,
        status: "pending",
      },
    });

    // Convert video using yt-dlp
    const ytDlpResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/yt-dlp`,
      {
        method: "POST",
        body: JSON.stringify({ requestId, url: initialUrl }),
      }
    );

    if (ytDlpResponse.status !== 200) {
      // Update status to failed
      await prisma.recordRequest.update({
        where: { requestId },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: "Failed to convert video" },
        { status: 500 }
      );
    }
    const convertedVideo = await ytDlpResponse.json();
    console.log("converted video response", convertedVideo);
    const videoPath = path.join(process.cwd(),"public",  convertedVideo.videoUrl);

    if (!fs.existsSync(videoPath)) {
      // Update status to failed
      await prisma.recordRequest.update({
        where: { requestId },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }

    // Upload to Bunny Stream
    const { guid: videoId } = await createBunnyVideo(requestId);
    await uploadVideoToBunny(videoId, videoPath);

    // Update database with video ID
    await prisma.recordRequest.update({
      where: { requestId },
      data: {
        bsOriginalVideoId: videoId,
        status: "ready-for-reaction",
        videoTitle,
      },
    });

    // Cleanup
    // cleanupVideoFiles(videoPath);

    return NextResponse.json({
      success: true,
      requestId,
      playbackUrl: generatePlaybackUrl(videoId),
    });
  } catch (error) {
    console.error("Upload Error:", error);
    // Update status to failed if there's an error
    if (requestId) {
      await prisma.recordRequest.update({
        where: { requestId },
        data: { status: "failed" },
      });
    }
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
