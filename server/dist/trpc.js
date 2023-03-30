"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = exports.GameUpdateType = exports.GameStatus = exports.chatEventEmitter = exports.gameEventEmitter = exports.publicProcedure = exports.createTRPCRouter = void 0;
const server_1 = require("@trpc/server");
const observable_1 = require("@trpc/server/observable");
const stream_1 = require("stream");
const context_1 = require("./context");
const superjson_1 = __importDefault(require("superjson"));
const zod_1 = __importDefault(require("zod"));
const db_1 = __importDefault(require("./db"));
const cookie_1 = __importDefault(require("cookie"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const game_1 = require("./game");
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
    errorFormatter({ shape }) {
        return shape;
    },
});
exports.createTRPCRouter = t.router;
exports.publicProcedure = t.procedure;
exports.gameEventEmitter = new stream_1.EventEmitter();
exports.chatEventEmitter = new stream_1.EventEmitter();
var GameStatus;
(function (GameStatus) {
    GameStatus[GameStatus["NOT_STARTED"] = 0] = "NOT_STARTED";
    GameStatus[GameStatus["FIRST_PERIOD"] = 1] = "FIRST_PERIOD";
    GameStatus[GameStatus["SECOND_PERIOD"] = 2] = "SECOND_PERIOD";
    GameStatus[GameStatus["PAUSED"] = 3] = "PAUSED";
    GameStatus[GameStatus["BREAK"] = 4] = "BREAK";
    GameStatus[GameStatus["FINISHED"] = 5] = "FINISHED";
})(GameStatus = exports.GameStatus || (exports.GameStatus = {}));
var GameUpdateType;
(function (GameUpdateType) {
    GameUpdateType[GameUpdateType["GOAL"] = 0] = "GOAL";
    GameUpdateType[GameUpdateType["PENALTY"] = 1] = "PENALTY";
    GameUpdateType[GameUpdateType["PENALTY_KICK"] = 2] = "PENALTY_KICK";
    GameUpdateType[GameUpdateType["STATE_UDPATE"] = 3] = "STATE_UDPATE";
})(GameUpdateType = exports.GameUpdateType || (exports.GameUpdateType = {}));
exports.appRouter = (0, exports.createTRPCRouter)({
    commentEmitter: exports.publicProcedure.subscription(() => {
        return (0, observable_1.observable)((emit) => {
            const onAdd = (event) => emit.next(event);
            exports.chatEventEmitter.on("event", onAdd);
            return () => exports.chatEventEmitter.off("event", onAdd);
        });
    }),
    commenterName: exports.publicProcedure.query(async ({ ctx }) => {
        if (ctx.user)
            return { ok: true, result: ctx.user };
        return { ok: false };
    }),
    setCommenterName: exports.publicProcedure
        .input(zod_1.default.object({
        name: zod_1.default.string().min(3).max(20),
    }))
        .mutation(async ({ ctx, input }) => {
        if (ctx.user)
            return { ok: true, result: ctx.user };
        const newUser = await db_1.default.user.create({
            data: {
                name: input.name,
            },
            select: {
                name: true,
                id: true,
            },
        });
        const cookieExpiration = new Date();
        cookieExpiration.setTime(cookieExpiration.getTime() + 1000 * 60 * 60 * 24 * 365);
        ctx.res.header("set-cookie", cookie_1.default.serialize("ELGG_TOKEN", jsonwebtoken_1.default.sign({ id: newUser.id, name: newUser.name }, context_1.ELGG_SECRET), {
            secure: true,
            path: "/",
            httpOnly: true,
            expires: cookieExpiration,
        }));
        return { ok: true, result: newUser };
    }),
    submitComment: exports.publicProcedure
        .input(zod_1.default.object({
        text: zod_1.default.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.user)
            return { ok: false };
        const comment = await db_1.default.comment.create({
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
                user: true,
            },
        });
        exports.chatEventEmitter.emit("event", {
            id: comment.id,
            action: "create_comment",
            text: input.text,
            user: comment.user,
        });
        return { ok: true, result: comment };
    }),
    tickerEmitter: exports.publicProcedure.subscription(() => {
        return (0, observable_1.observable)((emit) => {
            const onAdd = (event) => emit.next(event);
            exports.gameEventEmitter.on("event", onAdd);
            return () => exports.gameEventEmitter.off("event", onAdd);
        });
    }),
    currentGame: exports.publicProcedure.query(async () => {
        return (0, game_1.getCurrentGame)();
    }),
    comments: exports.publicProcedure
        .input(zod_1.default.object({
        limit: zod_1.default.number().min(1).max(50).nullish(),
        cursor: zod_1.default.number().nullish(), // <-- "cursor" needs to exist, but can be any type
    }))
        .query(async ({ input }) => {
        var _a;
        const limit = (_a = input.limit) !== null && _a !== void 0 ? _a : 50;
        const { cursor } = input;
        const items = await db_1.default.comment.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: true,
            },
        });
        let nextCursor = undefined;
        if (items.length > limit) {
            const nextItem = items.pop();
            nextCursor = nextItem.id;
        }
        return {
            items,
            nextCursor,
        };
    }),
});
