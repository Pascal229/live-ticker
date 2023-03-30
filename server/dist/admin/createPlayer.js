"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const createPlayerObject = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    number: zod_1.z.number().min(1),
})
    .strict();
exports.default = async (req, res) => {
    const parsed = createPlayerObject.safeParse(req.body);
    if (!parsed.success)
        return res.send({ ok: false, error: parsed.error });
    const player = await db_1.default.player.create({
        data: parsed.data,
        select: {
            id: true,
        },
    });
    res.send({ ok: true, result: player });
};
