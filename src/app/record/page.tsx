"use client";
import React from 'react';
import RecordingOptions from '@/components/home/recording-options';
import { useSource } from '@/context/source';
const RecordPage = () => {
  return (
       <div className="w-full max-w-[400px] p-4 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center">
            <RecordingOptions />
    </div>
  );
};

export default RecordPage;

