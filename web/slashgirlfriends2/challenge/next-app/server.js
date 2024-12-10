require("dotenv").config();

const { parse } = require("url");
const express = require("express");
const next = require("next");
const WebSocket = require("ws");
const { WebSocketServer } = require("ws");

const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const replyFunction = require("./assets/replies");
const creepyMessages = require("./assets/creepyMessages");

const app = express();
const server = app.listen(3000);
const wss = new WebSocketServer({ noServer: true });
const nextApp = next({ dev: process.env.NODE_ENV !== "production" });
const clients = new Set();

const client = new MongoClient(process.env.MONGODB_URI);

nextApp.prepare().then(client.connect()).then(() => {
    app.use((req, res, next) => {
        nextApp.getRequestHandler()(req, res, parse(req.url, true));
    });

    setInterval(async () => {
        const db = client.db();
        const messages = db.collection("messages");

        const girlfriendId = "lilvirgola";
        const fromId = "1LYyA3qTu1F0I6FveUIlP";

        const [
            message,
            reply
        ] = creepyMessages();

        const insert = [
            { from: fromId, to: girlfriendId, girlfriend: false, content: message, timestamp: Date.now() },
            { from: fromId, to: girlfriendId, girlfriend: true, content: reply, timestamp: Date.now() + (1000 * (Math.floor(Math.random() * 10) + 1)) }
        ];

        clients.forEach((client) => {
            if (client.admin) {
                client.send(JSON.stringify({ event: "messageSent", messages: insert }));
            }
        });
    }, 15_000);

    wss.on("connection", (ws) => {
        ws.on("message", async (message, isBinary) => {
            let parsed = null;

            try {
                parsed = JSON.parse(message);
            } catch (e) {
                return;
            }

            if (parsed.command === "ping") {
                ws.send(`{"event":"pong"}`);
                return;
            }

            if (parsed.command === "login") {
                const { token } = parsed;
                let decoded = null;

                try {
                    decoded = jwt.verify(token, process.env.JWT_SECRET);
                } catch (e) {
                    return;
                }

                ws.userId = decoded.id;
                ws.admin = decoded.admin;
                clients.add(ws);

                return;
            }

            if (parsed.command === "message") {
                if (!ws.userId) {
                    return;
                }

                const { girlfriendId, message, toAll } = parsed;

                if (!girlfriendId || !message) {
                    return;
                }

                const db = client.db();
                const users = db.collection("users");
                const girlfriends = db.collection("girlfriends");
                const messages = db.collection("messages");

                const user = await users.findOne({ id: ws.userId });
                if (!user) {
                    return;
                }

                const girlfriend = await girlfriends.findOne({ id: girlfriendId });
                if (!girlfriend) {
                    return;
                }

                if (!toAll) {
                    if (!user.premium && girlfriend.premium) {
                        return;
                    }

                    const reply = replyFunction(girlfriendId, message);

                    if (!reply) {
                        return;
                    }

                    const insert = [
                        { from: ws.userId, to: girlfriendId, girlfriend: false, content: message, timestamp: Date.now() },
                        { from: ws.userId, to: girlfriendId, girlfriend: true, content: reply, timestamp: Date.now() + (1000 * (Math.floor(Math.random() * 10) + 1)) }
                    ];

                    await messages.insertMany(insert);

                    ws.send(JSON.stringify({ event: "message", messages: insert }));

                    clients.forEach((client) => {
                        if (client.admin) {
                            client.send(JSON.stringify({ event: "messageSent", messages: insert }));
                        }
                    });
                } else {
                    if (!ws.admin) return;
                    let done = [];

                    clients.forEach((client) => {
                        if (client.userId && !client.admin && !done.includes(client.userId)) {
                            done.push(client.userId);

                            const insert = {
                                from: client.userId,
                                to: girlfriendId,
                                girlfriend: true,
                                content: message,
                                timestamp: Date.now()
                            };

                            client.send(JSON.stringify({ event: "message", messages: [insert] }));
                            messages.insertOne(insert);
                        }
                    });

                    if (girlfriendId === "lilvirgola") {
                        try {
                            const regex = /\b(?:[a-zA-Z][a-zA-Z\d+\-.]*):\/\/[^\s]+/;
                            const match = message.match(regex);

                            if (match) {
                                const tokenBot = jwt.sign({
                                    itsa: "me"
                                }, process.env.JWT_SECRET);

                                const resp = await fetch(process.env.REPORT_BOT_BASEURL + "/user/visit", {
                                    "method": "POST",
                                    "headers": {
                                        "Content-Type": "application/json"
                                    },
                                    "body": JSON.stringify({
                                        "token": tokenBot,
                                        "url": match[0]
                                    })
                                });
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    ws.send(JSON.stringify({ event: "bulkMessageDone" }));
                }
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    server.on("upgrade", (req, socket, head) => {
        const { pathname } = parse(req.url || "/", true);

        if (pathname === "/_next/webpack-hmr") {
            nextApp.getUpgradeHandler()(req, socket, head);
        }

        if (pathname === "/api/ws") {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        }
    });
})
