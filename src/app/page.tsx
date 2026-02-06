"use client";

import { useState } from "react";

interface Dish {
  originalName: string;
  translatedName: string;
  description: string;
  price?: string;
  searchQuery: string;
}

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Dish[] | null>(null);
  const [dishImages, setDishImages] = useState<Record<number, string>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setResults(null);
    setDishImages({});

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });
        const data = await res.json();

        if (data.dishes) {
          setResults(data.dishes);
          // 🚀 Trigger Parallel Search immediately
          fetchImagesInParallel(data.dishes);
        }
      } catch (err) {
        console.error("Failed to analyze", err);
        alert("Failed to analyze image");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchImagesInParallel = async (dishes: Dish[]) => {
    // Fire off all requests at once
    dishes.forEach((dish, index) => {
      fetch("/api/search-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Use the optimized search query from Gemini
        body: JSON.stringify({ query: dish.searchQuery }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.imageUrl) {
            setDishImages(prev => ({ ...prev, [index]: data.imageUrl }));
          }
        })
        .catch(err => console.error("Image search failed for", dish.originalName, err));
    });
  };

  return (
    <main className="container" style={{ minHeight: "100vh", padding: "2rem 0" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "3rem", marginTop: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          <span className="gradient-text">menumenu</span>
        </h1>
        <p style={{ color: "var(--foreground-muted)", fontSize: "1rem" }}>
          Don't just read the menu. <span style={{ color: "var(--foreground)" }}>See the flavor.</span>
        </p>
      </div>

      {!results ? (
        // SCAN MODE
        <div className="animate-fade-in glass-panel" style={{ padding: "2rem", textAlign: "center" }}>

          <div style={{ marginBottom: "2rem" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2-2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <label htmlFor="menu-upload" className="btn-primary" style={{ display: "inline-block", width: "100%" }}>
            {analyzing ? "Analyzing..." : "Examine Menu"}
          </label>
          <input
            id="menu-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            disabled={analyzing}
          />

          <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#666" }}>
            Take a photo of a menu to instantly visualize it.
          </p>
        </div>
      ) : (
        // RESULTS MODE
        <div className="animate-fade-in">
          <button
            onClick={() => setResults(null)}
            style={{ background: "none", border: "none", color: "#666", marginBottom: "1rem", cursor: "pointer" }}
          >
            ← Scan another
          </button>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {results.map((dish, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "0", overflow: "hidden" }}>
                {/* Dynamic Image Area */}
                <div style={{
                  height: "250px",
                  background: "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {dishImages[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dishImages[idx]}
                      alt={dish.translatedName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", animation: "fadeIn 0.5s ease" }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                      <div className="loading-pulse" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", margin: "0 auto 10px" }}></div>
                      <span style={{ color: "#555", fontSize: "0.8rem" }}>Searching: {dish.searchQuery}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>{dish.translatedName}</h3>
                    {dish.price && <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{dish.price}</span>}
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--foreground-muted)", fontStyle: "italic", marginBottom: "0.8rem" }}>
                    {dish.originalName}
                  </p>
                  <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                    {dish.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
