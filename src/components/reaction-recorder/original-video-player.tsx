import { memo } from "react";

// Separate the iframe into a memoized component
const VideoPlayer = memo(({ url }: { url: string }) => (
    <iframe
     src={`${url}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
     loading="lazy"
     style={{ border: 0,  height: '100%', width: '100%' }}
     allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
     allowFullScreen={true}
   ></iframe>
));

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
