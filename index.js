require("dotenv/config");
const { Bot, GrammyError, HttpError } = require("grammy");
const moment = require("moment-timezone");

const bot = new Bot(process.env.BOT_TOKEN);

let flag = false;

bot.catch((error) => {
    console.log(`Error while handling update ${error.ctx.update.update_id}:`);
    if (error.error instanceof GrammyError) {
        console.log("Error in request:", error.error.description);
    } else if (error.error instanceof HttpError) {
        console.log("Could not contact Telegram:", error.error);
    } else {
        console.log("Unknown error:", error.error);
    }
});

bot.use(async (ctx, next) => {
    if (ctx.chat.type === "private") return await next();
});

bot.command("start", async (ctx) => {
    if (ctx.from.id === parseInt(process.env.ADMIN_ID)) {
        await ctx.reply("<b>🎛 Admin Panel</b>", {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `${flag ? "🛑 Stop" : "🚀 Start"}`,
                            callback_data: `process ${flag ? "stop" : "start"}`,
                        },
                    ],
                ],
            },
        });
    } else {
        await ctx.reply("<b>❗ You can't use this bot</b>", {
            parse_mode: "HTML",
            reply_parameters: { message_id: ctx.message.message_id },
        });
    }
});

bot.callbackQuery(/^process (start|stop)$/, async (ctx) => {
    flag = ctx.callbackQuery.data.split(" ")[1] === "start";
    await ctx.editMessageText("<b>🎛 Admin Panel</b>", {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: `${flag ? "🛑 Stop" : "🚀 Start"}`,
                        callback_data: `process ${flag ? "stop" : "start"}`,
                    },
                ],
            ],
        },
    });
});

function getPeriod() {
    const currentDate = moment.tz("Asia/Kolkata");
    const year = currentDate.year();
    const month = (currentDate.month() + 1).toString().padStart(2, "0");
    const date = currentDate.date().toString().padStart(2, "0");
    const minutes = (currentDate.hour() * 60 + currentDate.minute() + 1).toString().padStart(4, "0");
    return `${year}${month}${date}01${minutes}`;
}

function getPrediction() {
    const array = ["BIG", "SMALL"];
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getTime() {
    const currentDate = moment.tz("Asia/Kolkata");
    return currentDate.format("HH:mm:ss.SSS");
}

async function sendMessage() {
    const period = getPeriod();
    const prediction = getPrediction();
    const time = getTime();
    await bot.api.sendMessage(
        process.env.CHANNEL,
        `<b>❤️ TG 100 PREDICTION:</b>\n<b>🕹 Gᴀᴍᴇ :</b> Wɪɴɢᴏ 1 Mɪɴ \n<b>📟 Pᴇʀɪᴏᴅ Nᴏ :</b> ${period}\n<b>🎰 Pʀᴇᴅɪᴄᴛɪᴏɴ </b>: ${prediction}\n<b>✅ MANAGE FUND UP TO LEVEL 7<b>`,
        { parse_mode: "HTML" }
    );
}

async function startProcess() {
    const currentTime = moment.tz("Asia/Kolkata");
    const currentSeconds = currentTime.seconds();
    const msUntilNextMinute = (60 - currentSeconds) * 1000;
    await new Promise((resolve) => setTimeout(resolve, msUntilNextMinute));
    setInterval(async () => {
        if (flag) await sendMessage();
    }, 60000);
}

bot.start({
    drop_pending_updates: true,
    onStart: async () => {
        await startProcess();
        console.log("Bot Started...");
    },
});
