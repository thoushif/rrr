import { NextResponse } from "next/server";

import { generatePlaybackUrl, listVideosInLibrary } from "@/lib/bunny";


export async function POST(req: Request) {
  const { requestId } = await req.json();
  try {
    if (!requestId) {
      return NextResponse.json(
        { error: "No requestId provided" },
        { status: 400 }
      );
    }

    console.log("Video already exists in database, checking bunny library");
    const videosData = await listVideosInLibrary();
    const video = videosData.items.find(
      (video: any) => video.title == requestId
    );
    if (video) {
      console.log("yes, Video already exists in bunny library");
      return NextResponse.json(
        {
          success: true,
          requestId,
          playbackUrl: generatePlaybackUrl(video.guid),
        },
        { status: 200 }
      );
    } else {
      console.log("no, Video does not exist in bunny library");
      return NextResponse.json(
        {
          success: false,
          requestId,
        },
        { status: 404 }
      );
    }
  } catch (e) {
    console.log("Error during bunny check", e);
  }
}
