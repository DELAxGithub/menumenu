
"use client";

import { useState } from "react";

export default function TestToolPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setResult(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setImagePreview(base64String);

            try {
                const response = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64String }),
                });

                const data = await response.json();

                // Fetch images for dishes if analysis succeeded
                if (data.dishes) {
                    console.log("Starting image fetch for dishes...", data.dishes);
                    const dishesWithImages = await Promise.all(data.dishes.map(async (dish: any) => {
                        try {
                            const imgRes = await fetch("/api/search-image", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ query: dish.searchQuery }),
                            });
                            if (!imgRes.ok) throw new Error("API Returned Error");
                            const imgData = await imgRes.json();
                            console.log("Fetched image for", dish.translatedName, imgData.imageUrl);
                            return { ...dish, imageUrl: imgData.imageUrl, credit: imgData.credit };
                        } catch (e) {
                            console.error("Image fetch failed for", dish.translatedName, e);
                            return { ...dish, imageError: "Fetch failed" };
                        }
                    }));
                    setResult({ ...data, dishes: dishesWithImages });
                } else {
                    console.log("No dishes found to fetch images for.");
                    setResult(data);
                }
            } catch (error) {
                console.error("Test Error:", error);
                setResult({ error: "Failed to analyze" });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">🧪 Gemini 2.5 Pro Test Tool</h1>

            <div className="mb-8 border-2 border-dashed border-gray-400 p-8 rounded-lg text-center cursor-pointer">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
          "
                />
                <p className="mt-2 text-gray-500">Upload menu image here to test analysis logic</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="font-bold mb-2">Input Image</h2>
                    {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-full rounded border border-gray-200" />
                    )}
                </div>

                <div>
                    <h2 className="font-bold mb-2">Analysis Result (JSON)</h2>
                    {loading ? (
                        <div className="animate-pulse">Thinking... (This may take ~10s with 2.5 Pro)</div>
                    ) : result ? (
                        <div className="space-y-4">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto h-[300px] text-xs">
                                {JSON.stringify(result, null, 2)}
                            </pre>

                            <h3 className="font-bold text-lg mt-4">📸 Visualized Menu</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {result.dishes?.map((dish: any, i: number) => (
                                    <div key={i} className="border p-2 rounded">
                                        {dish.imageUrl ? (
                                            <img src={dish.imageUrl} className="w-full h-32 object-cover rounded mb-2" />
                                        ) : (
                                            <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <p className="font-bold text-xs">{dish.translatedName}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{dish.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">Waiting for input...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
