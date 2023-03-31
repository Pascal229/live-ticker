import db from './db';
import { Game, GameStatus, GameUpdateEvent, GameUpdateType } from './trpc';

export const getGame = async (criteria: any): Promise<Game | null> => {
	const targetGame = await db.game.findFirst({
		where: criteria,
		orderBy: {
			date: 'desc',
		},
		select: {
			id: true,
			date: true,
			status: true,
			homeScore: true,
			guestScore: true,
			homeTeam: true,
			homeTeamKey: true,
			guestTeam: true,
			guestTeamKey: true,
			players: {
				select: {
					id: true,
					name: true,
					number: true,
				},
			},
			history: {
				select: {
					id: true,
					type: true,
					time: true,
					teamIndex: true,
					assistingPlayer: {
						select: {
							name: true,
							number: true,
							id: true,
						},
					},
					scorerPlayer: {
						select: {
							name: true,
							number: true,
							id: true,
						},
					},
				},
			},
		},
	});
	if (!targetGame) return null;
	const global_events: GameUpdateEvent[] = [];
	let last_status = GameStatus.NOT_STARTED;
	let last_timestamp = targetGame.date;
	let game_time = 0;

	for (let event of targetGame.history) {
		const TIME_STOPPERS = ['BREAK', 'FINISH', 'PAUSE'];
		const TIME_STOPPERS_ENUM = [
			GameStatus.BREAK,
			GameStatus.FINISHED,
			GameStatus.PAUSED,
			GameStatus.NOT_STARTED,
		];
		const TIME_STARTERS = ['FIRST_PERIOD', 'SECOND_PERIOD'];
		const TIME_STARTERS_ENUM = [
			GameStatus.FINISHED,
			GameStatus.FIRST_PERIOD,
			GameStatus.SECOND_PERIOD,
		];

		if (TIME_STOPPERS.includes(event.type)) {
			if (TIME_STARTERS_ENUM.includes(last_status)) {
				game_time += event.time.getTime() - last_timestamp.getTime();

				last_timestamp = event.time;
			}
			last_status =
				event.type === 'BREAK'
					? GameStatus.BREAK
					: event.type === 'FINISH'
					? GameStatus.FINISHED
					: GameStatus.PAUSED;
			global_events.push({
				id: event.id,
				timestamp: event.time,
				display_time: Math.floor(game_time / 60 / 1000),
				game_id: targetGame.id,
				type: GameUpdateType.STATE_UDPATE,
				new_state: last_status,
			});
		} else if (
			event.type === 'FIRST_PERIOD' ||
			event.type === 'SECOND_PERIOD'
		) {
			if (TIME_STOPPERS_ENUM.includes(last_status))
				last_timestamp = event.time;
			last_status =
				event.type === 'FIRST_PERIOD'
					? GameStatus.FIRST_PERIOD
					: GameStatus.SECOND_PERIOD;
			global_events.push({
				id: event.id,
				timestamp: event.time,
				game_id: targetGame.id,
				display_time: Math.floor(game_time / 60 / 1000),
				type: GameUpdateType.STATE_UDPATE,
				new_state: last_status,
			});
		} else if (['PENALTY', 'PENALTY_KICK', 'GOAL'].includes(event.type)) {
			game_time += event.time.getTime() - last_timestamp.getTime();
			last_timestamp = event.time;
			if (typeof event.teamIndex !== 'number' || event.teamIndex >= 2)
				continue;
			global_events.push({
				id: event.id,
				type:
					event.type === 'GOAL'
						? GameUpdateType.GOAL
						: event.type === 'PENALTY'
						? GameUpdateType.PENALTY
						: GameUpdateType.PENALTY_KICK,
				assist: event?.assistingPlayer || null,
				game_id: targetGame.id,
				display_time: Math.floor(game_time / 60 / 1000),
				player: event.scorerPlayer,
				team_index: event.teamIndex,
				timestamp: event.time,
			});
		}
	}

	return {
		id: targetGame.id,
		events: global_events,
		status: last_status,
		teams: [
			{
				name: targetGame.homeTeam,
				key: targetGame.homeTeamKey,
				score: targetGame.homeScore,
			},
			{
				name: targetGame.guestTeam,
				key: targetGame.guestTeamKey,
				score: targetGame.guestScore,
			},
		],
		startDateTime: targetGame.date,
	};
};

export const getCurrentGame = async (): Promise<Game | null> => {
	const now = new Date();
	const inTenMinutes = new Date(now.getTime() + 1000 * 60 * 1000);

	const game = await getGame({
		date: {
			lt: inTenMinutes,
		},
	});
	if (game) return game;
	else return getGame({});
};
