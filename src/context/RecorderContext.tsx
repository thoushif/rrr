"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useReactMediaRecorder } from "react-media-recorder"

interface RecorderContextType {
  // Recording states
  isRecording: boolean
  recordingDuration: number
  upperVideoDuration: number
  
  // Playback states
  isPlaying: boolean
  currentTime: number
  duration: number
  mediaBlobUrl: string | null
  
  // Camera states
  isCameraReady: boolean
  cameraStream: MediaStream | undefined
  
  // UI states
  error: string | null
  showInitialButtons: boolean
  showConfirmDialog: boolean
  
  // Video URLs
  uploadedVideo: string | null
  
  // Refs
  cameraRef: React.RefObject<HTMLVideoElement>
  fileInputRef: React.RefObject<HTMLInputElement>
  reelRef: React.RefObject<HTMLDivElement>
  
  // Additional Methods
  triggerFileUpload: () => void
  isVideoPlaying: boolean
  
  // Methods
  startRecording: () => void
  stopRecording: () => void
  startCamera: () => Promise<void>
  stopCamera: () => void
  togglePlayPause: () => void
  seekTo: (time: number) => void
  handleFileUpload: (file: File) => void
  handleConfirmStop: (confirmed: boolean) => void
  clearRecording: () => void
  handleRedoRecording: () => void
  saveMergedVideo: () => Promise<void>
  handleSeek: (time: number) => void
  formatDuration: (seconds: number) => string
  setDuration: (duration: number) => void
}

const RecorderContext = createContext<RecorderContextType | undefined>(undefined)

export function RecorderProvider({ children }: { children: React.ReactNode }) {
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [upperVideoDuration, setUpperVideoDuration] = useState(0)
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Camera states
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | undefined>(undefined)
  
  // UI states
  const [error, setError] = useState<string | null>(null)
  const [showInitialButtons, setShowInitialButtons] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Video URLs
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null)

  // Recording timer interval
  const recordingInterval = React.useRef<NodeJS.Timeout>(undefined)

  const { status, startRecording: startMediaRecording, stopRecording: stopMediaRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({
    video: true,
    onStart: () => {
      setIsRecording(true)
      setRecordingDuration(0)
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    },
    onStop: () => {
      setIsRecording(false)
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
      }
    },
  })

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
      }
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
        await cameraRef.current.play()
        setIsCameraReady(true)
        setShowInitialButtons(false)
        console.log("Camera stream set successfully")
      } else {
        console.error("Camera ref is null")
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Failed to access camera. Please ensure you've granted permission.")
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(undefined)
    }
    setIsCameraReady(false)
    if (isRecording) {
      stopMediaRecording()
    }
    clearBlobUrl()
    setUploadedVideo(null)
    setShowInitialButtons(true)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const seekTo = (time: number) => {
    setCurrentTime(time)
  }

  const handleFileUpload = (file: File) => {
    const videoUrl = URL.createObjectURL(file)
    setUploadedVideo(videoUrl)
    setIsCameraReady(true)
    setShowInitialButtons(false)
  }

  const handleConfirmStop = (confirmed: boolean) => {
    setShowConfirmDialog(false)
    if (confirmed) {
      stopMediaRecording()
    } else {
      // Resume recording
      startMediaRecording()
    }
  }

  const clearRecording = () => {
    clearBlobUrl()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const handleRedoRecording = () => {
    // Stop camera if it's running
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(undefined)
    }
    
    // Clear all recording states
    clearBlobUrl()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsCameraReady(false)
    
    // Reset UI to initial state
    setShowInitialButtons(true)
    setUploadedVideo(null)
    
    // Clear any errors
    setError(null)
  }

  // Add refs
  const cameraRef = React.useRef<HTMLVideoElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const reelRef = React.useRef<HTMLDivElement>(null)

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Compute isVideoPlaying
  const isVideoPlaying = Boolean(mediaBlobUrl || uploadedVideo)

  const saveMergedVideo = async () => {
    if (!mediaBlobUrl) return
    
    try {
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged-video.webm'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to save merged video')
    }
  }

  const handleSeek = (time: number) => {
    seekTo(time)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const value = {
    // States
    isRecording,
    recordingDuration,
    upperVideoDuration,
    isPlaying,
    currentTime,
    duration,
    mediaBlobUrl: mediaBlobUrl || null,
    isCameraReady,
    cameraStream,
    error,
    showInitialButtons,
    showConfirmDialog,
    uploadedVideo,
    cameraRef,
    fileInputRef,
    reelRef,
    triggerFileUpload,
    isVideoPlaying,

    // Methods
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    startCamera,
    stopCamera,
    togglePlayPause,
    seekTo,
    handleFileUpload,
    handleConfirmStop,
    clearRecording,
    handleRedoRecording,
    saveMergedVideo,
    handleSeek,
    formatDuration,
    setDuration,
  }
  return (
    <RecorderContext.Provider value={value as RecorderContextType}>
      {children}
    </RecorderContext.Provider>
  )
}

export function useRecorder() {
  const context = useContext(RecorderContext)
  if (context === undefined) {
    throw new Error('useRecorder must be used within a RecorderProvider')
  }
  return context
}
