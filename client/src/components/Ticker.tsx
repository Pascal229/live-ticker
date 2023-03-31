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
    <div className="flex flex-col overflow-y-hidden bg-gray-100 md:flex-1">
      <TickerHeader game={props.game} />
      <TickerEvents game={props.game} />
    </div>
  );
}

const TickerHeader = (props: { game: Game }) => {
  const homeTeam = props.game.teams[0];
  const guestTeam = props.game.teams[1];
  const [isStarted, setIsStarted] = useState(
    props.game.startDateTime.getTime() < new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIsStarted(props.game.startDateTime.getTime() < new Date().getTime());
    }, 1000);
  }, []);

  return (
    <div className="flex justify-between gap-5 border-b-4 border-black p-5">
      <div className="flex flex-1 gap-5">
        <TeamImage teamKey={homeTeam.key} />
      </div>
      <div className="flex justify-center gap-8">
        <div className="hidden items-center text-lg md:text-3xl lg:flex">
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
              {props.game.startDateTime.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        <div className="hidden items-center text-lg md:text-3xl lg:flex">
          {guestTeam.name}
        </div>
      </div>
      <div className="flex flex-1 justify-end gap-5">
        <TeamImage teamKey={guestTeam.key} />
      </div>
    </div>
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

  const sortedEvents = events.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
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
      className="flex flex-col gap-2 overflow-y-scroll p-5"
    >
      <div className="mb-5 flex justify-between">
        <div className="text-md font-bold">{homeTeam.name}</div>
        <div className="text-md font-bold">{guestTeam.name}</div>
      </div>
      <div className="flex flex-col gap-5">
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
      <div className="flex justify-center border-b border-black text-sm text-gray-900 md:text-lg ">
        {props.event.new_state === GameStatus.FIRST_PERIOD ? "1. Halbzeit" : ""}
        {props.event.new_state === GameStatus.SECOND_PERIOD
          ? "2. Halbzeit"
          : ""}
        {props.event.new_state === GameStatus.PAUSED ? "Unterbruch" : ""}
        {props.event.new_state === GameStatus.BREAK ? "Pause" : ""}
        {props.event.new_state === GameStatus.FINISHED ? "Ende" : ""}
        {/* {` (${props.event.display_time}')`} */}
      </div>
    );
  }
  // props.event.
  return (
    <div
      className={`flex items-center gap-2 text-sm md:text-lg ${
        props.event.team_index === 0 ? "justify-start" : "flex-row-reverse "
      }`}
    >
      <>
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
        <span>
          {props.event.player?.name}
          {props.event.assist ? ` (${props.event.assist.name})` : ""}
          {props.event.type === GameUpdateType.PENALTY ? " (Strafe)" : ""}
          {props.event.type === GameUpdateType.PENALTY_KICK ? " (Penalty)" : ""}
        </span>
      </>
    </div>
  );
};

export default Ticker;
