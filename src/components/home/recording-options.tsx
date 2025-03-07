import React, { useEffect, useState } from "react";
import { useSource } from "@/context/source";
import uuidByString from "uuid-by-string";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import VideoPlayer from "../reaction-recorder/original-video-player";

interface OGMetadata {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string }[];
  ogUrl?: string;
}
interface CloudinaryVideoMetadata {
  videoUrl?: string;
}
const RecordingOptions = () => {
  const router = useRouter();
  const {
    initialUrl,
    playbackUrl,
    setPlaybackUrl,
    reset,
  } = useSource();
  const [metadata, setMetadata] = useState<OGMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    // <div className="relative min-h-screen">

    //   {/* <Metadata /> */}
       <BunnyVideo />
    // </div>
  );
};

const Metadata = () => {
  const { initialUrl, setRequestId } = useSource();
  const [metadata, setMetadata] = useState<OGMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!initialUrl) return;
      const requestId = uuidByString(initialUrl);
      setRequestId(requestId);
      try {
        const response = await fetch("/api/og-metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: initialUrl }),
        });
        const result = await response.json();
        setMetadata(result);
      } catch (err) {
        setError("Failed to fetch preview");
        console.error("Error fetching metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [initialUrl]);

  if (loading) return <div>Loading preview...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div className="mt-4 p-2 border rounded-lg shadow-sm">
        {metadata && (
          <div className="flex flex-row gap-2">
            {metadata.ogImage?.[0]?.url && (
              <img
                src={metadata.ogImage[0].url}
                alt={metadata.ogTitle || "Preview image"}
                className="w-10 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h2 className="text-sm font-semibold">
                {metadata.ogTitle || "No title available"}
              </h2>
              <p className="text-gray-600 mt-2">
                {metadata.ogDescription || "No description available"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const BunnyVideo = () => {
  const router = useRouter();
  const { initialUrl, playbackUrl,  setRequestId, setPlaybackUrl, reset } = useSource();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    reset();
    router.push("/");
  };

  useEffect(() => {
    const createMp4Video = async () => {
      if (!initialUrl) return;
      try {
        const response = await fetch("/api/upload-bunny", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoTitle: initialUrl,
            initialUrl,
            userId: "userid",
          }),
        });
        if (response.ok) {
          const result = await response.json();
          setRequestId(result.requestId);
          setPlaybackUrl(result.playbackUrl);
        }
      } catch (err) {
        setError("Failed to fetch preview");
        console.error("Error fetching metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    createMp4Video();
    // clean up useEffect on unmount
    return () => {
      reset();
    };
  }, [initialUrl]);

  if (loading) return (

    <div className="flex flex-col items-center justify-center h-full">
        {/* spinner using lucide */}
        <Loader2 className="h-10 w-10 animate-spin" />
     </div>
  )
 
  if (error) return <div>{error}</div>;

  return (
    <>
       
          {playbackUrl && !loading && (
         
            <VideoPlayer url={playbackUrl} />
         
        )}
   </>
  );
};
export default RecordingOptions;
