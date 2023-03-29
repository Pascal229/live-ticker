import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "stream";
import { z } from "zod";
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

export const gameEventEmitter = new EventEmitter();
export const chatEventEmitter = new EventEmitter();

export const appRouter = t.router({
    gameUpdate: publicProcedure.subscription(() => {
        return observable<{ randomNumber: number }>((emit) => {
            gameEventEmitter.on("score_update", (update) => {
                console.log(update);
            });
        });
    }),
    hello: publicProcedure.query(() => {
        return {
            greeting: "hello world",
        };
    }),
});

export type AppRouter = typeof appRouter;
