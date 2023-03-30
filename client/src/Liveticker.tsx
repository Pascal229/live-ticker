import React, { useEffect, useState } from "react";
import { trpc } from "./client";
import Livestream from "./components/Livestream";
import Comments from "./components/Comments";
import Ticker from "./components/Ticker";
import type { GameUpdateEvent } from "../../server/src/trpc";

interface Event {}

interface Team {
  name: string;
  score: number;
  events: Event[];
}

const Liveticker = () => {
  const game = trpc.currentGame.useQuery();
  const [events, setEvents] = useState<GameUpdateEvent[]>([]);
  trpc.tickerEmitter.useSubscription(undefined, {
    onStarted: () => {
      setEvents(game.data?.events ?? []);
    },
    onData: (data) => {
      // make sure to verify that the event is caused by the same game that's being watched
      if (data.game_id !== game.data?.id) return;
      else if (!events.length) setEvents([...game.data.events, data]);
      else setEvents([...events, data]);
    },
  });

  if (!game.data) return <div>Loading...</div>;

  return (
    <div className="flex justify-center bg-gray-300">
      <div className="flex h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <div className="flex flex-1 flex-col">
          {/* <p>{JSON.stringify(game.data)}</p> */}
          <Livestream />
          <Ticker
            game={{
              ...game.data,
              events: events.length > 0 ? events : game.data.events,
            }}
          />
        </div>
        <div className="h-full w-full lg:max-w-sm">
          <Comments />
        </div>
      </div>
    </div>
  );
};

export default Liveticker;
