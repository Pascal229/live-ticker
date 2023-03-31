import React, { MutableRefObject, useRef, useState } from "react";
import ReactHlsPlayer from "react-hls-player";
import mutedIcon from "../../public/icons/volume-xmark.svg";

function Livestream() {
  const playerRef =
    useRef<HTMLVideoElement>() as MutableRefObject<HTMLVideoElement>;

  const [isMuted, setIsuted] = useState(true);

  return (
    <>
      <div className="relative aspect-video bg-red-700">
        {playerRef.current &&
        playerRef.current.canPlayType("application/vnd.apple.mpegURL") ? (
          <video controls muted autoPlay width="100%">
            <source
              src="https://stream.uhc-elgg.ch/.m3u8"
              type="application/vnd.apple.mpegurl"
            />
          </video>
        ) : (
          <ReactHlsPlayer
            playerRef={playerRef}
            controls={true}
            muted={true}
            autoPlay={true}
            src="https://stream.uhc-elgg.ch/.m3u8"
            width="100%"
            height="auto"
          />
        )}

        <button
          onClick={() => {
            playerRef.current.muted = false;
            setIsuted(false);
          }}
          style={{ opacity: isMuted ? 1 : 0 }}
          className="absolute left-8 top-8 cursor-pointer rounded bg-white p-4 transition-opacity duration-100"
        >
          <img className="h-8 w-8" src={mutedIcon} />
        </button>
      </div>
    </>
  );
}

export default Livestream;
