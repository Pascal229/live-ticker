import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'stream';
import { Context, ELGG_SECRET } from './context';
import superjson from 'superjson';
import z from 'zod';
import db from './db';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { getCurrentGame } from './game';

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	},
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const gameEventEmitter = new EventEmitter();
export const chatEventEmitter = new EventEmitter();
export const viewCountEmitter = new EventEmitter();

export let viewCount = 0;
export let commentCount = 0;
export let accountCount = 0;
export let totalViewCount = 0;

const updateViewCounter = (change: number) => {
	if (change === 1) totalViewCount += 1;
	viewCount += change;
	viewCountEmitter.emit('update', viewCount);
};

export interface ChatEvent {
	id: number;
	action: 'create_comment';
	text: string;
	user: {
		id: number;
		name: string;
	};
}

export interface Team {
	name: string;
	key: string;
	score: number;
}

export interface Game {
	id: number;
	status: GameStatus;
	teams: [Team, Team];
	events: GameUpdateEvent[];
	startDateTime: Date;
}

export enum GameStatus {
	NOT_STARTED,
	FIRST_PERIOD,
	SECOND_PERIOD,
	PAUSED,
	BREAK,
	FINISHED,
}

export enum GameUpdateType {
	GOAL,
	PENALTY,
	PENALTY_KICK,
	STATE_UDPATE,
}

export type GameUpdateEvent =
	| GameGoalEvent
	| GamePenaltyOrPenaltyKickEvent
	| GameStateUpdateEvent;

interface BaseGameUpdateEvent {
	id: number;
	game_id: number;
	timestamp: Date;
	display_time: number;
}

interface SimplePlayer {
	id: number;
	name: string;
	number: number;
}

export interface GameGoalEvent extends BaseGameUpdateEvent {
	type: GameUpdateType.GOAL;
	team_index: number;
	player: SimplePlayer | null;
	assist: SimplePlayer | null;
}

export interface GamePenaltyOrPenaltyKickEvent extends BaseGameUpdateEvent {
	type: GameUpdateType.PENALTY | GameUpdateType.PENALTY_KICK;
	team_index: number;
	player: SimplePlayer | null;
	assist: SimplePlayer | null;
}

export interface GameStateUpdateEvent extends BaseGameUpdateEvent {
	type: GameUpdateType.STATE_UDPATE;
	new_state: GameStatus;
}

export const appRouter = createTRPCRouter({
	commentEmitter: publicProcedure.subscription(() => {
		return observable<ChatEvent>((emit) => {
			const onAdd = (event: ChatEvent) => emit.next(event);
			chatEventEmitter.on('event', onAdd);
			return () => chatEventEmitter.off('event', onAdd);
		});
	}),
	commenterName: publicProcedure.query(async ({ ctx }) => {
		if (ctx.user) return { ok: true, result: ctx.user };
		return { ok: false };
	}),
	setCommenterName: publicProcedure
		.input(
			z.object({
				name: z.string().min(3).max(20),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (ctx.user) return { ok: true, result: ctx.user };
			const newUser = await db.user.create({
				data: {
					name: input.name,
				},
				select: {
					name: true,
					id: true,
				},
			});

			const cookieExpiration = new Date();
			cookieExpiration.setTime(
				cookieExpiration.getTime() + 1000 * 60 * 60 * 24 * 365
			);

			accountCount++;

			ctx.res.header(
				'set-cookie',
				cookie.serialize(
					'ELGG_TOKEN',
					jwt.sign(
						{ id: newUser.id, name: newUser.name },
						ELGG_SECRET
					),
					{
						secure: true,
						path: '/',
						httpOnly: true,
						expires: cookieExpiration,
					}
				)
			);

			return { ok: true, result: newUser };
		}),
	submitComment: publicProcedure
		.input(
			z.object({
				text: z.string().min(1).max(200),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.user) return { ok: false };
			const comment = await db.comment.create({
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
			commentCount++;
			chatEventEmitter.emit('event', {
				id: comment.id,
				action: 'create_comment',
				text: input.text,
				user: comment.user,
			} as ChatEvent);
			return { ok: true, result: comment };
		}),
	tickerEmitter: publicProcedure.subscription(() => {
		return observable<Game>((emit) => {
			const onAdd = (event: Game) => emit.next(event);
			gameEventEmitter.on('event', onAdd);
			updateViewCounter(1);
			return () => {
				gameEventEmitter.off('event', onAdd);
				updateViewCounter(-1);
			};
		});
	}),
	currentGame: publicProcedure.query(async (): Promise<Game | null> => {
		return getCurrentGame();
	}),
	viewCount: publicProcedure.query(() => viewCount),
	viewCountEmitter: publicProcedure.subscription(() =>
		observable<number>((emit) => {
			const onAdd = (count: number) => emit.next(count);
			viewCountEmitter.on('update', onAdd);
			return () => viewCountEmitter.off('update', onAdd);
		})
	),
	comments: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).nullish(),
				cursor: z.number().nullish(), // <-- "cursor" needs to exist, but can be any type
			})
		)
		.query(async ({ input }) => {
			const limit = input.limit ?? 50;
			const { cursor } = input;
			const items = await db.comment.findMany({
				take: limit + 1, // get an extra item at the end which we'll use as next cursor
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					createdAt: 'desc',
				},
				include: {
					user: true,
				},
			});
			let nextCursor: typeof cursor | undefined = undefined;
			if (items.length > limit) {
				const nextItem = items.pop();
				nextCursor = nextItem!.id;
			}
			return {
				items,
				nextCursor,
			};
		}),
});

export type AppRouter = typeof appRouter;
