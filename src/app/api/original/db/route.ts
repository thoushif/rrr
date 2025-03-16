import { NextResponse } from "next/server";
import uuidByString from "uuid-by-string";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
 
export async function POST(req: Request) {
  const { initialUrl, userId } = await req.json();
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
        console.log("Video already exists in database", existingRecord);
        return NextResponse.json(
            {message:"requestId already present for this url", data: existingRecord
            },
            { status: 200 }
          );
    }else{
        console.log("Video does not exist in database, creating an entry");
        const newRecordRequest = {
            userId,
            requestId,
            originalUrl: initialUrl,
            videoTitle: requestId,
            status: "pending",
          };
          console.log("new requst rec", newRecordRequest)
          // Create new record in database
          const newRecord = await prisma.recordRequest.create({
            data: newRecordRequest,
          });
        return NextResponse.json(
            {message:"requestId not present for this url, created new one", data: newRecord
            } ,
            { status: 201 }
          ); 
    }
  } catch (e) {
    console.log("Error during initial check", e);
  }
}
