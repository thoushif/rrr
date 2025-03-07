import { NextResponse } from "next/server";
import videoQueue from "../../../../workers/queue";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    // get the requestId from the path params
    const { id } = await params;
    await videoQueue.add("process-video", { jobId: id });
    return NextResponse.json({ message: "Request submitted" });
}   