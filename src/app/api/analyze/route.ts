
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Initialize OpenAI client
// Initialize OpenAI client
// In a real scenario, API keys should be in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Using 2.5 Pro for higher quality/reasoning

// Define the schema for the menu structure
// This helps the LLM understand what JSON format we expect
const MenuSchema = z.object({
    dishes: z.array(
        z.object({
            originalName: z.string().describe("The name of the dish in the original language"),
            translatedName: z.string().describe("The Japanese translation of the dish name"),
            description: z.string().describe("A brief, appetizing description of the dish in Japanese"),
            price: z.string().optional().describe("Price if available"),
            searchQuery: z.string().describe("A keyword to search for the most appetising image of this dish (e.g., 'Spaghetti Carbonara professional food photography')"),
        })
    ),
    currency: z.string().optional(),
    language: z.string().describe("Detected language of the menu"),
});

export async function POST(req: Request) {
    console.log("Analyze API Request Received");
    try {
        const { image } = await req.json();

        if (!image) {
            return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
        }

        // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
        // Also remove any whitespace/newlines to ensure valid Base64
        const rawBase64 = image.split(",")[1] || image;
        const base64Data = rawBase64.replace(/\s/g, "");

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
                    mimeType: "image/jpeg", // Assuming JPEG for simplicity, can detect from header
                },
            },
        ]);

        const responseText = result.response.text();

        // Clean up markdown code blocks if Gemini adds them
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        const data = JSON.parse(cleanedText);

        return new Response(JSON.stringify(data));

    } catch (error) {
        // Detailed error logging
        console.error("Gemini API Error Detail:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return new Response(JSON.stringify({ error: "Failed to process menu. Please try again." }), { status: 500 });
    }
}
