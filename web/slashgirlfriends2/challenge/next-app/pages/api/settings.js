import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";
import jwt from "jsonwebtoken";

import replyFunction from "@/assets/replies";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const token = getCookie("auth", { req });

    const {
        username,
        bio,
        about
    } = req.body;

    if (!username) {    
        return res.status(400).json({ message: "Username is required" });
    }

    if (username.length > 512) {
        return res.status(400).json({ message: "Username is too long" });
    }

    if (bio && bio.length > 128) {
        return res.status(400).json({ message: "Bio is too long" });
    }

    if (about && about.length > 1024) {
        return res.status(400).json({ message: "About is too long" });
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const client = await getClientPromise();
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ id });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    await users.updateOne({ id }, {
        $set: {
            username,
            bio,
            about
        }
    });

    res.status(200).json({ success: true });
};