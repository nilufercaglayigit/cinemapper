export const TMDB_API_KEY = process.env.TMDB_API_KEY!;

export const TMDB_GENRES = {
  "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35, 
  "Crime": 80, "Documentary": 99, "Drama": 18, "Family": 10751, 
  "Fantasy": 14, "History": 36, "Horror": 27, "Music": 10402, 
  "Mystery": 9648, "Romance": 10749, "Science Fiction": 878, 
  "TV Movie": 10770, "Thriller": 53, "War": 10752, "Western": 37
};

// --- Helper: Translate text keywords to TMDB Keyword IDs ---
export async function getTmdbKeywordIds(keywords: string[]): Promise<number[]> {
  const keywordIds: number[] = [];
  
  for (const keyword of keywords) {
    // 1. Start a timer specifically named after the keyword
    console.time(`Cache Test -> Fetching TMDB ID for "${keyword}"`); 
    
    const res = await fetch(
      `https://api.themoviedb.org/3/search/keyword?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}`,
      { cache: 'force-cache' }
    );
    const data = await res.json();
    
    // 2. Stop the timer and print the exact milliseconds it took
    console.timeEnd(`Cache Test -> Fetching TMDB ID for "${keyword}"`); 
    
    if (data.results && data.results.length > 0) {
      keywordIds.push(data.results[0].id);
    }
  }
  return keywordIds;
}

export async function fetchMovies(genreIds: number[], keywordIds: number[], minRating: string = "3.0", eraFilter: string = "all", languageFilter: string = "all") {
  const genreParam = genreIds.join(',');
  const keywordParam = keywordIds.join('|');
  
  // FIX: Lower the vote count threshold for international cinema!
  const minVotes = (languageFilter === "all" || languageFilter === "en") ? 100 : 10;
  
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreParam}&with_keywords=${keywordParam}&sort_by=popularity.desc&vote_count.gte=${minVotes}&vote_average.gte=${minRating}&language=en-US&page=1`;

  // Apply the era filter
  if (eraFilter === "modern") {
    url += "&primary_release_date.gte=2010-01-01";
  } else if (eraFilter === "nostalgia") {
    url += "&primary_release_date.gte=1990-01-01&primary_release_date.lte=2009-12-31";
  } else if (eraFilter === "classic") {
    url += "&primary_release_date.lte=1989-12-31";
  }

  // Apply the strict language filter
  if (languageFilter !== "all") {
    url += `&with_original_language=${languageFilter}`;
  }
  
  // QA DEBUG: This will print the exact URL in your VS Code terminal!
  console.log("FINAL TMDB URL:", url);
  
  const res = await fetch(url);
  const data = await res.json();
  
  const topMovies = (data.results || [])
    .filter((movie: any) => movie.poster_path !== null)
    .slice(0, 6);
    
  const enrichedMovies = await Promise.all(
    topMovies.map(async (movie: any) => {
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=keywords`
      );
      const details = await detailRes.json();
      
      const matchedTags = (details.keywords?.keywords || [])
        .filter((kw: any) => keywordIds.includes(kw.id))
        .map((kw: any) => kw.name);

      const movieGenres = (movie.genre_ids || [])
        .slice(0, 2)
        .map((id: number) => {
          return Object.keys(TMDB_GENRES).find(
            (key) => TMDB_GENRES[key as keyof typeof TMDB_GENRES] === id
          );
        })
        .filter(Boolean) as string[];

      return {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        imdb_id: details.imdb_id,
        rating: movie.vote_average,
        matched_tags: matchedTags.length > 0 
          ? [...matchedTags, ...movieGenres].slice(0, 3) 
          : movieGenres
      };
    })
  );
  
  return enrichedMovies;
}