import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {
  createTRPCUntypedClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from "@trpc/client";
import { Game, GameStatus, GameUpdateType, Team } from "./types";
import SuperJSON from "superjson";

function getGameStatus(status: GameStatus) {
  if (status === GameStatus.NOT_STARTED) return "Spiel startet bald!";
  if (status === GameStatus.BREAK) return "Pause";
  if (status === GameStatus.FINISHED) return "Spiel beendet";
  if (status === GameStatus.FIRST_PERIOD) return "1. Halbzeit";
  if (status === GameStatus.SECOND_PERIOD) return "2. Halbzeit";
  if (status === GameStatus.PAUSED) return "Spiel pausiert";
  return "";
}

function getGameInfos(game: Game) {
  let last_status: GameStatus = GameStatus.NOT_STARTED;
  let time_elapsed = 0;
  let is_stopped = true;
  let last_timestamp = game.startDateTime;
  const TIME_STARTERS = [GameStatus.FIRST_PERIOD, GameStatus.SECOND_PERIOD];
  const TIME_ENDERS = [
    GameStatus.BREAK,
    GameStatus.FINISHED,
    GameStatus.NOT_STARTED,
    GameStatus.PAUSED,
  ];
  for (let event of game.events.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )) {
    if (event.type !== GameUpdateType.STATE_UDPATE) continue;
    last_status = event.new_state;
    if (TIME_STARTERS.includes(event.new_state)) {
      last_timestamp = event.timestamp;
      is_stopped = false;
    }
    if (TIME_ENDERS.includes(event.new_state)) {
      time_elapsed += Math.max(
        0,
        event.timestamp.getTime() - last_timestamp.getTime()
      );
      last_timestamp = event.timestamp;
      is_stopped = true;
    }
  }
  return {
    last_status: getGameStatus(last_status),
    time_elapsed,
    last_timestamp,
    is_stopped,
  };
}

const getImageHost = () => {
  const host = new URLSearchParams(window.location.search).get("image_host")
  return {
    host: host!, secure: host?.includes("localhost") ? '' : 's'
  }
}

const getImage = (team: Team): string => {
  const host = getImageHost();
  return `http${host.secure}://${host.host}/teams/${team.key}.png`;
}

const getHost = () => {
  const host = new URLSearchParams(window.location.search).get("host")
  return {
    host: host!, secure: host?.includes("localhost") ? '' : 's'
  }
}

