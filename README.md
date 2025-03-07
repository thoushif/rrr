# Reaction Video Recorder

A Next.js application for recording reaction videos with a resizable interface.

## Prerequisites

- Node.js 18.x or later
- FFmpeg installed on your system, where you develop and deploy
- redis insalled for working with worker
- mysql server installed
- yt-dlp for saving the youtube/instagram videos
- Bunny Stream account and API credentials

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
BUNNY_API_KEY=your_bunny_api_key
BUNNY_LIBRARY_ID=your_library_id
DATABASE_URL=db_url
NEXT_PUBLIC_APP_URL=api_url
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Dependencies

The project uses the following main dependencies:
- Next.js 14
- React Media Recorder
- FFmpeg for video processing
- yt-dlp for video converting and sourcing
- Bunny Stream for video hosting
- shadcn/ui for UI components
- Lucide React for icons

## Development

1. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Camera recording interface
- Resizable video panes
- Video upload to Bunny Stream
- Video preview and playback
- Responsive design

 
