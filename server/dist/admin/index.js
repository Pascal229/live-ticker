"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createGame_1 = __importDefault(require("./createGame"));
const createEvent_1 = __importDefault(require("./createEvent"));
const createPlayer_1 = __importDefault(require("./createPlayer"));
const applyRoutes = (group) => {
    group.post("/admin/create-game", createGame_1.default);
    group.post("/admin/create-event", createEvent_1.default);
    group.post("/admin/create-player", createPlayer_1.default);
};
exports.default = applyRoutes;
