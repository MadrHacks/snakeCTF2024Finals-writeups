const { MongoClient } = require("mongodb");

const girlfriendsData = require("./assets/girlfriends.json");
const usersData = require("./assets/users.json");

(async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    const girlfriends = db.collection("girlfriends");
    const users = db.collection("users");

    await girlfriends.deleteMany({});
    await users.deleteMany({});

    await girlfriends.insertMany(girlfriendsData);
    await users.insertMany(usersData);

    await client.close();

    return;
})();