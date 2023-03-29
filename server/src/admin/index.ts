import type { FastifyInstance } from "fastify";
import db from "../db";
import { z } from "zod";

const createEventObject = z
    .object({
        type: z.enum(["GOAL", "PENALTY", "PENALTY_KICK", "BREAK", "FINISH"]),
        time: z
            .string()
            .refine((value) => new Date(value))
            .default(new Date().toISOString()),
        game: z.number(),
        isHomeTeam: z.boolean(),
    })
    .or();

const createPlayerObject = z.object({
    name: z.string().min(1),
    number: z.number().min(1),
});

const createGameObject = z
    .object({
        homeTeam: z.string().min(1),
        guestTeam: z.string().min(1),
        players: z
            .array(z.number())
            .min(1)
            .refine((players) => ({
                connect: players.map((player) => ({ id: player })),
            })),
        homeScore: z.number().default(0),
        status: z
            .enum(["NOT_STARTED", "ONGOING", "BREAK", "FINISHED"])
            .default("NOT_STARTED"),
        guestScore: z.number().default(0),
        date: z.string().refine((value) => new Date(value)),
    })
    .strict();

const applyRoutes = (group: FastifyInstance) => {
    group.post("/admin/create-game", async (req, res) => {
        const parsed = createGameObject.safeParse(req.body);
        if (!parsed.success)
            return res.send({ ok: false, error: parsed.error });

        const date = new Date(parsed.data.date);
        if (isNaN(date.getTime()))
            return res.send({ ok: false, error: "date not valid string" });

        const game = await db.game.create({
            data: {
                ...parsed.data,
                players: {
                    connect: parsed.data.players.map((player) => ({
                        id: player,
                    })),
                },
            },
            select: {
                id: true,
            },
        });

        res.send({ ok: false, result: game });
    });

    group.post("/admin/create-event", async (req, res) => {
        const parsed = createEventObject.safeParse(req.body);
        if (!parsed.success)
            return res.send({ ok: false, error: parsed.error });
        const event = await db.event.create({
            data: {
                ...parsed.data,
                game: { connect: { id: parsed.data.game } },
            },
            select: {
                id: true,
            },
        });
        res.send({ ok: true, result: event });
    });

    group.post("/admin/create-player", async (req, res) => {
        const parsed = createPlayerObject.safeParse(req.body);
        if (!parsed.success)
            return res.send({ ok: false, error: parsed.error });
        const player = await db.player.create({
            data: parsed.data,
            select: {
                id: true,
            },
        });
        res.send({ ok: false, result: player });
    });
};

export default applyRoutes;
