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

    const { username, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({ error: "Invalid input." });
    }

    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(400).json({ error: "Incorrect password." });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setCookie("token", token, {
        httpOnly: false,
        // secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        req, res
    });

    res.json({ success: true });
}