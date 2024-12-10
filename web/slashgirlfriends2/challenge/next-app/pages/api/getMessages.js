import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";
import jwt from "jsonwebtoken";

import replyFunction from "@/assets/replies";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    if (!req.query) {
        return res.status(400).json({ message: "Bad request" });
    }

    const token = getCookie("auth", { req });

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: girlfriendId } = req.query;

    if (!girlfriendId) {
        return res.status(400).json({ message: "Bad request" });
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const client = await getClientPromise();
    const db = client.db();
    const users = db.collection("users");
    const girlfriends = db.collection("girlfriends");
    const messages = db.collection("messages");

    const user = await users.findOne({ id });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const girlfriend = await girlfriends.findOne({ id: girlfriendId });
    if (!girlfriend) {
        return res.status(404).json({ message: "Girlfriend not found" });
    }

    const userMessages = await messages.find({
        from: id,
        to: girlfriendId
    }).toArray();

    res.status(200).json({ messages: userMessages });
};