import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "stream";
import { Context, ELGG_SECRET } from "./context";
import superjson from "superjson";
import { commentRouter } from "./routes/comment";
import z from "zod";
import db from "./db";
import { tickerRouter } from "./routes/ticker";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getCurrentGame } from "./game";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const gameEventEmitter = new EventEmitter();
export const chatEventEmitter = new EventEmitter();

export interface ChatEvent {
  id: number;
  action: "create_comment";
  text: string;
  user_name: string;
}

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
}

export enum GameStatus {
  NOT_STARTED,
  FIRST_PERIOD,
  SECOND_PERIOD,
  PAUSED,
  BREAK,
  FINISHED,
}

export enum GameUpdateType {
  GOAL,
  PENALTY,
  PENALTY_KICK,
  STATE_UDPATE,
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
}

export interface GameStateUpdateEvent extends BaseGameUpdateEvent {
  type: GameUpdateType.STATE_UDPATE;
  new_state: GameStatus;
}

export const appRouter = createTRPCRouter({
  commentEmitter: publicProcedure.subscription(() => {
    return observable<ChatEvent>((emit) => {
      const onAdd = (event: ChatEvent) => emit.next(event);
      chatEventEmitter.on("event", onAdd);
      return () => chatEventEmitter.off("event", onAdd);
    });
  }),
  setCommenterName: publicProcedure
    .input(z.object({ name: z.string().min(3).max(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user) return { ok: true, result: ctx.user };
      const newUser = await db.user.create({
        data: {
          name: input.name,
        },
        select: {
          name: true,
          id: true,
        },
      });

      const cookieExpiration = new Date();
      cookieExpiration.setTime(
        cookieExpiration.getTime() + 1000 * 60 * 60 * 24 * 365
      );

      ctx.res.header(
        "set-cookie",
        cookie.serialize(
          "ELGG_TOKEN",
          jwt.sign({ id: newUser.id, name: newUser.name }, ELGG_SECRET),
          {
            secure: true,
            path: "/",
            httpOnly: true,
            expires: cookieExpiration,
          }
        )
      );

      return { ok: true, result: newUser };
    }),
  submitComment: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return { ok: false };
      const comment = await db.comment.create({
        data: {
          content: input.text,
          user: {
            connect: {
              id: ctx.user.id,
            },
          },
        },
        select: {
          id: true,
          user: { select: { name: true } },
        },
      });
      chatEventEmitter.emit("event", {
        id: comment.id,
        action: "create_comment",
        text: input.text,
        user_name: comment.user?.name ?? "Anonymous",
      } as ChatEvent);
      return { ok: true, result: comment };
    }),
  tickerEmitter: publicProcedure.subscription(() => {
    return observable<GameUpdateEvent>((emit) => {
      const onAdd = (event: GameUpdateEvent) => emit.next(event);
      gameEventEmitter.on("event", onAdd);
      return () => gameEventEmitter.off("event", onAdd);
    });
  }),
  currentGame: publicProcedure.query(async (): Promise<Game | null> => {
    return getCurrentGame();
  }),
});

export type AppRouter = typeof appRouter;
