import { getCookie, deleteCookie } from "cookies-next";;
import { UAParser } from "ua-parser-js";
import { open, Database } from "sqlite";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import multer from "multer";
import fs from "fs";

let db = null;
const allowedMimes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const allowedExtensions = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
];

// Configure multer for file uploads with a max of 3 files
const upload = multer({
    limits: { files: 3 },
    fileFilter: (req, file, cb) => {
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type."));
        }

        const extension = file.originalname.split(".").pop();
        if (!allowedExtensions.includes(extension)) {
            return cb(new Error("Invalid file extension."));
        }

        if (file.size > 3 * 1024 * 1024) {
            return cb(new Error("File is too large."));
        }

        cb(null, true);
    }
}).array("attachments", 3);

export const config = {
    api: {
        bodyParser: false,
    }
};

export default async function handler(req, res) {
    if (!db) {
        db = await open({
            filename: "/tmp/data.db",
            driver: sqlite3.Database,
        });
    }

    if (req.method === "POST") {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            let { recipient, subject, body, snakeify, readReceipt } = req.body;

            if (readReceipt === "true") readReceipt = true;
            if (readReceipt === "false") readReceipt = false;
            if (snakeify === "true") snakeify = true;
            if (snakeify === "false") snakeify = false;
            
            if (
                typeof readReceipt !== "boolean" ||
                typeof recipient !== "string" ||
                typeof snakeify !== "boolean" ||
                typeof subject !== "string" ||
                typeof body !== "string"
            ) {
                return res.status(400).json({ error: "Invalid input." });
            }

            if (!recipient.endsWith("@mail.snakectf.org")) {
                return res.status(400).json({ error: "Invalid recipient." });
            }

            if (subject.length > 100) {
                return res.status(400).json({ error: "Subject must be at most 100 characters long." });
            }

            if (body.length > 1000) {
                return res.status(400).json({ error: "Body must be at most 1000 characters long." });
            }

            if (req.files.length > 3) {
                return res.status(400).json({ error: "You can only attach up to 3 files." });
            }

            try {
                const token = getCookie("token", { req });
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await db.get("SELECT * FROM users WHERE id = ?", [decoded.id]);

                if (!user) {
                    return res.status(400).json({ error: "User not found." });
                }

                const decodedAttachments = req.files.map((file, idx) => ({
                    id: idx,
                    filename: file.originalname,
                    mime: file.mimetype,
                    size: file.size,
                    readableType: file.mimetype.includes("image") ? "Image" : "Document"
                }));

                const dbResult = await db.run("INSERT INTO emails (sender, recipient, subject, body, date, readReceipt, snakeify, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    user.username + "@mail.snakectf.org",
                    recipient,
                    subject,
                    body,
                    new Date().toISOString(),
                    readReceipt,
                    snakeify,
                    JSON.stringify(decodedAttachments)
                ]);

                for (let idx in decodedAttachments) {
                    const attachment = decodedAttachments[idx];
                    const buffer = req.files[idx].buffer;

                    fs.mkdirSync(`/tmp/uploads/${dbResult.lastID}_${idx}`, { recursive: true });
                    fs.writeFileSync(`/tmp/uploads/${dbResult.lastID}_${idx}/${attachment.filename}`, buffer);
                }

                if (recipient === "admin@mail.snakectf.org") {
                    const tokenBot = jwt.sign({
                        itsa: "me"
                    }, process.env.JWT_SECRET);

                    fetch(process.env.REPORT_BOT_URL, {
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": JSON.stringify({
                            "token": tokenBot,
                            "emailId": dbResult.lastID,
                        })
                    });
                }

                res.json({ success: true });
            } catch (e) {
                deleteCookie("token", { req, res });
                console.error(e);
                res.status(400).json({ error: "Invalid token." });
            }
        });
    }

    if (req.method === "GET") {
        if (!req.query.id) {
            return res.status(400).json({ error: "Invalid input." });
        }

        try {
            const token = getCookie("token", { req });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await db.get("SELECT * FROM users WHERE id = ?", [decoded.id]);

            if (!user) {
                return res.status(400).json({ error: "User not found." });
            }

            const email = await db.get("SELECT * FROM emails WHERE id = ?", [req.query.id]);

            if (!email) {
                return res.status(404).json({ error: "Email not found." });
            }

            if (
                email.recipient !== user.username + "@mail.snakectf.org" &&
                email.sender !== user.username + "@mail.snakectf.org"
            ) {
                return res.status(400).json({ error: "Unauthorized." });
            }

            if (
                email.readReceipt &&
                email.recipient === user.username + "@mail.snakectf.org"
            ) {
                let parser = new UAParser(req.headers["user-agent"]);
                let userAgent = parser.getResult();

                const readReceiptEmail = `The email with the subject "${email.subject}" was read on ${new Date().toLocaleString()}.\n----- Device info -----\nOS: ${userAgent.os.name} ${userAgent.os.version}\nBrowser: ${userAgent.browser.name} (${userAgent.browser.version})\nDevice architecture: ${userAgent.cpu.architecture}\nEngine: ${userAgent.engine.name} (${userAgent.engine.version})\nUA string: ${userAgent.ua}`;

                await db.run("INSERT INTO emails (sender, recipient, subject, body, date, readReceipt, snakeify, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    email.recipient,
                    email.sender,
                    "Read Receipt",
                    readReceiptEmail,
                    new Date().toISOString(),
                    false,
                    false,
                    "[]"
                ]);
                await db.run("UPDATE emails SET readReceipt = ? WHERE id = ?", [false, email.id]);
            }

            email.attachments = JSON.parse(email.attachments);

            if (email.snakeify) {
                email.subject = email.subject.replace(/s/g, "ssss");
                email.body = email.body.replace(/s/g, "ssss");
            }

            res.json({
                success: true,
                email
             });
        } catch (e) {
            deleteCookie("token", { req, res });
            console.error(e);
            res.status(400).json({ error: "Invalid token." });
        }
    }
}