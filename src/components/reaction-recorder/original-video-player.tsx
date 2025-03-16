import { memo } from "react";

// Separate the iframe into a memoized component
const VideoPlayer = memo(({ url, autoplay }: { url: string, autoplay: boolean }) => (
    <iframe
     src={`${url}?autoplay=${autoplay}&loop=false&muted=false&preload=true&responsive=true`}
     loading="lazy"
     style={{ border: 0,  height: '100%', width: '100%' }}
     allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
     allowFullScreen={true}
   ></iframe>
));

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
