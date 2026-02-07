
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Initialize OpenAI client
// Initialize OpenAI client
// In a real scenario, API keys should be in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use the latest available Flash model (2.0)

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
    You are a "Visual Culinary Curator". 
    Analyze the provided menu image deeply.
    
    1. **Identify the Vibe**: First, intuit the restaurant's type (e.g., Authentic Italian Trattoria, Modern Fusion, Street Food, High-end French).
    2. **Extract & Translate**: Extract dish names and descriptions. Translate them into Appetizing Japanese.
    3. **Visualize (Search Query Engineering)**: This is the most crucial part.
       For each dish, generate a specific English search query for Google Images.
       
       **Rules for Search Query:**
       - INJECT CONTEXT: Do not just output the dish name. Add the cuisine style or visual cues.
       - OPTIMIZE FOR APPEARANCE: key words like "delicious", "restaurant plated", "professional photography", "close up".
       - AVOID GENERIC: If the dish is "Steak", but the menu is Japanese, query for "Wagyu Steak Teppanyaki style plated".
    
    Output JSON format only:
    {
      "restaurant_vibe": "Brief description of the restaurant style inferred",
      "dishes": [
        {
          "originalName": "String",
          "translatedName": "String (Japanese)",
          "description": "String (Japanese, make it sound tasty)",
          "price": "String (optional)",
          "searchQuery": "String (The highly optimized English search query)"
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
