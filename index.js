require("dotenv/config")
const { Bot, GrammyError, HttpError } = require("grammy")

const bot = new Bot(process.env.BOT_TOKEN)

let flag = false

bot.catch(error => {
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
    if (ctx.chat.type === "private") return await next()
})

bot.command("start", async ctx => {
    if (ctx.from.id === parseInt(process.env.ADMIN_ID)) {
        await ctx.reply("<b>🎛 Admin Panel</b>", { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: `${flag ? "🛑 Stop" : "🚀 Start"}`, callback_data: `process ${flag ? "stop" : "start"}` }]] } })
    } else {
        await ctx.reply("<b>❗ You can't use this bot</b>", { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } })
    }
})

bot.callbackQuery(/^process (start|stop)$/, async ctx => {
    if (ctx.callbackQuery.data.split(" ")[1] === "start") flag = true; else flag = false
    await ctx.editMessageText("<b>🎛 Admin Panel</b>", { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: `${flag ? "🛑 Stop" : "🚀 Start"}`, callback_data: `process ${flag ? "stop" : "start"}` }]] } })
})

function getPeriod() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const date = currentDate.getDate().toString().padStart(2, "0");
    const minutes = (currentDate.getHours() * 60 + currentDate.getMinutes() + 1).toString().padStart(4, "0")
    return `${year}${month}${date}01${minutes}`;
}

function getPrediction() {
    const array = ["BIG", "SMALL"]
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getTime() {
    const currentDate = new Date();
    const hours = currentDate.getHours().toString().padStart(2, "0");
    const minutes = currentDate.getMinutes().toString().padStart(2, "0");
    const seconds = currentDate.getSeconds().toString().padStart(2, "0");
    const milliseconds = currentDate.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}


async function sendMessage() {
    const period = getPeriod()
    const prediction = getPrediction()
    const time = getTime()
    await bot.api.sendMessage(process.env.CHANNEL, `<b>PERIOD ID:</b> <code>${period}</code>\n<b>PREDICTION:</b> <code>${prediction}</code>\n<b>PREDICTION TIME:</b> <code>${time}</code>\n\n<i>MAINTAIN FUND UPTO LEVEL 5</i>`, { parse_mode: "HTML" })
}

async function startProcess() {
    const currentTime = new Date();
    const currentSeconds = currentTime.getSeconds();
    const msUntilNextMinute = (60 - currentSeconds) * 1000;
    await new Promise(resolve => setTimeout(resolve, msUntilNextMinute));
    setInterval(async () => {
        if (flag) await sendMessage();
    }, 60000);
}


bot.start({
    drop_pending_updates: true,
    onStart: async () => {
        await startProcess()
        console.log("Bot Started...")
    }
})