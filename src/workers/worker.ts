#!/usr/bin/env node
// require("ts-node/register");

import { Worker } from "bullmq";
import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { createBunnyVideo } from "@/lib/bunny";
const prisma = new PrismaClient();

const videoWorker = new Worker(
  "video-processing",
  async (job) => {
    const { jobId } = job.data;
    console.log(`Processing job: ${jobId}`);
    const request = await prisma.recordRequest.findUnique({
      where: { requestId: jobId, status: "submitted" },
    });
    if (!request) {
      console.log(`Request ${jobId} not found or not submitted`);
      return;
    }
    const originalVideo = path.join(
      process.cwd(),
      "public",
      jobId,
      "video.mp4"
    );
    const reactionVideo = path.join(
      process.cwd(),
      "public",
      jobId,
      "reaction",
      "video.mp4"
    );
    const outputDir = path.join(process.cwd(), "public", jobId, "merged");
    const outputPath = path.join(outputDir, "video.mp4");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      originalVideo, // First input video
      "-i",
      reactionVideo, // Second input video
      "-filter_complex",
      "[0:v]scale=1280:720[main];[1:v]scale=320:240[pip];[main][pip]overlay=W-w-10:H-h-10", // Scale main video to 720p, PiP to 320x240, position at bottom-right
      "-c:v",
      "libx264", // Use H.264 codec
      "-preset",
      "fast", // Encoding preset
      "-crf",
      "23", // Quality setting (lower = better quality, higher file size)
      outputPath, // Output file path
    ]);

    // Handle process events
    ffmpeg.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on("data", async (data) => {
      // get the progress of the ffmpeg process, from
      const progress = data.toString().match(/time=(\d{2}:\d{2}:\d{2})/);
      if (progress) {
        console.log(`Progress: ${progress[1]}`);
        await prisma.recordRequest.update({
          where: { requestId: jobId },
          data: { status: "processing" },
        });
      }
      console.error(`stderr: ${data}`);
    });

    ffmpeg.on("close", async (code) => {
      if (code === 0) {
        console.log(
          "Video merge completed successfully, uploading to Bunny Stream"
        ); // Create video entry in Bunny Stream
        const { guid: videoId } = await createBunnyVideo(`merged-${jobId}`);

        // Convert File to Buffer
        const arrayBuffer = await fs.promises.readFile(outputPath);
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
          throw new Error("Failed to upload mergedvideo");
        }
        console.log("merged video uploaded to Bunny Stream");
        await prisma.recordRequest.update({
          where: { requestId: jobId  },
          data: { status: "completed",bsReactionVideoId: videoId },
        });
        const requestIdFolderPath = path.join(process.cwd(), "public", jobId);
        if (fs.existsSync(requestIdFolderPath)) {
          fs.rmSync(requestIdFolderPath, { recursive: true, force: true });
        }
      } else {
        console.error(`FFmpeg process exited with code ${code}`);
        await prisma.recordRequest.update({
          where: { requestId: jobId },
          data: { status: "failed" },
        });
      }
    });

    //   console.log("job completed");
    // } catch (error) {
    //   console.log("error", error);
    // }
    // delete the file from  `public/merged-videos/${jobId}.mp4`

    // fs.unlinkSync(outputPath);
    // fs.rmSync(path.dirname(outputPath), { recursive: true, force: true });

    // delete the file from  `public/reaction-videos/${jobId}.mp4`

    // await db.videoRequests.update({
    //   where: { id: jobId },
    //   data: { status: "processing" },
    // });

    // const request = await db.videoRequests.findUnique({ where: { id: jobId } });

    // // Run FFmpeg to merge videos
    // const outputPath = `/var/www/videos/${jobId}.mp4`;
    // const ffmpeg = spawn("ffmpeg", [
    //   "-i",
    //   request.originalVideo,
    //   "-i",
    //   request.reactionVideo,
    //   "-filter_complex",
    //   "[0:v][1:v] overlay=10:10",
    //   "-preset",
    //   "fast",
    //   outputPath,
    // ]);

    // ffmpeg.on("close", async () => {
    //   console.log(`Job ${jobId} completed.`);

    //   // Upload to Bunny Stream (Optional)
    //   // Upload logic here...

    //   await db.videoRequests.update({
    //     where: { id: jobId },
    //     data: { status: "completed", processedVideo: outputPath },
    //   });
    // });
  },
  { connection: { host: "localhost", port: 6379 } }
);

console.log("Worker is running...");
