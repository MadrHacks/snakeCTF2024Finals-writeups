const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const fs = require("fs");

// Function to open the database and perform operations
async function run() {
    try {
        // Check if the database exists and if it does, delete it
        if (fs.existsSync("/tmp/data.db")) {
            fs.unlinkSync("/tmp/data.db");
            console.log("Deleted the existing database.");
        }

        // Open the database
        const db = await open({
            filename: "/tmp/data.db",
            driver: sqlite3.Database
        });
        console.log("Connected to the SQLite database.");

        // Create the users table if it doesn't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                password TEXT
            )
        `);
        console.log("Created users table.");

        // Delete all rows from the users table
        await db.run(`DELETE FROM users`);
        console.log("All rows deleted from users");

        // Insert values into the users table
        const users = [
            ["admin", "0"],
        ];

        // Insert each value into the table asynchronously
        for (const user of users) {
            const result = await db.run(`INSERT INTO users(username, password) VALUES(?, ?)`, user);
            console.log(`Rows inserted, ID ${result.lastID}`);
        }

        // Create the emails table if it doesn't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY,
                sender TEXT,
                recipient TEXT,
                subject TEXT,
                body TEXT,
                date TEXT,
                readReceipt BOOLEAN,
                snakeify BOOLEAN,
                attachments TEXT
            )
        `);
        console.log("Created emails table.");

        // Delete all rows from the emails table
        await db.run(`DELETE FROM emails`);
        console.log("All rows deleted from emails");

        // Insert values into the emails table
        const emails = [
            [
                "mycoolservice@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Welcome to MyCoolService!",
                "Thanks for subscribing to MyCoolService! Your subscription is now active.",
                "2024-11-11T14:32:21",
                false,
                false,
                "[]"
            ],
            [
                "streamitnow@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Subscription Renewal Reminder",
                "Your StreamItNow subscription will renew on 2024-11-20. No action is needed.",
                "2024-11-13T08:45:56",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "financeapp@mail.snakectf.org",
                "Payment Confirmation",
                "I see the payment of $12.99 has gone through. Thanks for your service.",
                "2024-11-14T19:22:11",
                false,
                false,
                "[]"
            ],
            [
                "foodiebox@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Your Order #2024 Confirmed!",
                "Thanks for ordering from FoodieBox! Delivery is scheduled for 2024-11-16.",
                "2024-11-14T12:30:45",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "booksnow@mail.snakectf.org",
                "Book Recommendations for November",
                "Can you recommend books in the sci-fi genre?",
                "2024-11-16T15:43:29",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "itservice@mail.snakectf.org",
                "Troubleshooting My Account",
                "I can't log in to my ITService account. Please assist.",
                "2024-11-17T21:12:05",
                false,
                false,
                "[]"
            ],
            [
                "offers@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Black Friday Deal: Up to 50% Off!",
                "Hurry! Our exclusive Black Friday deals are here for a limited time.",
                "2024-11-20T08:05:42",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "mystore@mail.snakectf.org",
                "Order Confirmation",
                "Can you confirm my recent order placed on 2024-11-19?",
                "2024-11-21T13:50:30",
                false,
                false,
                "[]"
            ],
            [
                "mygamesite@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Level Up Rewards!",
                "Congratulations! You've reached level 10 and unlocked new rewards.",
                "2024-11-22T20:15:11",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "flagteam@mail.snakectf.org",
                "Important Document Received",
                "I think this contains the information we need. Please double-check it.",
                "2024-11-24T10:00:47",
                false,
                false,
                "[]"
            ],
            [
                "flagteam@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Your Requested Document",
                `Here is the file: ${process.env.FLAG || "snakeCTF{f4ke_fl4g_f0r_t3st1ng}"}. Handle it with care.`,
                "2024-11-25T09:20:16",
                false,
                false,
                "[]"
            ],
            [
                "weeklydigest@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Your Weekly Digest",
                "Here's a summary of your week with WeeklyDigest.",
                "2024-11-25T18:47:38",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "streamitnow@mail.snakectf.org",
                "Cancel My Subscription",
                "I'm looking to cancel my subscription before renewal. How can I proceed?",
                "2024-11-26T14:11:09",
                false,
                false,
                "[]"
            ],
            [
                "promotions@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Cyber Monday Sale: Exclusive Deals",
                "Don't miss out on our biggest sale of the year!",
                "2024-11-27T09:35:51",
                false,
                false,
                "[]"
            ],
            [
                "myfitnessapp@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Workout Plan Updated",
                "Your weekly workout plan has been updated based on your preferences.",
                "2024-11-28T07:18:24",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "newsletter@mail.snakectf.org",
                "Subscription Cancelation",
                "Please confirm my newsletter cancelation request.",
                "2024-11-29T11:12:40",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "streamitnow@mail.snakectf.org",
                "Subscription Feedback",
                "Here’s why I canceled: lack of new content.",
                "2024-12-01T17:55:03",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "booksnow@mail.snakectf.org",
                "Book Order Follow-up",
                "I noticed my order hasn't arrived yet. Can you assist?",
                "2024-12-02T09:23:51",
                false,
                false,
                "[]"
            ],
            [
                "surveyteam@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "We Value Your Opinion",
                "Participate in our survey for a chance to win a gift card.",
                "2024-12-03T19:40:20",
                false,
                false,
                "[]"
            ],
            [
                "admin@mail.snakectf.org",
                "offers@mail.snakectf.org",
                "Unsubscribe Request",
                "I'm not interested in promotional emails anymore. Please remove me.",
                "2024-12-05T15:30:45",
                false,
                false,
                "[]"
            ],
            [
                "slashgirlfriends@mail.snakectf.org",
                "admin@mail.snakectf.org",
                "Thanks for signing up!",
                "Thanks for signing up for SlashGirlfriends! We hope you enjoy our service.",
                "2024-12-05T22:58:29",
                false,
                false,
                "[]"
            ],
        ];

        // Insert each value into the table asynchronously
        for (const email of emails) {
            const result = await db.run(`INSERT INTO emails(sender, recipient, subject, body, date, readReceipt, snakeify, attachments) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, email);
            console.log(`Rows inserted, ID ${result.lastID}`);
        }

        // Create the attachments table if it doesn't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY,
                sender TEXT,
                filename TEXT,
                mime TEXT,
                readableType TEXT
            )
        `);

        // Delete all rows from the attachments table
        await db.run(`DELETE FROM attachments`);
        console.log("All rows deleted from attachments");

        // Insert values into the attachments table
        const attachments = [
            [
                "admin@mail.snakectf.org",
                "snake.png",
                "image/png",
                "Image"
            ],
        ];

        // Insert each value into the table asynchronously
        for (const attachment of attachments) {
            const result = await db.run(`INSERT INTO attachments(sender, filename, mime, readableType) VALUES(?, ?, ?, ?)`, attachment);
            console.log(`Rows inserted, ID ${result.lastID}`);
        }

        // Close the database connection
        await db.close();
        console.log("Closed the database connection.");
    } catch (err) {
        console.error(err.message);
    }
}

run();
