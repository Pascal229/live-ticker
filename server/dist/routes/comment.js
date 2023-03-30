"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRouter = void 0;
const trpc_1 = require("../trpc");
exports.commentRouter = (0, trpc_1.createTRPCRouter)({
    test: trpc_1.publicProcedure.query(() => {
        return "test";
    }),
});
