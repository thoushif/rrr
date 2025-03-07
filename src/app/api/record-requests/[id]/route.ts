import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET single record
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ignore lint error only for this line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id } = await params
    const record = await prisma.recordRequest.findUnique({
      where: { requestId: id }
    });
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

// PUT update record
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ignore lint error only for this line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id } = await params
    const body = await req.json();
    const record = await prisma.recordRequest.update({
      where: { requestId: id },
      data: {
        videoTitle: body.videoTitle,
        bsOriginalVideoId: body.bsOriginalVideoId,
        bsReactionVideoId: body.bsReactionVideoId || null,
        status: body.status
      }
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

// DELETE record
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ignore lint error only for this line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id } = await params
    await prisma.recordRequest.delete({
      where: { requestId: id }
    });
    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
} 