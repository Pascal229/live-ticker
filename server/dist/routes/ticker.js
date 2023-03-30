"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickerRouter = void 0;
const trpc_1 = require("../trpc");
exports.tickerRouter = (0, trpc_1.createTRPCRouter)({
    test: trpc_1.publicProcedure.query(() => {
        return "test";
    }),
});
