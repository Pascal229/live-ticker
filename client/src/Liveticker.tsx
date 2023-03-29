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

const Liveticker = () => {
  const game = trpc.currentGame.useQuery();
  trpc.tickerEmitter.useSubscription(undefined, {
    onData: (data) => {
      // make sure to verify that the event is caused by the same game that's being watched
      if (data.game_id === game.data?.id) {
        console.log(data);
      }
      // jetzt giz alli events wiiter, also au uf me andere game und das macht denn alles kaputt
      // drum muesch immer checke
      // und ich wür eif jedi paar minute wieder trpc.currentGame.userQuery() calle, falls es neus game ine kickt
    },
  });

  if (!game.data) return <div>Loading...</div>;

  return (
    <div className="flex justify-center bg-gray-300">
      <div className="flex h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <div className="flex flex-1 flex-col">
          {/* <p>{JSON.stringify(game.data)}</p> */}
          <Livestream />
          <Ticker game={game.data} />
        </div>
        <div className="h-full w-full lg:max-w-sm">
          <Comments />
        </div>
      </div>
    </div>
  );
};

export default Liveticker;
