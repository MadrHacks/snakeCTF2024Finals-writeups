require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const puppeteer = require("puppeteer");

const { PORT, JWT_SECRET, SITE_BASEURL, PAYMENT_SITE_BASEURL, SNAKE_PAYMENT_DOMAIN, SHOW_LOGS: dbg } = process.env;
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

const navigateAdmin = async (uid, botId) => {
    currentBots.push({
        id: botId,
        browser,
        start: new Date()
    });

    const page = await browser.newPage();
    page.setExtraHTTPHeaders({
        "ngrok-skip-browser-warning": "true"
    });

    try {
        const token = jwt.sign({ id: "admin", admin: true }, JWT_SECRET);
        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Generated token: ${token}`);

        await page.goto(SITE_BASEURL);
        await page.setCookie({
            "name": "auth",
            "value": token
        });
        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Set cookie`);

        await page.goto(SITE_BASEURL + "/u/" + uid);
        await sleep(10_000);

        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Done.`);
        finishedBots.push(botId);
    } catch (e) {
        if (timedoutBots.includes(botId)) return;

        if (dbg) console.error(`${COLORS.red}[${botId}]${COLORS.reset} - Exception:\n${e}`);
        erroredBots.push(botId);
    } finally {
        if (timedoutBots.includes(botId)) return;

        currentBots = currentBots.filter(b => b.id != botId);

        await page.close();
    }
};

const navigateUser = async (url, botId) => {
    currentBots.push({
        id: botId,
        browser,
        start: new Date()
    });

    const page = await browser.newPage();
    page.setExtraHTTPHeaders({
        "ngrok-skip-browser-warning": "true"
    });

    try {
        const pageResponse = await page.goto(url);
        if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Visiting ${url}`);

        const pageHost = new URL(page.url()).host;
        let isPaymentSite = pageHost == SNAKE_PAYMENT_DOMAIN;

        if (!isPaymentSite) {
            if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - URL is not payment site. Exiting...`);
        } else {
            if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - URL is payment site. Filling form...`);

            // Remove all forms that are not visible
            await page.evaluate(() => {
                document.querySelectorAll("form").forEach(form => {
                    const isVisible = form.offsetWidth > 0 && form.offsetHeight > 0;
                    if (!isVisible) {
                        form.remove();
                    }
                });
            });

            await page.type('input[name="pan"]', "4598257662840913");
            await page.type('input[name="exp"]', "02/28");
            await page.type('input[name="cvv"]', "881");
            await page.type('input[name="notes"]', process.env.FLAG || "snakeCTF{f4ke_fl4g_f0r_t3st1ng}");

            await page.evaluate(() => {
                document.querySelector("form").submit();
            });

            await sleep(10_000);

            if (dbg) console.error(`${COLORS.blue}[${botId}]${COLORS.reset} - Done.`);
        }

        finishedBots.push(botId);
    } catch (e) {
        if (timedoutBots.includes(botId)) return;

        if (dbg) console.error(`${COLORS.red}[${botId}]${COLORS.reset} - Exception:\n${e}`);
        erroredBots.push(botId);
    } finally {
        if (timedoutBots.includes(botId)) return;

        currentBots = currentBots.filter(b => b.id != botId);

        await page.close();
    }
};

// Checking if bots are taking too long to run
setInterval(async () => {
    for (const bot of currentBots) {
        if (((new Date() - bot.start) / 1000) > 60_000) {
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

app.post("/admin/visit", async (req, res) => {
    const {
        uid,
        token
    } = req.body;

    if (!uid || !token) {
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

    navigateAdmin(uid, botId);

    if (dbg) console.log(`${COLORS.blue}[SERVER]${COLORS.reset} - Spawned bot with ID ${COLORS.green}${botId}${COLORS.reset}.`);

    return res.status(200).json({
        success: true,
        visiting: true,
        id: botId
    });
});

app.post("/user/visit", async (req, res) => {
    const {
        url,
        token
    } = req.body;

    if (!url || !token) {
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

    navigateUser(url, botId);

    if (dbg) console.log(`${COLORS.blue}[SERVER]${COLORS.reset} - Spawned bot with ID ${COLORS.green}${botId}${COLORS.reset}.`);

    return res.status(200).json({
        success: true,
        visiting: true,
        id: botId
    });
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
