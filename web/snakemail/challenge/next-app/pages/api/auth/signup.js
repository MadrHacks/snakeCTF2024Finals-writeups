import { setCookie } from "cookies-next";;
import { open, Database } from "sqlite";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

let db = null;

export default async function handler(req, res) {
    if (!db) {
        db = await open({
            filename: "/tmp/data.db",
            driver: sqlite3.Database,
        });
    }

    const { username, password, passwordConfirm } = req.body;

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        typeof passwordConfirm !== "string"
    ) {
        return res.status(400).json({ error: "Invalid input." });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ error: "Passwords do not match." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters long." });
    }

    if (username.length > 16) {
        return res.status(400).json({ error: "Username must be at most 16 characters long." });
    }

    if (password.length > 32) {
        return res.status(400).json({ error: "Password must be at most 32 characters long." });
    }

    const existingUser = await db.get("SELECT * FROM users WHERE username = ?", [username]);

    if (existingUser) {
        return res.status(400).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
    await db.run("INSERT INTO emails (sender, recipient, subject, body, date, readReceipt, snakeify, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
        "admin@mail.snakectf.org",
        username + "@mail.snakectf.org",
        "Welcome to SnakeMail",
        "Welcome to SnakeMail! Your account has been created.",
        new Date().toISOString(),
        false,
        false,
        JSON.stringify([])
    ])

    const token = jwt.sign({ id: result.lastID }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setCookie("token", token, {
        httpOnly: false,
        // secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        req, res
    });

    res.json({ success: true });
}