import path from "path";
let fs: any;
if (typeof window === "undefined") {
  fs = require("fs");
}

const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!;
const BUNNY_UPLOAD_URL = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`;

export async function createBunnyVideo(requestId: string) {
  const createResponse = await fetch(BUNNY_UPLOAD_URL, {
    method: "POST",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: requestId }),
  });

  if (!createResponse.ok) {
    throw new Error("Failed to create video entry");
  }

  return createResponse.json();
}

export async function uploadVideoToBunny(videoId: string, videoPath: string) {
  if (!fs) {
    throw new Error("File system module is not available");
  }
  const uploadUrl = `${BUNNY_UPLOAD_URL}/${videoId}`;
  const fileBuffer = fs.readFileSync(videoPath);

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload video file");
  }

  return uploadResponse.json();
}

export function cleanupVideoFiles(videoPath: string) {
  if (!fs) {
    throw new Error("File system module is not available");
  }
  fs.unlinkSync(videoPath);
  fs.rmSync(path.dirname(videoPath), { recursive: true, force: true });
}

export function generatePlaybackUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
}

// export function generateBunnySignedUrl(videoId: string) {
//   const baseUrl = `https://vz-4662211e-81e.b-cdn.net/${videoId}/playlist.m3u8`;
//   const accessKey = process.env.BUNNY_STREAM_LIBRARY_KEY!;
//   const expires = Math.floor(Date.now() / 1000) + 3600; // Expire in 1 hour
//   const hash = crypto.createHash("sha256").update(`${accessKey}${expires}`).digest("hex");
//   const signedUrl = `${baseUrl}?token=${hash}&expires=${expires}`;
//   console.log("signedUrl", signedUrl);
//   return signedUrl;
// }

export async function listVideosInLibrary() {
  const listResponse = await fetch(BUNNY_UPLOAD_URL, {
    method: "GET",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!listResponse.ok) {
    console.log("Failed to list videos in library", await listResponse.json());
    throw new Error(
      "Failed to list videos in library",
      await listResponse.json()
    );
  }

  return listResponse.json();
}

// Add polling to check video status
export async function waitForVideoStatusInDB(requestId: string) {
  const statusRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/get-video-db-status/${requestId}`
  );
  if (statusRes.ok) {
    return true;
  }
  return false;
}
// Add polling to check video status
export async function waitForVideoProcessing(videoId: string, maxAttempts = 5) {
  const checkStatus = async () => {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: process.env.BUNNY_API_KEY!,
        },
      }
    );
    const data = await response.json();
    return data.status;
  };

  let attempts = 0;
  while (attempts < maxAttempts) {
    const status = await checkStatus();
    if (status === "encoded") {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 2 seconds between checks
    attempts++;
  }

  throw new Error("Video processing timeout");
}

export async function getVideoFromBunny(videoId: string) {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: {
        AccessKey: process.env.BUNNY_API_KEY!,
      },
    }
  );
  return response.json();
}
