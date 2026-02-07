
import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';

const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
    fetch: nodeFetch as any,
});

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return new Response(JSON.stringify({ error: "No query provided" }), { status: 400 });
        }

        // 1. Google Custom Search (Priority)
        const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        const googleCx = process.env.GOOGLE_CSE_ID;

        if (googleKey && googleCx) {
            // console.log(`Searching Google for: ${query}`);
            const googleUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&searchType=image&num=1&safe=active`;

            try {
                const googleRes = await fetch(googleUrl);

                if (!googleRes.ok) {
                    const errText = await googleRes.text();
                    console.error("Google Search API Error:", googleRes.status, errText);
                    // Fall through to Unsplash
                } else {
                    const googleData = await googleRes.json();
                    if (googleData.items && googleData.items.length > 0) {
                        const item = googleData.items[0];
                        return new Response(JSON.stringify({
                            imageUrl: item.link,
                            credit: { name: "Google", link: item.contextLink || item.link }
                        }));
                    }
                }
            } catch (gErr) {
                console.error("Google Fetch Error:", gErr);
                // Fall through to Unsplash
            }
        }

        // 2. Unsplash (Fallback)
        // console.log(`Falling back to Unsplash for: ${query}`);
        try {
            const result = await unsplash.search.getPhotos({
                query: query,
                page: 1,
                perPage: 1,
                orientation: 'landscape'
            });

            if (result.type === 'error') {
                console.error("Unsplash Error:", result.errors);
                return new Response(JSON.stringify({ error: "Unsplash API error" }), { status: 500 });
            }

            const photo = result.response?.results[0];
            const imageUrl = photo ? photo.urls.regular : null;
            const credit = photo ? { name: photo.user.name, link: photo.user.links.html } : null;

            return new Response(JSON.stringify({ imageUrl, credit }));
        } catch (uErr) {
            console.error("Unsplash Fetch Error:", uErr);
            return new Response(JSON.stringify({ error: "Unsplash client error" }), { status: 500 });
        }

    } catch (error) {
        console.error("Search API Error:", error);
        return new Response(JSON.stringify({ error: "Search failed" }), { status: 500 });
    }
}
