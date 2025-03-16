import { NextResponse } from "next/server"; 
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
    // get the requestId from the path params
    const maxAttempts = 10;
    const { id:requestId } = await params;
    if(!requestId){
      return NextResponse.json(
        { error: "No requestId provided" },
        { status: 400 }
      );
    }
    const checkStatus = async () => {
        const video = await prisma.recordRequest.findFirst({
          where: { requestId },
        });
        return video?.status
      };
    
      let attempts = 0;
      while (attempts < maxAttempts) {
        
        const status = await checkStatus();
        console.log("Checking video status at attempt number", attempts, " with status: ", status);
        if (status === "finished" || status === "failed" || status === "completed") {
          console.log("Video status, updated to finished or failed at attempt number", attempts , " to status: ", status);
          return NextResponse.json({status:200});
        }
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10   seconds between checks
        attempts++;
      }
      
      throw new Error("Video processing timeout");
}   