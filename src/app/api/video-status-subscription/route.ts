// POST /api/video-status-subscription a POST webhook from bunny.net`
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { getVideoFromBunny } from "@/lib/bunny";
const prisma = new PrismaClient();

// data looks like this:
// {
// 	"VideoLibraryId": 133,
// 	"VideoGuid": "657bb740-a71b-4529-a012-528021c31a92",
// 	"Status": 3
// }

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
    //get the video from the database
    const video = await prisma.recordRequest.findFirst({
      where: { requestId: videoFromBunny.title },
    });

    if (!video) {
      console.log("Video not found in database");
      return NextResponse.json(
        { error: "Video not found in database" },
        { status: 404 }
      );
    } else {
      //update the video status
      await prisma.recordRequest.update({
        where: { id: video.id },
        data: { status: status, bsOriginalVideoId: videoGuid },
      });
    }
  }

  return NextResponse.json({ message: "Video status updated" });
}
