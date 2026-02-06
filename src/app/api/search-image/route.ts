
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

        // Simplistic search: look for 1 best matching photo
        const result = await unsplash.search.getPhotos({
            query: query,
            page: 1,
            perPage: 1,
            orientation: 'landscape' // Fits our card layout better
        });

        if (result.type === 'error') {
            console.error("Unsplash Error:", result.errors);
            return new Response(JSON.stringify({ error: "Unsplash API error" }), { status: 500 });
        }

        const photo = result.response?.results[0];

        // Fallback if no photo found
        const imageUrl = photo ? photo.urls.regular : null;
        const credit = photo ? { name: photo.user.name, link: photo.user.links.html } : null;

        return new Response(JSON.stringify({ imageUrl, credit }));

    } catch (error) {
        console.error("Search API Error:", error);
        return new Response(JSON.stringify({ error: "Search failed" }), { status: 500 });
    }
}
