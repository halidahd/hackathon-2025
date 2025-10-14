// bot.js
import dotenv from "dotenv";
dotenv.config();

import { BotApp } from "./src/BotApp.js";

const config = {
    SOCKET_SERVER_ADDR: process.env.SOCKET_SERVER_ADDR,
    TOKEN: process.env.TOKEN,
    BOT_NAME: process.env.BOT_NAME || "VuaMin",
    AUTO_START: process.env.AUTO_START === "true",
    LOOP_INTERVAL: parseInt(process.env.BOT_LOOP_INTERVAL || "17", 10)
};

const app = new BotApp(config);
app.start();
