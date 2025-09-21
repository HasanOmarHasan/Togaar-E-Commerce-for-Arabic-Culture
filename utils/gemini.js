/* eslint-disable import/no-extraneous-dependencies */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const asyncHandler = require("express-async-handler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 300,
    temperature: 0.7,
  },
});

const askGemini = asyncHandler(async (prompt) => {
  const stream = await model.generateContentStream(prompt);

  let fullText = "";
  // eslint-disable-next-line no-restricted-syntax, node/no-unsupported-features/es-syntax
  for await (const chunk of stream.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      fullText += chunkText;
    }
  }

  return fullText.trim();
});



module.exports = askGemini;
