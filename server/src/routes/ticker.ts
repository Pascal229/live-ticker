import { createTRPCRouter, publicProcedure } from "../trpc";

export const tickerRouter = createTRPCRouter({
    test: publicProcedure.query(() => {
        return "test";
    }),
});
