"use client"
import React, { useEffect } from 'react'
import { Input } from '../ui/input'
import { useSource } from '@/context/source';

const ReactInput = () => {
    const { initialUrl, setInitialUrl } = useSource();
    useEffect(() => {
        setInitialUrl("https://www.youtube.com/shorts/fF6iaKc2xek");
        console.log("setting  initialUrl");
      }, []);
  return (
    <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder="Paste reel link here..."
          value={initialUrl}
          className="w-full"
          onChange={(e) => setInitialUrl(e.target.value)}
        />
      </div>
  )
}

export default ReactInput