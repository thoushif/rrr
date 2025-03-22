// POST /api/video-status-subscription a POST webhook from bunny.net`
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { getVideoFromBunny } from "@/lib/bunny";
const prisma = new PrismaClient();

const schema = z.object({
  VideoLibraryId: z.number(),
  VideoGuid: z.string(),
  Status: z.number(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = schema.parse(payload);
  console.log("payload", payload);
  const videoGuid = parsed.VideoGuid;
  let status = "pending";
  if (parsed.Status === 3) {
    status = "finished";
  } else if (parsed.Status === 5 || parsed.Status === 8) {
    status = "failed";
  }
  if (status === "finished" || status === "failed") {
    const videoFromBunny = await getVideoFromBunny(videoGuid);
    console.log(videoFromBunny);
   if (videoFromBunny.title.indexOf("merged-") !== -1) {
      console.log("merged video found in bunny");
      const requestId = videoFromBunny.title.replace("merged-", "");
      const mergedVideo = await prisma.recordRequest.findFirst({
        where: { requestId: requestId },
      });
      if (mergedVideo) {
        console.log("merged video found in database");
        await prisma.recordRequest.update({
          where: { id: mergedVideo.id },
          data: {
            status: "merged-upload-finished",
            bsReactionVideoId: videoGuid,
          },
        });
      }
    } else  if (videoFromBunny.title.indexOf("reaction-") !== -1) {
      console.log("reaction video found in bunny");
      const requestId = videoFromBunny.title.replace("reaction-", "");
      const reactionVideo = await prisma.recordRequest.findFirst({
        where: { requestId: requestId },
      });
      if (reactionVideo) {
        console.log("reaction video found in database");
        await prisma.recordRequest.update({
          where: { id: reactionVideo.id },
          data: {
            status: "reaction-upload-finished",
            bsReactionVideoId: videoGuid,
          },
        });
      }
    } else {
      console.log("original video found in bunny");
      const originalVideo = await prisma.recordRequest.findFirst({
        where: { requestId: videoFromBunny.title },
      });
      if (originalVideo) {
        console.log("original video found in database");
        await prisma.recordRequest.update({
          where: { id: originalVideo.id },
          data: {
            status: "original-upload-finished",
            bsOriginalVideoId: videoGuid,
          },
        });
      } else
        return NextResponse.json(
          { error: "Video not found in database" },
          { status: 404 }
        );
    }
  }

  return NextResponse.json({ message: "Video status updated" });
}
