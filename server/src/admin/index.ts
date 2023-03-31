import type { FastifyInstance } from 'fastify';
import createGame from './createGame';
import createEvent from './createEvent';
import createPlayer from './createPlayer';

const adminToken = process.env.ELGG_ADMIN as string;
if (!adminToken) throw new Error('No ELGG_ADMIN provided!');

const applyRoutes = (group: FastifyInstance) => {
	group.addHook('preHandler', (req, res, next) => {
		if (req.url.startsWith('/admin/') && adminToken !== req.headers.token)
			return res.send({ ok: false, error: 'Unauthorized.' });
		next();
	});

	group.post('/admin/create-game', createGame);

	group.post('/admin/create-event', createEvent);

	group.post('/admin/create-player', createPlayer);
};

export default applyRoutes;
