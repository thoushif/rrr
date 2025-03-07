import { ArrowLeft, CheckIcon, PencilIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface RecordRequest {
  id: string;
  userId: string;
  requestId: string;
  originalUrl: string;
  videoTitle: string;
  bsOriginalVideoId: string;
  bsReactionVideoId: string;
  status: string;
}
const Dashboard: React.FC = () => {
  const [requests, setRequests] = useState<RecordRequest[]>([]);
  const router = useRouter();


  useEffect(() => {
    const fetchRequests = async () => {
      const response = await fetch("/api/record-requests?userId=userid");
      const data = await response.json();
      console.log(data);
      setRequests(data);
    };
    fetchRequests();
  }, []);

  // Group requests by status
  const completedRequests = requests.filter(req => req.status === "completed");
  const failedRequests = requests.filter(req => req.status === "failed");
  const inProgressRequests = requests.filter(
    req => req.status !== "completed" && req.status !== "failed"
  );

  return (
    <div className="p-4">
        <Button size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4"  />
         </Button>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <Accordion type="single" defaultValue="completed" collapsible className="w-full">
        {/* Completed Section */}
        <AccordionItem value="completed">
          <AccordionTrigger className="text-lg font-semibold">
            Completed ({completedRequests.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {completedRequests.length === 0 && (
                <p className="text-gray-500 italic">No completed requests</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* In Progress Section */}
        <AccordionItem value="in-progress">
          <AccordionTrigger className="text-lg font-semibold">
            In Progress ({inProgressRequests.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {inProgressRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {inProgressRequests.length === 0 && (
                <p className="text-gray-500 italic">No requests in progress</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Failed Section */}
        <AccordionItem value="failed">
          <AccordionTrigger className="text-lg font-semibold justify-between">
            Failed ({failedRequests.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {failedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {failedRequests.length === 0 && (
                <p className="text-gray-500 italic">No failed requests</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};


const RequestCard: React.FC<{ request: RecordRequest }> = ({ request }) => {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(request.videoTitle);
    const saveTitle = async () => {
        const response = await fetch(`/api/record-requests/${request.requestId}`, {
            method: "PUT",
            body: JSON.stringify({ videoTitle: title }),
        });
        if (response.ok) {
            setEditing(false);
        }else{
            console.error("Failed to save title", response);
        }
    }
    return (
        <div
        key={request.id}
        className="border border-gray-300 rounded-md p-4"
      >
        {editing ? (
          <input type="text" className="text-xl font-bold border border-gray-300 rounded-md p-2 inline-flex gap-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
            // add dots to the title if it is too long  
          <h2 title={title} className="text-2xl font-bold inline-flex gap-2">{title.slice(0, 20)}
            {title.length > 20 && <span className="text-gray-500">...</span>}
          </h2>
        )}
          {/* on click of the title, change the h2 to an input    */}
          {!editing && <button className="text-sm text-gray-500">
            <PencilIcon className="w-4 h-4" onClick={() => setEditing(true)}/>
          </button>}
          {editing && <button className="text-sm text-gray-500">
            <CheckIcon className="w-4 h-4" onClick={() => saveTitle()}/>
            <XIcon className="w-4 h-4" onClick={() => setEditing(false)}/>
          </button>}
           

         <div className="text-sm text-gray-500 inline-flex gap-2">  <RenderingStatus status={request.status} /> {request.originalUrl}</div>
         <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">{request.status}</p>
          {/* if the status is completed, show the reaction video */}
          {request.status === "completed" && request.bsReactionVideoId && (
            <iframe
              id="bunny-stream-embed"
              src={`https://iframe.mediadelivery.net/embed/391358/${request.bsReactionVideoId}`}
            ></iframe>
          )}
        </div>
      </div>
    );
};

// create a component that renders the status of the request, as circle with the status
// green for completed, red for failed, yellow for processing

const RenderingStatus: React.FC<{ status: string }> = ({ status }) => {
  return (
     <div className={`w-4 h-4 rounded-full ${status === "completed" ? "bg-green-500" : status === "failed" ? "bg-red-500" : "bg-yellow-500"}`}></div>
  );
};

export default Dashboard;
