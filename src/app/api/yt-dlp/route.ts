import { spawn } from "child_process";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const reelUrl = body.url;
  const requestId = body.requestId;

  if (!reelUrl) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 },
    );
  }
//   if a folder with the requestId exists, prepare the folder path and return the videoUrl
  const folderPath = path.join(process.cwd(), "public", requestId);
  if (fs.existsSync(folderPath)) {
    console.log("folder already exists with the requestId", requestId);
    const videoUrl = `/${requestId}/video.mp4`;
    return NextResponse.json({ videoUrl: videoUrl });
  }
// create a folder with the requestId
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  } 
  const videoFileName = `video.mp4`; // Unique filename
  const outputPath = path.join(folderPath, videoFileName); // Store in the public directory

   try {
    await new Promise((resolve, reject) => {
      console.log("working on converting the video");
      const ytDlpProcess = spawn(
        "C:\\Users\\tshaik\\AppData\\Roaming\\Python\\Python313\\scripts\\yt-dlp",
        [
          "-f", "mp4",          // Force MP4 format
          "--merge-output-format", "mp4",  // Ensure merged output is MP4
          "-o",
          outputPath,           // Output path
          reelUrl,
        ],
      );
      console.log("just now started process", ytDlpProcess);

      // Get the actual filename from the output
      ytDlpProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      ytDlpProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      ytDlpProcess.on("close", (code) => {
        console.log(`yt-dlp process exited with code ${code}`);

        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`yt-dlp process failed with code ${code}`));
        }
      });
    });

    // Construct the URL to the video file
    const videoUrl = `/${requestId}/${videoFileName}`; // Serve from the public directory
    return NextResponse.json({ videoUrl: videoUrl });
  } catch (error: any) {
    console.error("Conversion failed:", error);
    return NextResponse.json(
      { error: "Failed to convert video." },
      { status: 500 },
    );
  }
}
