"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const createGameObject = zod_1.z
    .object({
    homeTeam: zod_1.z.string().min(1),
    homeTeamKey: zod_1.z.string().min(1),
    guestTeam: zod_1.z.string().min(1),
    guestTeamKey: zod_1.z.string().min(1),
    players: zod_1.z
        .array(zod_1.z.number())
        .min(1)
        .refine((players) => ({
        connect: players.map((player) => ({ id: player })),
    })),
    homeScore: zod_1.z.number().default(0),
    status: zod_1.z
        .enum([
        "NOT_STARTED",
        "FIRST_PERIOD",
        "SECOND_PERIOD",
        "PAUSED",
        "BREAK",
        "FINISHED",
    ])
        .default("NOT_STARTED"),
    guestScore: zod_1.z.number().default(0),
    date: zod_1.z.string().refine((value) => new Date(value)),
})
    .strict();
exports.default = async (req, res) => {
    const parsed = createGameObject.safeParse(req.body);
    if (!parsed.success)
        return res.send({ ok: false, error: parsed.error });
    const date = new Date(parsed.data.date);
    if (isNaN(date.getTime()))
        return res.send({ ok: false, error: "date not valid string" });
    const game = await db_1.default.game.create({
        data: {
            homeTeam: parsed.data.homeTeam,
            guestTeam: parsed.data.guestTeam,
            homeTeamKey: parsed.data.homeTeamKey,
            guestTeamKey: parsed.data.guestTeamKey,
            homeScore: parsed.data.homeScore,
            guestScore: parsed.data.guestScore,
            date: parsed.data.date,
            status: parsed.data.status,
            players: {
                connect: parsed.data.players.map((player) => ({
                    id: player,
                })),
            },
        },
        select: {
            id: true,
            players: {
                select: {
                    id: true,
                    name: true,
                    number: true,
                },
            },
        },
    });
    res.send({ ok: true, result: game });
};
