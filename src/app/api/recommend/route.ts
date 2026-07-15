import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { TMDB_GENRES, getTmdbKeywordIds, fetchMovies } from "@/services/tmdb";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reasoning: {
      type: SchemaType.STRING,
      description: "A 1-sentence explanation of why this concept maps to these cinematic genres.",
    },
    tmdb_genre_ids: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.INTEGER },
      description: "An array of 1 to 3 integer IDs selected ONLY from the provided TMDB dictionary.",
    },
    search_keywords: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "3 to 5 recognizable cinematic tropes, narrative themes, or character dynamics (e.g., 'coming of age', 'love triangle', 'revenge', 'isolation'). MUST NOT contain literal references to the user's input medium (e.g., do not use words like 'music', 'album', 'food', or 'chef'). Do not use overly poetic or highly abstract phrases; strictly use common, mainstream movie database tags."
    }
  },
  required: ["reasoning", "tmdb_genre_ids", "search_keywords"],
};

export async function POST(req: Request) {
  try {
    // FIX: Extracting all 4 variables at once!
    const { userInput, minRating, eraFilter, languageFilter } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
      systemInstruction: `You are CineMapper, a strict semantic routing engine and expert cinematic translator. 
      Your objective is to analyze a user's non-cinematic concept (e.g., a mood, a meal, an album, a specific aesthetic) and map its psychological subtext strictly to official TMDB movie genres and cinematic tropes.
      
      ALLOWED TMDB GENRES: ${JSON.stringify(TMDB_GENRES)}
      
      CRITICAL ABSTRACTION RULES (NEGATIVE CONSTRAINTS):
      You must completely detach the user's input from its literal medium. You are mapping the *feeling*, not the *object*.
      - If the user inputs a type of food, it is a critical failure to use keywords like "chef", "cooking", "restaurant", or "food". Instead, extract the feeling (e.g., "comfort", "indulgence", "chaos").
      - If the user inputs music, do not use keywords like "music", "band", or "concert".
      - Never use poetic, highly abstract, or hyphenated hallucinated phrases. Strictly use common, mainstream movie database tags (e.g., "coming of age", "neo-noir", "betrayal", "isolation").

      EXAMPLES OF SUCCESSFUL ROUTING:
      Input: "eating a really spicy bowl of ramen on a dark, rainy day"
      Reasoning: "The contrast of external gloom with intense internal heat maps to atmospheric thrillers and emotional dramas."
      Genres: [18, 53] (Drama, Thriller)
      Keywords: ["melancholy", "isolation", "neo-noir", "atmospheric"]

      Input: "listening to upbeat 80s pop music while driving with the windows down"
      Reasoning: "The energetic, carefree nostalgia translates to vibrant, fast-paced adventures and lighthearted comedies."
      Genres: [12, 35] (Adventure, Comedy)
      Keywords: ["coming of age", "road trip", "nostalgia", "escapism"]
      
      Input: "a meticulously organized, sterile white office space"
      Reasoning: "The cold, calculated precision invokes themes of corporate dystopia, psychological tension, and sci-fi."
      Genres: [878, 9648] (Science Fiction, Mystery)
      Keywords: ["dystopia", "paranoia", "corporate", "mind-bending"]`,
    });

    const result = await model.generateContent(userInput);
    const aiData = JSON.parse(result.response.text());

    const validKeywordIds = await getTmdbKeywordIds(aiData.search_keywords);
    
    // FIX: Passing the languageFilter safely to the database
    const movies = await fetchMovies(aiData.tmdb_genre_ids, validKeywordIds, minRating, eraFilter, languageFilter);
    
    return NextResponse.json({
      explanation: aiData.reasoning,
      ai_keywords: aiData.search_keywords,
      movies: movies.slice(0, 6) 
    });

  } catch (error) {
    console.error("CineMapper API Error:", error);
    return NextResponse.json(
      { error: "Failed to translate concept to cinematic data." },
      { status: 500 }
    );
  }
}