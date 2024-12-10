require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const puppeteer = require("puppeteer");

const { PORT, JWT_SECRET, SITE_BASEURL, SHOW_LOGS: dbg } = process.env;
const COLORS = {
    "red": "\x1b[31m",
    "green": "\x1b[32m",
    "reset": "\x1b[0m",
    "blue": "\x1b[34m",
    "reverse": "\x1b[7m"
};
const browser_options = {
    "headless": true,
    "defaultViewport": null,
    "ignoreHTTPSErrors": true,
    //    "executablePath": "/usr/bin/chromium-browser",
    "args": [
        "--no-sandbox",
        '--disable-setuid-sandbox',
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-gpu",
        "--disable-sync",
        "--disable-translate",
        "--mute-audio",
        "--hide-scrollbars",
        "--metrics-recording-only",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--js-flags=--noexpose_wasm,--jitless",
        "--ignore-certificate-errors",
        "--disable-features=AutoupgradeMixedContent"
    ],
};

let oldConsole = { ...console };
console.log = (...args) => oldConsole.log(`${COLORS.reverse}${new Date().toLocaleString()}${COLORS.reset} |`, ...args);
console.error = (...args) => oldConsole.error(`${COLORS.reverse}${new Date().toLocaleString()}${COLORS.reset} |`, ...args);

const sleep = ms => new Promise(res => setTimeout(res, ms));

let currentBots = [];
let finishedBots = [];
let erroredBots = [];
let timedoutBots = [];

let browser = null;

const navigate = async (emailId, botId) => {
    currentBots.push({
        id: botId,
        browser,
        start: new Date()
    });

    let page;

    try {
        page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            "ngrok-skip-browser-warning": "true"
        });

        const token = jwt.sign({ id: 1 }, JWT_SECRET);
        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Generated token: ${token}`);

        await page.goto(SITE_BASEURL);
        await page.setCookie({
            "name": "token",
            "value": token
        });
        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Set cookie`);

        await page.goto(`${SITE_BASEURL}/app`);
        await page.waitForSelector("[data-email-id]");

        await page.click(`[data-email-id="${emailId}"]`);
        await sleep(1_000);

        const attachments = await page.evaluate(() => {
            return [...document.querySelectorAll('[data-mime="application/pdf"]')].map(e => e.getAttribute("data-id"));
        });

        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Found ${attachments.length} attachment(s).`);

        for (const attachment of attachments) {
            await page.goto(`${SITE_BASEURL}/pdf?email=${emailId}&id=${attachment}`);
            await sleep(2_500);
        }

        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Done.`);
        finishedBots.push(botId);
    } catch (e) {
        if (timedoutBots.includes(botId)) return;

        if (dbg) console.error(`${COLORS.red}[${botId}]${COLORS.reset} - Exception:\n${e}`);
        erroredBots.push(botId);

        if (page) await page.close();
    } finally {
        if (timedoutBots.includes(botId)) return;

        await page.close();
        currentBots = currentBots.filter(b => b.id != botId);
    }
};

// Checking if bots are taking too long to run
setInterval(async () => {
    for (const bot of currentBots) {
        if (((new Date() - bot.start) / 1000) > 15_000) {
            try {
                if (dbg) console.log(`${COLORS.blue}[${bot.id}]${COLORS.reset} - Bot timed out. Forcing close...`);
                await bot.browser.close();
                timedoutBots.push(bot.id);
            } catch (e) {
                if (dbg) console.error(`${COLORS.red}[${bot.id}]${COLORS.reset} - Exception:\n${e.stack}`);
                erroredBots.push(bot.id);
            } finally {
                currentBots = currentBots.filter(b => b.id != bot.id);
            }
        }
    }
}, 15_000);

const app = express();
app.use(require("body-parser").json());

app.use((err, req, res, next) => {
    console.error(`${COLORS.red}[SERVER]${COLORS.reset} - Unhandled rejection: ${err.stack}`);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});
process.on("unhandledRejection", function(reason, p) {
    console.error(`${COLORS.red}[SERVER]${COLORS.reset} - Unhandled rejection: ${reason}\n${p}`);
});

app.get("/status/:id", async (req, res) => {
    const { id: botId } = req.params;
    const bot = currentBots.find((b) => b.id == botId);

    if (!bot) {
        let status;
        if (finishedBots.includes(botId))
            status = "DONE";
        else if (erroredBots.includes(botId))
            status = "CRASHED";
        else if (timedoutBots.includes(botId))
            status = "TIMEDOUT";

        if (status) {
            return res.status(200).json({
                success: true,
                status
            });
        }

        return res.status(404).json({
            success: false,
            message: "Bot not found"
        });
    }

    const procInfo = await bot.browser.process();
    if (!!procInfo.signalCode) {
        if (dbg) console.error(`${COLORS.red}[${botId}]${COLORS.reset} - Bot process died... Moving to erroredBots`);

        erroredBots.push(botId);
        currentBots = currentBots.filter(b => b.id != botId);

        return res.status(200).json({
            success: true,
            status: "CRASHED"
        });
    }

    return res.status(200).json({
        success: true,
        status: "RUNNING"
    })
});

app.post("/visit", async (req, res) => {
    const {
        emailId,
        token
    } = req.body;

    if (!emailId) {
        return res.status(422).json({
            success: false,
            status: "give me the data"
        });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({
            success: false,
            status: "ayooo??"
        });
    }

    const botId = (Math.random() + 1).toString(36).substring(2);

    navigate(emailId, botId);

    if (dbg) console.log(`${COLORS.blue}[SERVER]${COLORS.reset} - Spawned bot with ID ${COLORS.green}${botId}${COLORS.reset}.`);

    return res.status(200).json({
        success: true,
        visiting: true,
        id: botId
    })
});

app.get("/ping", async (req, res) => {
    res.status = 200;
    res.send("Pong");
    res.end();
});

puppeteer.launch(browser_options).then(b => {
    browser = b;

    app.listen(PORT, (e) => {
        if (e)
            return console.error(`${COLORS.red}[SERVER]${COLORS.reset} - Couldn't start server: ${e}`);

        console.log(`${COLORS.blue}[SERVER]${COLORS.reset} - Started server. Listening on http://0.0.0.0:${PORT}`);
    });
});
