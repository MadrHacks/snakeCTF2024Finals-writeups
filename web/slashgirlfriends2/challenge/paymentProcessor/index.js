require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const { PORT } = process.env;

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self';");
    res.setHeader("Server-Signature", jwt.sign({ "yes": "it's me" }, process.env.JWT_SECRET, { expiresIn: "1m" }));
    next();
});

app.get("/", (req, res) => {
    const { pi: paymentIntent } = req.query;

    if (!paymentIntent) {
        return res.render("landing");
    }

    try {
        var { id, username, email, price, currency } = jwt.verify(paymentIntent, process.env.JWT_SECRET);
    } catch (error) {
        return res.render("error", { error: "Invalid payment intent." });
    }

    res.render("payment", { id, username, email, price, currency, paymentIntent });
});

app.post("/pay", (req, res) => {
    const { paymentIntent, pan, cvv, exp, notes } = req.body;

    if (!paymentIntent || !pan || !cvv || !exp) {
        return res.render("error", { error: "Invalid payment information." });
    }

    try {
        var { id, username, email, price, currency, redirect } = jwt.verify(paymentIntent, process.env.JWT_SECRET);
    } catch (error) {
        return res.render("error", { error: "Invalid payment intent." });
    }

    if (!(pan.length == 16 || pan.length == 19) || cvv.length !== 3 || exp.length !== 5) {
        return res.render("error", { error: "Invalid payment information." });
    }

    if (pan !== "4598257662840913" || cvv !== "881" || exp !== "02/28") {
        return res.render("error", { error: "Credit card payment denied." });
    }

    return res.redirect(redirect + "?token=" + jwt.sign({ id, notes }, process.env.JWT_SECRET, { expiresIn: "5m" }));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});