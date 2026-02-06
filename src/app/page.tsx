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
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setResults(null);
    setDishImages({});
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!res.ok) throw new Error("Analysis failed");

        const data = await res.json();

        if (data.dishes) {
          setResults(data.dishes);
          fetchImagesInParallel(data.dishes);
        } else {
          throw new Error("No dishes found");
        }
      } catch (err) {
        console.error("Failed to analyze", err);
        setError("Could not analyze the menu. Please try again with a clearer photo.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchImagesInParallel = async (dishes: Dish[]) => {
    dishes.forEach((dish, index) => {
      fetch("/api/search-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      {error && (
        <div className="error-message animate-fade-in">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {!results ? (
        // SCAN MODE
        <div className="animate-fade-in glass-panel" style={{ padding: "3rem 2rem", textAlign: "center", transition: "all 0.3s ease" }}>

          <div style={{ marginBottom: "2rem", position: "relative", display: "inline-block" }}>
            {/* Camera Pulse Effect */}
            <div style={{
              position: "absolute",
              inset: "-15px",
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              opacity: analyzing ? 0.5 : 0,
              transform: analyzing ? "scale(1.1)" : "scale(1)",
              transition: "all 0.5s ease",
              animation: analyzing ? "pulse 1.5s infinite" : "none"
            }}></div>

            <div style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              border: "1px solid var(--secondary)",
              opacity: analyzing ? 0.8 : 0,
              animation: analyzing ? "spin 3s linear infinite" : "none"
            }}></div>

            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={analyzing ? "var(--primary)" : "#555"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2-2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <label
            htmlFor="menu-upload"
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              opacity: analyzing ? 0.8 : 1,
              pointerEvents: analyzing ? "none" : "auto",
              gap: "10px"
            }}
          >
            {analyzing ? (
              <>
                <div className="loading-spinner"></div>
                Analyzing Menu...
              </>
            ) : "Examine Menu"}
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
            {analyzing ? "Identifying dishes & translating..." : "Take a photo of a menu to instantly visualize it."}
          </p>
        </div>
      ) : (
        // RESULTS MODE
        <div className="animate-fade-in">
          <button
            onClick={() => setResults(null)}
            style={{ background: "none", border: "none", color: "var(--foreground-muted)", marginBottom: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Scan another
          </button>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {results.map((dish, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: "0", overflow: "hidden", animation: `fadeIn 0.5s ease forwards ${idx * 0.1}s`, opacity: 0 }}>
                {/* Dynamic Image Area */}
                <div style={{
                  height: "250px",
                  background: "#121212",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {dishImages[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                      <img
                        src={dishImages[idx]}
                        alt={dish.translatedName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", animation: "fadeIn 0.5s ease" }}
                      />
                      {/* Gradient overlay for text readability if needed, or subtle vignette */}
                      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.5)" }}></div>
                    </div>
                  ) : (
                    <div className="skeleton" style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}></div>
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
                  <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#ddd" }}>
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
