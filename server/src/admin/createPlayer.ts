import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import db from "../db";

const createPlayerObject = z.object({
    name: z.string().min(1),
    number: z.number().min(1),
}).strict();


export default async (req: FastifyRequest, res: FastifyReply) => {
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
}