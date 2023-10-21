import { useEffect, useRef, useState } from "react";
import {
  type Game,
  type GameUpdateEvent,
  type Team,
} from "../../../server/src/trpc";

export enum GameUpdateType {
  GOAL,
  PENALTY,
  PENALTY_KICK,
  STATE_UDPATE,
}

export enum GameStatus {
  NOT_STARTED,
  FIRST_PERIOD,
  SECOND_PERIOD,
  PAUSED,
  BREAK,
  FINISHED,
}

function Ticker(props: { game: Game }) {
  return (
    <div className="flex flex-col h-full overflow-y-hidden bg-slate-900 md:flex-1">
      <TickerHeader game={props.game} />
      <TickerEvents game={props.game} />
    </div>
  );
}

const getGamePercentage = (game: Game): number => {
  if (game.events.length === 0) return 0;
  const last_event = game.events.slice(-1)[0]
  if (last_event.type === GameUpdateType.STATE_UDPATE && last_event.new_state === GameStatus.FINISHED) return 100;
  if (last_event.type === GameUpdateType.STATE_UDPATE && last_event.new_state === GameStatus.NOT_STARTED)
    return 0;

  return (100 / 40) * (last_event.display_time) + (last_event.type === GameUpdateType.STATE_UDPATE && [GameStatus.FIRST_PERIOD, GameStatus.SECOND_PERIOD].includes(last_event.new_state) ? ((new Date().getTime() - last_event.timestamp.getTime()) / 60 / 1000) : 0)
}

