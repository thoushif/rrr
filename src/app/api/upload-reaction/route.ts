import { NextResponse } from "next/server";
import {
  createBunnyVideo,
  uploadVideoToBunny,
  generatePlaybackUrl,
  listVideosInLibrary,
} from "@/lib/bunny";
import { PrismaClient } from "@prisma/client";
import videoQueue from "../../../workers/queue";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    console.log(formData);
    const videoFile = formData.get("videoFile") as File;
    const requestId = formData.get("requestId") as string;
    console.log(requestId);
    console.log(videoFile);
    if (!videoFile || !requestId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    // Check if video already exists
    const existingRecord = await prisma.recordRequest.findUnique({
      where: { requestId },
      select: {
        bsReactionVideoId: true,
        requestId: true,
      },
    });

    if (existingRecord) {
      console.log(
        "Video already exists in database, checking bunny library for reaction video"
      );
      const videosData = await listVideosInLibrary();
      const video = videosData.items.find(
        (video: any) => video.title == `reaction-${existingRecord.requestId}`
      );
      if (video) {
        console.log("yes, reaction video already exists in bunny library");
      } else {
        console.log("no, reaction video does not exist in bunny library");
        // Create video entry in Bunny Stream
        const { guid: videoId } = await createBunnyVideo(
          `reaction-${requestId}`
        );

        // Convert File to Buffer
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Bunny Stream
        const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            AccessKey: process.env.BUNNY_API_KEY!,
            "Content-Type": "application/octet-stream",
          },
          body: buffer,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload video");
        }
      }
    }

    //   if a folder with the requestId/reaction exists, prepare the folder path and return the videoUrl
    const folderPath = path.join(
      process.cwd(),
      "public",
      requestId,
      "reaction"
    );

    // create a folder with the requestId
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    const videoFileName = `video.mp4`; // Unique filename
    const reactionVideoPath = path.join(folderPath, videoFileName); // Store in the public directory

    //also save to public folder
    const arrayBuffer = await videoFile.arrayBuffer();
    fs.writeFileSync(reactionVideoPath, Buffer.from(arrayBuffer));
 

    // we need to save this to worker with the videoId
    
    // update the record request with the video id
    await prisma.recordRequest.update({
      where: { requestId },
      data: {
        bsReactionVideoId: "videoId",
        updatedAt: new Date(),
        status: "submitted",
      },
    });
    await videoQueue.add("process-video", { jobId: requestId });
    
     return NextResponse.json({
      success: true,
      message: "merging started, submitted to worker",
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
