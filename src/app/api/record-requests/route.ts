import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all records
export async function GET(req: Request  ) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if(!userId){
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const searchQuery = userId ? { userId } : {};   
  try {
    const records = await prisma.recordRequest.findMany({
      where: searchQuery,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}


// POST new record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = await prisma.recordRequest.create({
      data: {
        userId: body.userId,
        requestId: body.requestId,
        originalUrl: body.originalUrl,
        videoTitle: body.videoTitle,
        status: body.status || "pending"
      }
    });
    return NextResponse.json(record);
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
} 