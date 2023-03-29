import { createTRPCRouter, publicProcedure } from "../trpc";

export const commentRouter = createTRPCRouter({
    test: publicProcedure.query(() => {
        return "test";
    }),
});
