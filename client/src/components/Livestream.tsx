import React from "react";
import ReactPlayer from "react-player";

function Livestream() {
  return (
    <div className="aspect-video bg-red-700">
      <ReactPlayer
        url="https://www.youtube.com/watch?v=adKx8AITK44"
        height="100%"
        width="100%"
      />
    </div>
  );
}

export default Livestream;
