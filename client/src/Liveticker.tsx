import React, { useEffect } from "react";
import { trpc } from "./client";
import Livestream from "./components/Livestream";
import Comments from "./components/Comments";
import Ticker from "./components/Ticker";

interface Event {}

interface Team {
  name: string;
  score: number;
  events: Event[];
}

interface Game {
  id: number;
  teams: [Team, Team];
}

const Liveticker = () => {
  const game = trpc.currentGame.useQuery();
  trpc.tickerEmitter.useSubscription(undefined, {
    onData: (data) => {
      console.log(data);
    },
  });

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <div className="flex flex-1 flex-col">
        <p>{JSON.stringify(game.data)}</p>
        <Livestream />
        <Ticker />
      </div>
      <div className="h-full w-full lg:max-w-sm">
        <Comments />
      </div>
    </div>
  );
};

export default Liveticker;
