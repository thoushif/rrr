import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!;
const BUNNY_UPLOAD_URL = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`;

export async function createBunnyVideo(requestId: string) {
  const createResponse = await fetch(BUNNY_UPLOAD_URL, {
    method: "POST",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: requestId }),
  });

  if (!createResponse.ok) {
    throw new Error("Failed to create video entry");
  }

  return createResponse.json();
}

export async function uploadVideoToBunny(videoId: string, videoPath: string) {
  const uploadUrl = `${BUNNY_UPLOAD_URL}/${videoId}`;
  const fileBuffer = fs.readFileSync(videoPath);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload video file");
  }

  return uploadResponse.json();
}

export function cleanupVideoFiles(videoPath: string) {
  fs.unlinkSync(videoPath);
  fs.rmSync(path.dirname(videoPath), { recursive: true, force: true });
}

export function generatePlaybackUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
} 

export function generateBunnySignedUrl(videoId: string) {
  const baseUrl = `https://vz-4662211e-81e.b-cdn.net/${videoId}/playlist.m3u8`;
  const accessKey = process.env.BUNNY_STREAM_LIBRARY_KEY!;
  const expires = Math.floor(Date.now() / 1000) + 3600; // Expire in 1 hour
  const hash = crypto.createHash("sha256").update(`${accessKey}${expires}`).digest("hex");
  const signedUrl = `${baseUrl}?token=${hash}&expires=${expires}`;
  console.log("signedUrl", signedUrl);
  return signedUrl;
}

export async function listVideosInLibrary() {
  const listResponse = await fetch(BUNNY_UPLOAD_URL, {
    method: "GET",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!listResponse.ok) {
    throw new Error("Failed to list videos in library");
  }

  return listResponse.json();
}

