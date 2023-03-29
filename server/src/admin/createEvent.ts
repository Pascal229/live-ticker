import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import db from "../db";
import { getGame } from "../game";
import { gameEventEmitter } from "../trpc";

const createEventObject = z
  .object({
    type: z.enum(["GOAL", "PENALTY", "PENALTY_KICK"]),
    time: z
      .string()
      .refine((value) => new Date(value))
      .default(() => new Date().toISOString()),
    gameId: z.number(),
    isHomeTeam: z.boolean(),
    scorerPlayer: z.number().optional(),
    assistPlayer: z.number().optional(),
  })
  .strict()
  .or(
    z
      .object({
        time: z
          .string()
          .refine((value) => new Date(value))
          .default(() => new Date().toISOString()),
        type: z.enum([
          "BREAK",
          "PAUSE",
          "FIRST_PERIOD",
          "SECOND_PERIOD",
          "FINISH",
        ]),
        gameId: z.number(),
      })
      .strict()
  );

export default async (req: FastifyRequest, res: FastifyReply) => {
  const parsed = createEventObject.safeParse(req.body);
  if (!parsed.success) return res.send({ ok: false, error: parsed.error });

  const eventData = parsed.data;
  let insertedActionId = -1;

  if (
    eventData.type === "GOAL" ||
    eventData.type === "PENALTY" ||
    eventData.type === "PENALTY_KICK"
  ) {
    const event = await db.event.create({
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
  } else {
    const event = await db.event.create({
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
  const newGame = await getGame({ id: eventData.gameId });
  if (!newGame)
    return res.send({
      ok: true,
      warning: "Unexpected error: Didn't find game to push event to users!",
    });
  else {
    const newEvent = newGame.events.find(
      (event) => event.id === insertedActionId
    );
    if (!newEvent)
      return res.send({
        ok: true,
        warning: "Unexpected error: Event not found in game log.",
      });
    res.send({ ok: true, result: newEvent });
    gameEventEmitter.emit("event", newEvent);
  }
};
