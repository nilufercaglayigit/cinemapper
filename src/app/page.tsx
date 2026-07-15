"use client";

import { useState, useEffect } from "react";

// 1. Type Safety for our API response
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  imdb_id: string; // Added
  matched_tags: string[]; // Added
}

interface ApiResponse {
  explanation: string;
  ai_keywords: string[];
  movies: Movie[];
}

const LOADING_STEPS = [
  "Translating aesthetic...",
  "Analyzing psychological subtext...",
  "Mapping to deterministic TMDB genres...",
  "Fetching cinematic equivalents..."
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [minRating, setMinRating] = useState("3.0");
  const [era, setEra] = useState("all");
  const [language, setLanguage] = useState("all");

  // Cycle through the loading text to show off the architecture
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setData(null);
    setLoadingStep(0);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: prompt, minRating: minRating, eraFilter: era, languageFilter: language }),
      });

      if (!res.ok) throw new Error("Failed to map your vibe. Please try again.");

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-neutral-800">
      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">

        {/* Header Section */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white">
            CineMapper
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 font-light tracking-wide">
            What movie do you feel like eating?
          </p>
        </div>

        {/* The Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a feeling, an album, a meal, or a vibe..."
              disabled={loading}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-6 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Map It
            </button>
          </div>
        </form>

        {/* Filter Bar directly under your search bar form */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">

          {/* Rating Filter */}
          <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2">
            <label htmlFor="rating-filter" className="text-sm text-neutral-400 font-medium">Rating:</label>
            <select
              id="rating-filter"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
        <option value="3.0">Guilty Pleasures & Up (3.0+)</option>
        <option value="5.0">Decent / Watchable (5.0+)</option>
        <option value="7.0">Great / Highly Rated (7.0+)</option>
        <option value="8.0">Masterpiece (8.0+)</option>
            </select>
          </div>

          {/* Era Filter */}
          <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2">
            <label htmlFor="era-filter" className="text-sm text-neutral-400 font-medium">Era:</label>
            <select
              id="era-filter"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="all">Any Time</option>
              <option value="modern">Modern (2010+)</option>
              <option value="nostalgia">Nostalgic (1990 - 2009)</option>
              <option value="classic">Classic (Pre-1990)</option>
            </select>
          </div>
          {/* Language Filter */}
          <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2">
            <label htmlFor="language-filter" className="text-sm text-neutral-400 font-medium">Language:</label>
            <select
              id="language-filter"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
<option value="all">Global (Any)</option>
      <option disabled>──────────</option>
      <option value="ar">Arabic</option>
      <option value="zh">Chinese</option>
      <option value="da">Danish</option>
      <option value="nl">Dutch</option>
      <option value="en">English</option>
      <option value="fr">French</option>
      <option value="de">German</option>
      <option value="hi">Hindi</option>
      <option value="id">Indonesian</option>
      <option value="it">Italian</option>
      <option value="ja">Japanese</option>
      <option value="ko">Korean</option>
      <option value="fa">Persian</option>
      <option value="pl">Polish</option>
      <option value="pt">Portuguese</option>
      <option value="ru">Russian</option>
      <option value="es">Spanish</option>
      <option value="sv">Swedish</option>
      <option value="ta">Tamil</option>
      <option value="th">Thai</option>
      <option value="tr">Turkish</option>
            </select>
          </div>

        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
            <p className="text-neutral-400 animate-pulse text-sm font-mono">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400 bg-red-950/30 py-4 rounded-xl border border-red-900/50">
            {error}
          </div>
        )}

        {/* Results Section */}
        {data && !loading && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* AI Explanation & Keywords */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 md:p-10 backdrop-blur-sm">
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-4 font-semibold">
                The Translation
              </h2>
              <p className="text-xl md:text-2xl font-light leading-relaxed mb-8">
                "{data.explanation}"
              </p>

              <div className="flex flex-wrap gap-2">
                {data.ai_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-neutral-800 text-neutral-300 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Movie Grid */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-6 font-semibold pl-2">
                Cinematic Equivalents
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {data.movies.map((movie) => (
                  <a
                    key={movie.id}
                    href={movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : `https://www.themoviedb.org/movie/${movie.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 group-hover:border-neutral-500 group-hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-neutral-600 text-sm">
                          No Poster
                        </div>
                      )}
                    </div>

                    <div className="px-1 space-y-1.5">
                      <div>
                        <h3 className="font-semibold text-lg truncate group-hover:text-neutral-300 transition-colors" title={movie.title}>
                          {movie.title}
                        </h3>
                        <p className="text-neutral-500 text-sm">
                          {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
                        </p>
                      </div>

                      {/* The Matched Tags UI */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {movie.matched_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] uppercase tracking-wider font-medium bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}