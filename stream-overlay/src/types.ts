export interface Team {
  name: string;
  key: string;
  score: number;
}

export interface Game {
  id: number;
  status: GameStatus;
  teams: [Team, Team];
  events: GameUpdateEvent[];
  startDateTime: Date;
}
export enum GameStatus {
  NOT_STARTED,
  FIRST_PERIOD,
  SECOND_PERIOD,
  PAUSED,
  BREAK,
  FINISHED,
}

export type GameUpdateEvent =
  | GameGoalEvent
  | GamePenaltyOrPenaltyKickEvent
  | GameStateUpdateEvent;

interface BaseGameUpdateEvent {
  id: number;
  game_id: number;
  timestamp: Date;
  display_time: number;
}

interface SimplePlayer {
  id: number;
  name: string;
  number: number;
}

export enum GameUpdateType {
  GOAL,
  PENALTY,
  PENALTY_KICK,
  STATE_UDPATE,
}

export interface GameGoalEvent extends BaseGameUpdateEvent {
  type: GameUpdateType.GOAL;
  team_index: number;
  player: SimplePlayer | null;
  assist: SimplePlayer | null;
}

export interface GamePenaltyOrPenaltyKickEvent extends BaseGameUpdateEvent {
  type: GameUpdateType.PENALTY | GameUpdateType.PENALTY_KICK;
  team_index: number;
  player: SimplePlayer | null;
  assist: SimplePlayer | null;
}

export interface GameStateUpdateEvent extends BaseGameUpdateEvent {
  type: GameUpdateType.STATE_UDPATE;
  new_state: GameStatus;
}
