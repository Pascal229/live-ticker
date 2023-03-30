"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const game_1 = require("../game");
const trpc_1 = require("../trpc");
const createEventObject = zod_1.z
    .object({
    type: zod_1.z.enum(["GOAL", "PENALTY", "PENALTY_KICK"]),
    time: zod_1.z
        .string()
        .refine((value) => new Date(value))
        .default(() => new Date().toISOString()),
    gameId: zod_1.z.number(),
    isHomeTeam: zod_1.z.boolean(),
    scorerPlayer: zod_1.z.number().optional(),
    assistPlayer: zod_1.z.number().optional(),
})
    .strict()
    .or(zod_1.z
    .object({
    time: zod_1.z
        .string()
        .refine((value) => new Date(value))
        .default(() => new Date().toISOString()),
    type: zod_1.z.enum([
        "BREAK",
        "PAUSE",
        "FIRST_PERIOD",
        "SECOND_PERIOD",
        "FINISH",
    ]),
    gameId: zod_1.z.number(),
})
    .strict());
exports.default = async (req, res) => {
    const parsed = createEventObject.safeParse(req.body);
    if (!parsed.success)
        return res.send({ ok: false, error: parsed.error });
    const eventData = parsed.data;
    let insertedActionId = -1;
    if (eventData.type === "GOAL" ||
        eventData.type === "PENALTY" ||
        eventData.type === "PENALTY_KICK") {
        if (eventData.type === "GOAL" || eventData.type === "PENALTY_KICK") {
            const upd = await db_1.default.game.update({
                where: {
                    id: eventData.gameId,
                },
                data: {
                    [eventData.isHomeTeam ? "homeScore" : "guestScore"]: {
                        increment: 1,
                    },
                },
            });
        }
        const event = await db_1.default.event.create({
            data: {
                time: eventData.time,
                game: {
                    connect: {
                        id: eventData.gameId,
                    },
                },
                type: eventData.type,
                assistingPlayer: eventData.assistPlayer
                    ? { connect: { id: eventData.assistPlayer } }
                    : undefined,
                scorerPlayer: eventData.scorerPlayer
                    ? { connect: { id: eventData.scorerPlayer } }
                    : undefined,
                teamIndex: eventData.isHomeTeam ? 0 : 1,
            },
            select: {
                id: true,
            },
        });
        insertedActionId = event.id;
    }
    else {
        const event = await db_1.default.event.create({
            data: {
                time: eventData.time,
                type: eventData.type,
                game: {
                    connect: {
                        id: eventData.gameId,
                    },
                },
            },
            select: {
                id: true,
            },
        });
        insertedActionId = event.id;
    }
    const newGame = await (0, game_1.getGame)({ id: eventData.gameId });
    if (!newGame)
        return res.send({
            ok: true,
            warning: "Unexpected error: Didn't find game to push event to users!",
        });
    else {
        const newEvent = newGame.events.find((event) => event.id === insertedActionId);
        if (!newEvent)
            return res.send({
                ok: true,
                warning: "Unexpected error: Event not found in game log.",
            });
        res.send({ ok: true, result: newGame });
        trpc_1.gameEventEmitter.emit("event", newGame);
    }
};