const TickerHeader = (props: { game: Game }) => {
  const homeTeam = props.game.teams[0];
  const guestTeam = props.game.teams[1];
  const [isStarted, setIsStarted] = useState(
    props.game.startDateTime.getTime() < new Date().getTime()
  );
  const [refreshState, setRefreshState] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsStarted(props.game.startDateTime.getTime() < new Date().getTime());
      setRefreshState((state) => !state)
    }, 1000);
    return () => clearInterval(interval)
  }, []);

  return (
    <>
      <div className="flex bg-slate-800 text-white justify-between gap-5 p-5">
        <div className="flex gap-5 bg-slate-700 rounded-lg w-fit items-center">
          <TeamImage teamKey={homeTeam.key} />
        </div>
        <div className="flex justify-center gap-8 flex-1">
          <div className="hidden flex-1 items-center text-lg md:text-2xl md:flex">
            {homeTeam.name}
          </div>
          {isStarted ? (
            <div className="flex flex-col justify-end">
              {/* <h3 className="text-sm text-center">100 Zuschauer</h3> */}
              <div className="flex items-center gap-5">
                <span className="text-3xl font-bold md:text-5xl">
                  {homeTeam.score}
                </span>
                <span className="font-bold md:text-5xl">:</span>
                <span className="text-3xl font-bold md:text-5xl">
                  {guestTeam.score}
                </span>
              </div>
              <h3 className="text-center text-sm">
                {props.game.status === GameStatus.FIRST_PERIOD
                  ? "1. Halbzeit"
                  : props.game.status === GameStatus.SECOND_PERIOD
                    ? "2. Halbzeit"
                    : props.game.status === GameStatus.PAUSED
                      ? "Unterbrechung"
                      : props.game.status === GameStatus.BREAK
                        ? "Pause"
                        : props.game.status === GameStatus.FINISHED
                          ? "Beendet"
                          : "Unbekannt"}
              </h3>
            </div>
          ) : (
            <div className="flex flex-col items-center ">
              <span className="text-sm">Startet am:</span>
              <span className="text-3xl font-bold md:text-5xl">
                {/* Print the date in this format 10:00 */}
                {props.game.startDateTime.toLocaleTimeString(navigator.language, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <div className="hidden items-center justify-end flex-1 text-lg md:text-2xl lg:flex">
            {guestTeam.name}
          </div>
        </div>
        <div className="flex justify-end gap-5 bg-slate-700 rounded-lg items-center">
          <TeamImage teamKey={guestTeam.key} />
        </div>
      </div>
      <div className="h-2 bg-slate-500 w-full">
        <div style={{
          width: getGamePercentage(props.game) + "%"
        }} className="h-full rounded-r-xl bg-primary" />
      </div>
    </>
  );
};

const TeamImage = (props: { teamKey: Team["key"] }) => {
  return (
    <div className="flex h-16 w-16 justify-center rounded-xl p-1 md:h-20 md:w-24">
      <img
        className="h-full object-contain"
        src={`/teams/${props.teamKey}.png`}
        alt=""
      />
    </div>
  );
};

const TickerEvents = (props: { game: Game }) => {
  const homeTeam = props.game.teams[0];
  const guestTeam = props.game.teams[1];

  const events = props.game.events;

  const sortedEvents = events
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .filter(
      (event) =>
        event.type !== GameUpdateType.STATE_UDPATE ||
        [
          GameStatus.BREAK,
          GameStatus.FINISHED,
          GameStatus.NOT_STARTED,
        ].includes(event.new_state)
    );

  const eventsContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventsContainer.current) {
      eventsContainer.current.scrollTop = eventsContainer.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={eventsContainer}
      className="flex flex-col gap-2 overflow-y-scroll p-5 pb-20"
    >
      <div className="mb-5 flex justify-between sticky top-0 bg-slate-900 text-white">
        <div className="text-md font-bold">{homeTeam.name}</div>
        <div className="text-md font-bold">{guestTeam.name}</div>
      </div>
      <div className="flex flex-col gap-2">
        {sortedEvents.map((event) => (
          <div key={event.id} className="">
            <TickerEvent event={event} game={props.game} />
          </div>
        ))}
      </div>
    </div>
  );
};

const TickerEvent = (props: { event: GameUpdateEvent; game: Game }) => {
  if (props.event.type === GameUpdateType.STATE_UDPATE) {
    return (
      <div className="relative w-full mt-2 mb-2">
        <div className="flex justify-center">
          <p className="text-slate-500 px-6 text-center bg-slate-900 z-10">
            {props.event.new_state === GameStatus.FIRST_PERIOD && "1. Halbzeit"}
            {props.event.new_state === GameStatus.SECOND_PERIOD && "2. Halbzeit"}
            {props.event.new_state === GameStatus.PAUSED && "Unterbruch"}
            {props.event.new_state === GameStatus.BREAK && "Pause"}
            {props.event.new_state === GameStatus.FINISHED && "Spiel beendet"}
            {/* {` (${props.event.display_time}')`} */}
          </p>
        </div>
        <hr className="border-none w-full absolute left-0 top-2 right-0 h-2 rounded-lg bg-slate-700 z-0" />
      </div>
    );
  }
  // props.event.
  return (
    <div
      className={`flex  text-sm md:text-lg ${props.event.team_index === 0 ? "justify-start" : "flex-row-reverse "
        }`}
    >
      <div className="w-fit p-2 px-6 bg-slate-800 text-white flex gap-2 items-center rounded-md">
        <span className="font-bold">{`${props.event.display_time}'`}</span>
        {props.event.type === GameUpdateType.GOAL && (
          <img className="h-5" src="/icons/futbol-light.svg" alt="" />
        )}
        {props.event.type === GameUpdateType.PENALTY && (
          <img className="h-5" src="/icons/football-card.svg" alt="" />
        )}
        {props.event.type === GameUpdateType.PENALTY_KICK && (
          <img className="h-5" src="/icons/penalty-kick.svg" alt="" />
        )}
        <span className="text-slate-500">{{ [GameUpdateType.PENALTY]: 'STRAFE', [GameUpdateType.GOAL]: "GOAL", [GameUpdateType.PENALTY_KICK]: "PENALTY" }[props.event.type]}</span>
        <span>
          {props.event.player?.name}
          {props.event.assist ? ` (${props.event.assist.name})` : ""}
        </span>
      </div>
    </div>
  );
};

export default Ticker;
