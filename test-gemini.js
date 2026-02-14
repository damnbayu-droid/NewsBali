
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const apiKey = process.env.AUDY_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log("Testing with API Key available:", !!apiKey);

    if (!apiKey) {
        console.error("No API KEY found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("Sending 'ping' to gemini-1.5-flash...");
        const result = await model.generateContent("ping");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testGemini();
