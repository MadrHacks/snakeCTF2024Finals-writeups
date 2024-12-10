import { getCookie, deleteCookie } from "cookies-next";;
import { open, Database } from "sqlite";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import fs from "fs";

let db = null;

export default async function handler(req, res) {
    if (!db) {
        db = await open({
            filename: "/tmp/data.db",
            driver: sqlite3.Database,
        });
    }

    if (req.method !== "GET") {
        return res.status(400).json({ error: "Invalid method." });
    }

    if (!req.query.email || !req.query.id) {
        return res.status(400).json({ error: "Invalid input." });
    }

    try {
        const token = getCookie("token", { req });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.get("SELECT * FROM users WHERE id = ?", [decoded.id]);

        if (!user) {
            return res.status(400).json({ error: "User not found." });
        }

        const email = await db.get("SELECT * FROM emails WHERE id = ?", [req.query.email]);

        if (!email) {
            return res.status(404).json({ error: "Email not found." });
        }

        if (
            email.recipient !== user.username + "@mail.snakectf.org" &&
            email.sender !== user.username + "@mail.snakectf.org"
        ) {
            return res.status(400).json({ error: "Unauthorized." });
        }

        email.attachments = JSON.parse(email.attachments);

        const attachment = email.attachments[req.query.id];

        if (!attachment) {
            return res.status(404).json({ error: "Attachment not found." });
        }

        const fileExtension = attachment.filename.split(".").pop() || "txt";
        if (req.query.download) {
            res.setHeader("Content-Disposition", `attachment; filename="file.${fileExtension}"`);
        } else {
            res.setHeader("Content-Disposition", `inline; filename="file.${fileExtension}"`);
        }

        const buffer = fs.readFileSync(`/tmp/uploads/${email.id}_${req.query.id}/${attachment.filename}`);
        
        res.write(buffer);
        res.end();
    } catch (e) {
        deleteCookie("token", { req, res });
        console.error(e);
        res.status(400).json({ error: "Invalid token." });
    }
}