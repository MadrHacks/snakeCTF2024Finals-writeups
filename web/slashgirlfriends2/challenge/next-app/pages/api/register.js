import jwt from "jsonwebtoken";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { setCookie } from "cookies-next";

import getClientPromise from "@/utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const client = await getClientPromise();
  const db = client.db();
  const collection = db.collection("users");

  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
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

  if (username.length > 512) {
    return res.status(400).json({ message: "Username is too long" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const emailR = new RegExp(["^", email, "$"].join(""), "i");

  const checkExisting = await db
    .collection("users")
    .findOne({
      $or: [
        { email: emailR },
      ]
    });

  if (checkExisting) {
    res.status(409).json({ error: "User already exists" });
    return;
  }

  const hashedPassword = await hash(password, 10);

  const user = {
    id: nanoid(),
    username,
    email,
    password: hashedPassword
  };

  await collection.insertOne(user);

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