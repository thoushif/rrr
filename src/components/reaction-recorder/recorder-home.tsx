import { useEffect, useRef, useState, memo } from "react";
import VideoPlayer from "./original-video-player";
import { CameraView } from "./recorder";
import RecordingOptions, { BunnyVideo } from "../home/recording-options";



const ResizablePanes = () => {
  const handleWidth = "6px";
  const [isResizing, setIsResizing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  //   const { playbackUrl } = useSource();
  const playbackUrl =
    "https://iframe.mediadelivery.net/embed/391358/b971ef9a-fa0b-4da8-825a-a8956cc65f0d";
  const startResizing = () => setIsResizing(true);

  useEffect(() => {
    console.log("playbackUrl", playbackUrl);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const percentage = ((e.clientY - gridRect.top) / gridRect.height) * 100;

      if (percentage > 20 && percentage < 80) {
        gridRef.current.style.gridTemplateRows = `${percentage}%  ${handleWidth} auto`;
      }
    };

    const stopResizing = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  return (
    <div
      ref={gridRef}
      className="h-screen grid grid-rows-[1fr_4px_1fr] bg-orange-900"
      style={{ gridTemplateRows: `50% ${handleWidth} auto` }}
    >
      {/* Top Pane */}
      <div className="bg-slate-200 min-h-0 overflow-auto">
        <CameraView /> 
      </div>

      {/* Resizer Handle */}
      <div
        className="bg-gray-500 cursor-row-resize hover:bg-gray-400"
        onMouseDown={startResizing}
      />

      {/* Bottom Pane */}
      <div className="bg-blue-500 min-h-0 overflow-auto">
        {/* <VideoPlayer url={playbackUrl} />
        
        */}
         <BunnyVideo />
      </div>
    </div>
  );
};

export default ResizablePanes;
