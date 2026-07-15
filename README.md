# CineMapper: Semantic Cinematic Vibe Routing

CineMapper is a hybrid, full-stack Next.js application that bridges the gap between subjective human emotion and strict relational databases. It translates abstract concepts (like a mood, a meal, or a memory) into deterministic movie recommendations using Large Language Models (LLMs) and the TMDB API.

## Core Problem & Innovation
Traditional streaming search engines rely on literal keyword matching. Searching for "spicy ramen on a rainy day" yields zero relevant results. CineMapper solves this by using an LLM strictly as a semantic routing layer—extracting the psychological subtext of a prompt and mapping it to official cinematic tropes and genres, preventing AI hallucinations while retrieving highly accurate, high-quality data.

## Data Limitations & Known Issues: The TMDB Metadata Bias
While CineMapper successfully translates abstract human concepts into cinematic tropes, the quality of the final recommendation is strictly bottlenecked by the metadata available in the TMDB (The Movie Database) API. 

During development and testing of the `Language` filter, a significant data sparsity and Western-centric dataset bias was observed:

*   **Asymmetrical Tagging:** American and English-language films are heavily annotated by the community with deep, psychological keywords (e.g., "moral ambiguity", "isolation", "neo-noir"). International cinema often only contains basic genre tags.
*   **The Semantic Filter Trap:** Because CineMapper's AI routes prompts based on these highly specific psychological keywords, searching for a non-English film often yields 0 results. The database mathematically filters out international masterpieces simply because nobody has manually tagged them with the LLM's generated keywords.
*   **Rating & Vote Skews:** English-language films dominate the vote counts. To compensate, CineMapper dynamically lowers the required `vote_count` threshold for non-English queries to prevent aggressive filtering of culturally significant but globally under-voted films.

## System Architecture
The application utilizes a Serverless API architecture to securely isolate the AI and Database operations from the client.

1. **Client Layer (Next.js):** Captures user input and handles dynamic data hydration states.
2. **AI Semantic Layer (Google Gemini 3.5-Flash):** Constrained via strict JSON schema and low temperature (0.1) to translate vibes into deterministic TMDB keyword arrays.
3. **Database Routing (TMDB API):** Executes boolean filtering on AI-generated parameters, enforcing quality floors (vote count > 100, rating > 6.0).

## API Documentation

### `POST /api/recommend`
Translates a natural language prompt into an enriched array of movie data.

**Request Body:**
\`\`\`json
{
  "userInput": "eating a really spicy bowl of ramen on a dark, rainy day"
}
\`\`\`

**Successful Response (200 OK):**
\`\`\`json
{
  "explanation": "The contrast of external gloom with intense internal heat maps perfectly to atmospheric thrillers and emotional dramas.",
  "ai_keywords": ["melancholy", "isolation", "neo-noir", "atmospheric"],
  "movies": [
    {
      "id": 12345,
      "title": "Example Movie",
      "poster_path": "/example.jpg",
      "release_date": "2024-10-31",
      "imdb_id": "tt1234567",
      "matched_tags": ["melancholy", "Drama", "Thriller"]
    }
  ]
}
\`\`\`

## Ethical Considerations & Bias Mitigation
The system utilizes active prompt engineering to mitigate implicit bias. The AI is explicitly instructed via an "Abstraction Rule" to detach the user's input from its literal medium, ensuring it routes based on universal emotional resonance rather than stereotypical associations.

## Local Setup & Installation

1. Clone the repository and install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Create a `.env.local` file in the root directory and add your API keys:
   \`\`\`env
   GEMINI_API_KEY=your_google_gemini_key
   TMDB_API_KEY=your_tmdb_api_key
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.