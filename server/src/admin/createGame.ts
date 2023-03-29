import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import db from "../db";

const createGameObject = z
  .object({
    homeTeam: z.string().min(1),
    homeTeamKey: z.string().min(1),
    guestTeam: z.string().min(1),
    guestTeamKey: z.string().min(1),
    players: z
      .array(z.number())
      .min(1)
      .refine((players) => ({
        connect: players.map((player) => ({ id: player })),
      })),
    homeScore: z.number().default(0),
    status: z
      .enum([
        "NOT_STARTED",
        "FIRST_PERIOD",
        "SECOND_PERIOD",
        "PAUSED",
        "BREAK",
        "FINISHED",
      ])
      .default("NOT_STARTED"),
    guestScore: z.number().default(0),
    date: z.string().refine((value) => new Date(value)),
  })
  .strict();

export default async (req: FastifyRequest, res: FastifyReply) => {
  const parsed = createGameObject.safeParse(req.body);
  if (!parsed.success) return res.send({ ok: false, error: parsed.error });

  const date = new Date(parsed.data.date);
  if (isNaN(date.getTime()))
    return res.send({ ok: false, error: "date not valid string" });

  const game = await db.game.create({
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
