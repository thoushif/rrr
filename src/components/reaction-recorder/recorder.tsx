"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Camera,
  RotateCcw,
  Video,
  Square,
  Loader2,
  Circle,
  Merge,
  CircleChevronLeft,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useReactMediaRecorder } from "react-media-recorder";
import { useSource } from "@/context/source";
import { useRouter } from "next/navigation";
export function CameraView() {
  const { requestId, reset } = useSource();
  const router = useRouter();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [showInitialButtons, setShowInitialButtons] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const durationInterval = useRef<NodeJS.Timeout>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [upperVideoDuration, setUpperVideoDuration] = useState(0);

  const shouldContinueRecording = useRef(false);

  const handleStopRecording = () => {
    //   if (recordingDuration < upperVideoDuration) {
    //     // Pause the recording timer
    //     if (durationInterval.current) {
    //       clearInterval(durationInterval.current);
    //     }
    //     // Pause the upper video
    //     const reelVideo = reelRef.current?.querySelector('video');
    //     if (reelVideo) {
    //       reelVideo.pause();
    //     }
    //     setShowConfirmDialog(true);
    //   } else {
    stopRecording();
    //   }
  };

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      video: true,
      onStart: () => {
        setRecordingDuration(0);
        durationInterval.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
        // Start playing the upper video when recording starts
        const reelVideo = reelRef.current?.querySelector("video");
        if (reelVideo) {
          reelVideo.currentTime = 0;
          reelVideo.play();
        }
      },
      onStop: () => {
        if (durationInterval.current) {
          clearInterval(durationInterval.current);
        }
        // After recording stops, ensure both videos play together
        setTimeout(() => {
          setRecordingDuration(0);
          endCameraAccess();
          const reelVideo = reelRef.current?.querySelector("video");
          if (reelVideo && cameraRef.current) {
            reelVideo.currentTime = 0;
            cameraRef.current.currentTime = 0;
            Promise.all([reelVideo.play(), cameraRef.current.play()]).then(() =>
              setIsPlaying(true)
            );
          }
        }, 100);
      },
    });

  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        streamRef.current = stream;
        await cameraRef.current.play();
        setIsCameraReady(true);
        setShowInitialButtons(false);
        console.log("Camera stream set successfully");
      } else {
        console.error("Camera ref is null");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Failed to access camera. Please ensure you've granted permission."
      );
    }
  };
  const endCameraAccess = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };
  const stopCamera = () => {
    endCameraAccess();
    if (status === "recording") {
      stopRecording();
      setRecordingDuration(0);
    }
    clearBlobUrl();
    setUploadedVideo(null);
    setShowInitialButtons(true);
  };

  const handleDownload = async () => {
    const videoUrl = mediaBlobUrl || uploadedVideo;
    if (videoUrl) {
      //tirgger api call to upload video
    //   create a File object
    const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create FormData with the blob
      const formData = new FormData();
      formData.append("videoFile", blob, "reaction.mp4");
      formData.append("requestId", requestId);

      const uploadResponse = await fetch(
        `/api/upload-reaction?requestId=${requestId}`,
        {
          method: "POST",
          body: formData
        }
      );
      const data = await uploadResponse.json();
      console.log(data);
      router.push(`/dashboard`);
      //   const a = document.createElement("a");
      //   a.href = videoUrl;
      //   a.download = `reaction-${new Date().toISOString()}.mp4`;
      //   document.body.appendChild(a);
      //   a.click();
      //   document.body.removeChild(a);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setUploadedVideo(videoUrl);
      setIsCameraReady(true);
      setShowInitialButtons(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const isVideoPlaying = mediaBlobUrl || uploadedVideo;

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (cameraRef.current) {
      cameraRef.current.currentTime = time;
    }
  };

  const showPreview = () => {
    // Dummy function for now - would need to implement actual video merging
    console.log("Saving merged video...");
    // Here you would:
    // 1. Capture both video streams
    // 2. Merge them using a video processing library
    // 3. Save the result
    alert("This would save the merged video of both reactions");
  };

  const handleConfirmStop = (confirmed: boolean) => {
    setShowConfirmDialog(false);
    if (confirmed) {
      stopCamera();
      stopRecording();
    } else {
      // Resume the recording timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      // Resume the upper video
      const reelVideo = reelRef.current?.querySelector("video");
      if (reelVideo) {
        reelVideo.play();
      }
    }
  };

  const handleRedoRecording = () => {
    // Clear the recorded video and restart camera
    setIsPlaying(false);
    if (uploadedVideo) {
      stopCamera();
    } else {
      clearBlobUrl();
      startCamera();
    }
  };

  const handleBack = () => {
    reset();
    router.push("/");
  };

  return (
    // center vertically and horizontally
    <div className="relative flex items-center justify-center h-full">
      {isVideoPlaying && (
        <>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="absolute inline-flex items-center gap-2 top-4 right-4 z-10 bg-white/80 hover:bg-white"
          >
            <Check className="h-4 w-4" />
            looks good
          </Button>
          <Button
            onClick={handleRedoRecording}
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 z-10 bg-white/80 hover:bg-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Redo
          </Button>
        </>
      )}

      {status === "recording" && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {formatDuration(recordingDuration)}
        </div>
      )}

      {isVideoPlaying ? (
        <video
          ref={cameraRef}
          src={mediaBlobUrl || uploadedVideo || undefined}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          controls={mediaBlobUrl || uploadedVideo ? true : false}
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <>
          <video
            ref={cameraRef}
            className={`w-full h-full object-cover ${
              isCameraReady ? "block" : "hidden"
            }`}
            autoPlay
            playsInline
            muted
            controls={mediaBlobUrl || uploadedVideo ? true : false}
          />
          {showInitialButtons && (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              
              <Button onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" /> Start Camera
              </Button>
              <Button onClick={triggerFileUpload} variant="outline">
                <Video className="mr-2 h-4 w-4" /> Already have a recorded
                video?
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/*"
                className="hidden"
              />
              <Button
                onClick={handleBack}
                variant="ghost"
                className=" rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background/90"
              >
                <ArrowLeft className="h-5 w-5" /> Not this reel?
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
          {error}
        </div>
      )}

      {/* Custom scroll bar with play/pause */}
      {/* {isVideoPlaying && (
            <div className="absolute bottom-16 left-4 right-4">
              <div className="flex items-center gap-4 mb-2">
                <Button 
                  onClick={togglePlayPause} 
                  variant="ghost" 
                  size="sm"
                  className="bg-white/80 hover:bg-white"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-sm text-white ">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{duration}</span>
               </div>
            </div>
          )} */}

      {/* Control buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
        {!showInitialButtons && (
          <>
            {status === "recording" ? (
              <Button onClick={handleStopRecording} variant="destructive">
                <Square className="h-4 w-4" />
              </Button>
            ) : status === "acquiring_media" ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              !isVideoPlaying && (
                <>
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    className="bg-white/80 hover:bg-white"
                  >
                    <Circle className="h-4 w-4 text-red-500" /> Record
                  </Button>
                  <Button onClick={stopCamera} variant="secondary">
                    <CircleChevronLeft className="h-4 w-4 mr-2" /> Go Back
                  </Button>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
