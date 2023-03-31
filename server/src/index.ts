import dotenv from 'dotenv';
dotenv.config();

import cors from '@fastify/cors';
import path from 'path';
import fstatic from '@fastify/static';
import fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import ws from '@fastify/websocket';
import {
	accountCount,
	appRouter,
	commentCount,
	totalViewCount,
	viewCount,
} from './trpc';
import adminRoutes from './admin';
import { createContext } from './context';

const server = fastify();

server.get('/ping', async (_, res) => {
	res.send('pong');
});

server.register(fstatic, {
	root: path.join(__dirname, '..', '..', 'client', 'dist'),
	prefix: '/',
});

server.register(ws);
server.register(fastifyTRPCPlugin, {
	prefix: '/trpc',
	useWSS: true,
	useWss: true,
	trpcOptions: { router: appRouter, createContext },
});

server.register(cors, {
	origin: true,
});

server.get('/metrics', (_, res) => {
	const data = {
		uhc_elgg_live_total_viewer_count: totalViewCount,
		uhc_elgg_live_total_account_count: accountCount,
		uhc_elgg_live_total_comment_count: commentCount,
		uhc_elgg_live_current_view_count: viewCount,
	};
	res.send(
		Object.entries(data)
			.map((key, value) => key + '\t' + value.toString())
			.join('\n')
	);
});

adminRoutes(server);

(async () => {
	try {
		await server.listen({ port: 3000, host: '0.0.0.0' });
		console.log(`Server listening on 3000`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
})();