function App() {

  const host = getHost()

  const [wsClient] = useState(() =>
    // make this relative to the current page
    createWSClient({
      url: `ws${host.secure}://${host.host}/trpc`,
    })
  );
  const [trpcClient] = useState(() =>
    createTRPCUntypedClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({ client: wsClient }),
          false: httpBatchLink({
            url: `http${host.secure}://${host.host}/trpc`,
          }),
        }),
      ],
      // links: [
      //   splitLink({
      //     condition(op) {
      //       return op.type === "subscription";
      //     },
      //     true: wsLink({ client: wsClient }),
      //     false: httpBatchLink({
      //       url: `http://localhost:10022/trpc`,
      //     }),
      //   }),
      // ],
      transformer: SuperJSON,
    })
  );

  const [game, setGame] = useState<Game>();
  const [currentTime, setTime] = useState(new Date().getTime());

  useEffect(() => {
    let game_id = 0;
    trpcClient.subscription("tickerEmitter", undefined, {
      onData: (game: Game) => {
        console.log(game.id, game_id);
        if (game.id !== game_id) return;
        setGame(game);
      },
    });
    const getGame = () => {
      trpcClient.query("currentGame").then((game: Game | null) => {
        if (!game) return;
        game_id = game.id;
        setGame(game);
      });
    };
    const refreshInterval = setInterval(getGame, 30_000);
    getGame();
    setInterval(() => {
      setTime(new Date().getTime());
    }, 250);
    return () => clearInterval(refreshInterval);
  }, []);

  if (!game?.teams) return <p>Loading...</p>;
  const gameInfos = getGameInfos(game);
  const elapsed_time = gameInfos.is_stopped
    ? gameInfos.time_elapsed
    : gameInfos.time_elapsed +
    (currentTime - gameInfos.last_timestamp.getTime());
  const elapsed_minutes = Math.floor(elapsed_time / 1000 / 60);
  const elapsed_seconds = Math.floor(
    (elapsed_time - elapsed_minutes * 1000 * 60) / 1000
  );

  const FULLSCREEN_STATES = [
    GameStatus.NOT_STARTED,
    GameStatus.BREAK,
    GameStatus.FINISHED,
  ];

  return (
    <div
      className="h-screen w-screen flex flex-col relative p-8"
      style={{
        backgroundColor: FULLSCREEN_STATES.includes(
          game?.status ?? GameStatus.NOT_STARTED
        )
          ? "#0f172a"
          : "#003FFF",
      }}
    >

      <div className="flex w-full justify-center">
        <div className="flex flex-col items-center">
          <div className="bg-white flex flex-col items-center rounded-2xl py-2 w-80 text-primary">
            <small className="text-center">{gameInfos.last_status}</small>
            <p className="text-3xl font-bold w-[100px]">
              {elapsed_minutes.toString().padStart(2, "0")}:
              {elapsed_seconds.toString().padStart(2, "0")}
            </p>
          </div>
          <div className="bg-primary w-48 rounded-b-2xl py-2 px-4">
            <div className="text-white rounded-b-2xl w-full font-bold text-xl flex justify-between">
              <img
                className="w-8 h-auto"
                src={getImage(game.teams[0])}
                alt={game.teams[0].name}
              />
              <div className="flex gap-2">
                <p>{game.teams[0].score}</p>
                <p>:</p>
                <p>{game.teams[1].score}</p>
              </div>
              <img
                className="w-8 h-auto"
                src={getImage(game.teams[1])}
                alt={game.teams[1].name}
              />
            </div>
          </div>
        </div>
      </div>
      {FULLSCREEN_STATES.includes(game.status) && (
        <div className="text-primary mt-12 p-16 w-full flex justify-center">

          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col gap-4">
              <div className="w-48 bg-white rounded-3xl h-full p-4">
                <img className="w-48" src={getImage(game.teams[0])} alt="" />
              </div>
              <p className="text-3xl text-center text-white">{game.teams[0].name}</p>
            </div>
            <div className="flex items-center gap-2">
              {game.status === GameStatus.NOT_STARTED ? (
                <div className="flex flex-col gap-4">
                  <p className="text-primary text-8xl w-[610px] whitespace-nowrap font-bold">
                    {(() => {
                      const timeDelta =
                        game.startDateTime.getTime() - currentTime;
                      const hours = Math.floor(timeDelta / 1000 / 60 / 60);
                      const minutes = Math.floor(
                        (timeDelta - hours * 1000 * 60 * 60) / 1000 / 60
                      );
                      const seconds = Math.floor(
                        (timeDelta -
                          hours * 1000 * 60 * 60 -
                          minutes * 1000 * 60) /
                        1000
                      );
                      if (minutes > 0)
                        return (
                          hours.toString().padStart(2, "0") +
                          " : " +
                          minutes.toString().padStart(2, "0") +
                          " : " +
                          seconds.toString().padStart(2, "0")
                        );
                      return "Noch wenige Sekunden";
                    })()}
                  </p>
                  <p className="text-center text-2xl">bis zum Spielstart</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 h-full flex-1">
                  <p className="text-center text-white font-bold text-5xl">
                    {gameInfos.last_status}
                  </p>
                  <div className="w-full flex text-9xl gap-4 font-bold justify-center">
                    <p>{game.teams[0].score}</p>
                    <p>:</p>
                    <p>{game.teams[1].score}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-48 bg-white rounded-3xl p-4">
                <img className="w-48" src={getImage(game.teams[1])} alt="" />
              </div>
              <p className="text-3xl text-center text-white">{game.teams[1].name}</p>
            </div>
          </div>
        </div>
      )
      }
      <img className="w-40 fixed bottom-12 right-12" src="/public/logo-white.svg" alt="Logo" />
    </div>
  );
}

export default App;
