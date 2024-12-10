import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";
import e from "express";
import jwt from "jsonwebtoken";
import { redirect } from "next/dist/server/api-utils";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { host } = req.body;

    if (!host) {
        return res.status(400).json({ message: "Host is required" });
    }

    const token = getCookie("auth", { req });

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
    
    const paymentIntent = jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
        price: "13,37",
        currency: "USD",
        redirect: `http://${host}/paid`,
    }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });

    return res.status(200).json({ paymentIntent });
};