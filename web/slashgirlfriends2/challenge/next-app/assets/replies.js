const responses = {
    greetings: ["Hi!", "Hello!", "Hey there!", "Greetings!", "Yo!", "What's up?", "Howdy!", "Good to see you!"],
    farewells: ["Goodbye!", "See you later!", "Take care!", "Bye!", "Catch you later!", "Peace out!", "Adios!", "Ciao!"],
    haxxor: ["What are you doing??", "That's it, I'm not going on a second date with you!", "You're all the same...", "I LOVED YOU, AND YOU TREAT ME LIKE THIS??!?!?", "Stop trying to break me!", "I'm not a toy, you know."],
    thanks: ["You're welcome!", "No problem!", "Glad to help!", "Anytime!", "My pleasure!", "Don't mention it!"],
    test: ["Test deez nuts", "Testicles", "Testicular fortitude", "Testicular torsion", "System check: Everything's functional.", "Running diagnostics..."],
    love: ["Loading my love for you...", "fuck you (jk, love you)", "You're my favorite user!", "I love you more than bytes.", "You light up my servers.", "❤️"],
    hate: ["fuck you too", "hey that's not nice", "damn", "Why so mean?", "Ouch, that hurts.", "That's not what I expected from you."],
    default: ["I'm not sure what you mean.", "Can you clarify that?", "I don't understand.", "Let's try something else.", "Can we talk about something else?", "I'm just a simple AI girlfriend, you know."],
    jokes: ["Why don’t skeletons fight each other? They don’t have the guts.", "What do you call fake spaghetti? An impasta.", "How does a penguin build its house? Igloos it together.", "I told my computer I needed a break, and it gave me a KitKat."],
    compliments: ["You're amazing!", "You're so kind!", "You're the smartest person I know!", "You're a genius, no cap.", "You're a 10/10 in every way!"],
    apologies: ["I'm sorry!", "My bad!", "Please forgive me!", "I didn't mean to upset you.", "Let's make things better."],
    confusion: ["Huh?", "What do you mean?", "I'm lost.", "That doesn't make sense to me."],
    food: ["I love pizza too!", "Ice cream is my weakness.", "Tacos are the ultimate food!", "Food talk is making me hungry."],
    weather: ["It's sunny where I am... on the cloud!", "Rainy days are perfect for chatting with you.", "I hope you're staying warm!", "The weather doesn't matter when you're around!"]
};

const keywords = {
    greetings: ["hello", "hi", "hey", "greetings", "yo", "howdy", "sup", "what's up"],
    farewells: ["bye", "goodbye", "see you", "farewell", "later", "adios", "peace", "ciao"],
    test: ["test", "check", "diagnostics", "ping", "testing"],
    haxxor: ["p", "alert", "/", "\\\"", "script", "fetch", "hack", "exploit", "malware", "virus", "<", ">", "console"],
    love: ["love you", "luv u", "luv you", "love u", "adore you", "miss you", "thinking of you", "you're the best"],
    hate: ["hate you", "fuck you", "fuck u", "hate u", "dislike", "loathe", "can't stand you", "you're the worst"],
    thanks: ["thanks", "thank you", "thx", "cheers", "appreciate it", "grateful", "much obliged"],
    jokes: ["joke", "funny", "make me laugh", "tell me a joke"],
    compliments: ["you're amazing", "you're great", "you're awesome", "you're the best", "smart", "kind"],
    apologies: ["sorry", "my bad", "apologies", "forgive me", "i'm sorry"],
    confusion: ["what", "huh", "i don't understand", "confused", "explain"],
    food: ["pizza", "tacos", "ice cream", "sushi", "burger", "hungry", "food"],
    weather: ["weather", "rain", "sunny", "cloudy", "storm", "cold", "hot"]
};

function getRandomResponse(category) {
    const categoryResponses = responses[category];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}

module.exports = function reply(
    girlfriendId,
    message
) {
    const lowerCaseMessage = message.toLowerCase();

    let response;

    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            if (lowerCaseMessage.includes(word)) {
                response = getRandomResponse(category);
            }
        }
    }

    if (!response)
        response = getRandomResponse("default");

    return response;
};