import React, { useEffect, useRef, useState } from "react";
import { trpc } from "./client";
import Livestream from "./components/Livestream";
import Comments from "./components/Comments";
import Ticker from "./components/Ticker";
import type { Game, GameUpdateEvent } from "../../server/src/trpc";

interface Event { }

const Liveticker = () => {
  const [game, setGame] = useState<Game>();
  const latestGameRef = useRef<Game>();
  const activeCounter = useRef<number>();

  const { status, data } = trpc.currentGame.useQuery();

  useEffect(() => {
    if (status !== "success" || !data) return;
    setGame(data);
    latestGameRef.current = data;
  }, [status, data]);

  trpc.tickerEmitter.useSubscription(undefined, {
    onData: (data) => {
      if (data.id !== latestGameRef.current?.id) return;

      setGame(data);
      latestGameRef.current = data;
    },
  });

  if (!game) return <div>Loading...</div>;

  return (
    <div className="flex justify-center h-full bg-slate-900">
      <a target="_blank" rel="noopener noreferrer" href="https://github.com/pascal229/live-ticker/tree/bzwu" className="absolute hover:brightness-75 bottom-8 transition-all right-8 hidden lg:block p-2 bg-white rounded-full">
        <img className="w-8" src="/icons/github.svg" alt="GitHub" />
      </a>
      <div className="flex h-full w-full flex-col lg:h-screen lg:flex-row">
        <div className="flex h-full flex-col flex-1">
          {/* <p>{JSON.stringify(game.data)}</p> */}
          <Livestream />
          <Comments />
        </div>
        <div className="h-full overflow-hidden w-full flex-1">
          <Ticker game={game} />
        </div>
      </div>
    </div>
  );
};

export default Liveticker;
