"use client"
import { useSource } from '@/context/source'
import { Loader2 } from 'lucide-react'
import React from 'react'

const ReactLoader = () => {
  const {originalVideoDownloadtatus, playbackUrl, initialUrl} =   useSource();
  if(originalVideoDownloadtatus === 'pristine') return null;
  if(originalVideoDownloadtatus === 'uploading') return null;
  if(originalVideoDownloadtatus === 'uploaded') return null;
  if(originalVideoDownloadtatus === 'ready') return (
    <span>Ready</span>
  );
  if(originalVideoDownloadtatus === 'error') return null;
  if(originalVideoDownloadtatus === 'processing') return (
    <>
    <Loader2 className="h-10 w-10 animate-spin"  />
    </>
  ) 
}

export default ReactLoader