
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Simulate the API environment
const API_KEY = "AIzaSyCkPRiGt6YsQfpKDlNbhudwbB5boncHcS4"; // Hardcoded for this local test script only
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Confirming we are testing 2.5-pro

async function testAnalyzeLocal(imagePath) {
    console.log(`Analyzing image: ${imagePath}`);

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Data = imageBuffer.toString('base64');

        const prompt = `
    You are a "Visual Culinary Curator" and an expert Menu Translator.
    Analyze the provided menu image deeply. The menu may contain multiple sections (e.g., Tasting Menu, A La Carte).
    
    1. **Identify the Context**: Detect if this is a "Set Menu" (Degustación), "A La Carte", or specific section.
    2. **Extract & Translate**: Extract dish names and descriptions. Translate them into Appetizing Japanese.
       - If it's a course menu, keep the order.
       - If it's a list of ingredients (e.g. for a salad), describe what it is.
    3. **Visualize (Search Query Engineering)**: 
       - For each dish, generate a specific English search query for Google Images.
       - INJECT CONTEXT: "Spanish tapas style", "Fine dining plating", "Rustic presentation".
       - OPTIMIZE: "delicious", "professional photography", "4k".
    
    Output JSON format only (valid JSON, no markdown code blocks):
    {
      "restaurant_vibe": "Brief description (e.g., Traditional Spanish Taberna, Modern Fusion)",
      "dishes": [
        {
          "originalName": "String (The specific dish name)",
          "translatedName": "String (Japanese translation)",
          "description": "String (Japanese description of ingredients/style)",
          "price": "String (optional, e.g. '53.00€ per person' if it's a set)",
          "searchQuery": "String (Optimized English search query)"
        }
      ]
    }
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg", // Assuming JPEG for simplicity
                },
            },
        ]);

        const responseText = result.response.text();
        console.log("\n--- Raw Gemini Response ---");
        console.log(responseText);

        // Clean up markdown code blocks if Gemini adds them
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedText);

        console.log("\n--- Parsed JSON ---");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error analyzing image:", error);
    }
}

// Check for image argument
const imagePath = process.argv[2];
if (!imagePath) {
    console.log("Usage: node test-local.js <path-to-image.jpg>");
    console.log("Please provide a local path to the menu image you want to test.");
} else {
    testAnalyzeLocal(imagePath);
}
