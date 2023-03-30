import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { FastifyRequest, FastifyReply } from "fastify";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import db from "./db";

export const ELGG_SECRET = process.env.ELGG_SECRET as string;
if (!ELGG_SECRET) throw Error("No ELGG_SECRET provided.");

const getUser = (
    req: FastifyRequest
): { id: number; name: string } | undefined => {
    return { id: 1, name: "test" };

    // if (!req.headers.cookie) return;
    // const cookies = cookie.parse(req.headers.cookie);
    // if (typeof cookies.ELGG_TOKEN !== "string") return;
    // try {
    //     const decoded = jwt.verify(cookies.ELGG_TOKEN, ELGG_SECRET);
    //     console.log(decoded);
    //     if (
    //         typeof decoded === "object" &&
    //         typeof decoded.id === "number" &&
    //         typeof decoded.name === "string"
    //     )
    //         return decoded as { id: number; name: string };
    //     else return;
    // } catch {
    //     return;
    // }
};

export function createContext({ req, res }: CreateFastifyContextOptions) {
    const user = getUser(req);
    return { req, res, user };
}
export type Context = inferAsyncReturnType<typeof createContext>;
