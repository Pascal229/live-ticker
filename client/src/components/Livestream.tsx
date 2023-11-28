import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import ReactHlsPlayer from "react-hls-player";
import mutedIcon from "../../public/icons/volume-xmark.svg";

const livestreamHost = "https://stream.koplan.ch/.m3u8"

function Livestream() {
  const playerRef =
    useRef<HTMLVideoElement>() as MutableRefObject<HTMLVideoElement>;

  const [isMuted, setIsuted] = useState(true);
  useEffect(() => {
    const listener = () => {
      setIsuted(false)
    }
    playerRef?.current.addEventListener("volumechange", listener)
    return () => playerRef.current?.removeEventListener("volumechange", listener)
  }, [])

  return (
    <>
      <div className="relative  bg-red-700">
        {playerRef.current &&
          playerRef.current.canPlayType("application/vnd.apple.mpegURL") ? (
          <video controls muted autoPlay width="100%">
            <source
              src={livestreamHost}
              type="application/vnd.apple.mpegurl"
            />
          </video>
        ) : (
          <ReactHlsPlayer
            playerRef={playerRef}
            controls={true}
            muted={true}
            autoPlay={true}
            src={livestreamHost}
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
          className="absolute flex gap-2 items-center left-8 top-8 cursor-pointer rounded bg-white p-4 transition-opacity duration-100"
        >
          <img className="h-8 w-8" src={mutedIcon} />
          <p className="font-bold">Play {playerRef.current?.paused && "Audio"}</p>
        </button>
      </div>
    </>
  );
}

export default Livestream;
