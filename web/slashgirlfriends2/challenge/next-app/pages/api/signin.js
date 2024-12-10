import jwt from "jsonwebtoken";
import { compare } from "bcryptjs";
import { setCookie } from "cookies-next";

import getClientPromise from "@/utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const client = await getClientPromise();
  const db = client.db();
  const collection = db.collection("users");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing field(s)" });
  }

  if (email.length > 64) {
    return res.status(400).json({ message: "Email is too long" });
  }

  if (
    !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      .test(email.toLowerCase())
  ) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const emailR = new RegExp(["^", email, "$"].join(""), "i");

  const user = await db
    .collection("users")
    .findOne({
      $or: [
        { email: emailR },
      ]
    });

  if (!user) {
    res.status(404).json({ error: "User does not exist" });
    return;
  }

  const valid = await compare(password, user.password);

  if (!valid) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  setCookie("auth", token, {
    req,
    res,
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production"
  });

  res.status(200).json({ message: "Successfully registered" });
}