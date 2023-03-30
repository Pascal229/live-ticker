"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.ELGG_SECRET = void 0;
const cookie_1 = __importDefault(require("cookie"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.ELGG_SECRET = process.env.ELGG_SECRET;
if (!exports.ELGG_SECRET)
    throw Error("No ELGG_SECRET provided.");
const getUser = (req) => {
    //   return { id: 1, name: "test" };
    if (!req.headers.cookie)
        return;
    const cookies = cookie_1.default.parse(req.headers.cookie);
    if (typeof cookies.ELGG_TOKEN !== "string")
        return;
    try {
        const decoded = jsonwebtoken_1.default.verify(cookies.ELGG_TOKEN, exports.ELGG_SECRET);
        if (typeof decoded === "object" &&
            typeof decoded.id === "number" &&
            typeof decoded.name === "string")
            return decoded;
        else
            return;
    }
    catch (_a) {
        return;
    }
};
function createContext({ req, res }) {
    const user = getUser(req);
    return { req, res, user };
}
exports.createContext = createContext;
