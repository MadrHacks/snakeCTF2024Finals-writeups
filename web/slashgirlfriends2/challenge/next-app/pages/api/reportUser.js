import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const token = getCookie("auth", { req });

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ message: "Missing field(s)" });
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const client = await getClientPromise();
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ id });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const tokenBot = jwt.sign({
        itsa: "me"
    }, process.env.JWT_SECRET);

    const resp = await fetch(process.env.REPORT_BOT_BASEURL + "/admin/visit", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "token": tokenBot,
            "uid": uid,
        })
    });

    if (resp.status === 200) {
        res.status(200).json({ message: "Reported to admin" });
    } else {
        const respData = await resp.text();
        res.status(400).json({ message: "Couldn't report to admin", respData });
    }
};