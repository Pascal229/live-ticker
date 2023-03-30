"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentGame = exports.getGame = void 0;
const db_1 = __importDefault(require("./db"));
const trpc_1 = require("./trpc");
const getGame = async (criteria) => {
    const targetGame = await db_1.default.game.findFirst({
        where: criteria,
        orderBy: {
            date: "desc",
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
    if (!targetGame)
        return null;
    const global_events = [];
    let last_status = trpc_1.GameStatus.NOT_STARTED;
    let last_timestamp = targetGame.date;
    let game_time = 0;
    for (let event of targetGame.history) {
        const TIME_STOPPERS = ["BREAK", "FINISH", "PAUSE"];
        const TIME_STOPPERS_ENUM = [
            trpc_1.GameStatus.BREAK,
            trpc_1.GameStatus.FINISHED,
            trpc_1.GameStatus.PAUSED,
            trpc_1.GameStatus.NOT_STARTED,
        ];
        const TIME_STARTERS = ["FIRST_PERIOD", "SECOND_PERIOD"];
        const TIME_STARTERS_ENUM = [
            trpc_1.GameStatus.FINISHED,
            trpc_1.GameStatus.FIRST_PERIOD,
            trpc_1.GameStatus.SECOND_PERIOD,
        ];
        if (TIME_STOPPERS.includes(event.type)) {
            if (TIME_STARTERS_ENUM.includes(last_status)) {
                game_time += event.time.getTime() - last_timestamp.getTime();
                last_timestamp = event.time;
            }
            last_status =
                event.type === "BREAK"
                    ? trpc_1.GameStatus.BREAK
                    : event.type === "FINISH"
                        ? trpc_1.GameStatus.FINISHED
                        : trpc_1.GameStatus.PAUSED;
            global_events.push({
                id: event.id,
                timestamp: event.time,
                display_time: Math.floor(game_time / 60 / 1000),
                game_id: targetGame.id,
                type: trpc_1.GameUpdateType.STATE_UDPATE,
                new_state: last_status,
            });
        }
        else if (event.type === "FIRST_PERIOD" ||
            event.type === "SECOND_PERIOD") {
            if (TIME_STOPPERS_ENUM.includes(last_status))
                last_timestamp = event.time;
            last_status =
                event.type === "FIRST_PERIOD"
                    ? trpc_1.GameStatus.FIRST_PERIOD
                    : trpc_1.GameStatus.SECOND_PERIOD;
            global_events.push({
                id: event.id,
                timestamp: event.time,
                game_id: targetGame.id,
                display_time: Math.floor(game_time / 60 / 1000),
                type: trpc_1.GameUpdateType.STATE_UDPATE,
                new_state: last_status,
            });
        }
        else if (["PENALTY", "PENALTY_KICK", "GOAL"].includes(event.type)) {
            game_time += event.time.getTime() - last_timestamp.getTime();
            last_timestamp = event.time;
            if (typeof event.teamIndex !== "number" || event.teamIndex >= 2)
                continue;
            global_events.push({
                id: event.id,
                type: event.type === "GOAL"
                    ? trpc_1.GameUpdateType.GOAL
                    : event.type === "PENALTY"
                        ? trpc_1.GameUpdateType.PENALTY
                        : trpc_1.GameUpdateType.PENALTY_KICK,
                assist: (event === null || event === void 0 ? void 0 : event.assistingPlayer) || null,
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
    };
};
exports.getGame = getGame;
const getCurrentGame = () => {
    const now = new Date();
    const inTenMinutes = new Date(now.getTime() + 1000 * 60 * 10);
    return (0, exports.getGame)({
        date: {
            lt: inTenMinutes,
        },
    });
};
exports.getCurrentGame = getCurrentGame;
