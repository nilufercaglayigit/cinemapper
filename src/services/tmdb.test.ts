import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTmdbKeywordIds, fetchMovies } from './tmdb';

// Intercept and mock the global fetch API
global.fetch = vi.fn();

describe('TMDB Data Science & Routing Service', () => {
  // Clear mock history before every single test to ensure test isolation
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getTmdbKeywordIds Boundary Testing', () => {
    it('should extract the correct integer ID when TMDB returns a valid match', async () => {
      // Mock the TMDB search/keyword endpoint response
      (fetch as any).mockResolvedValueOnce({
        json: async () => ({
          results: [{ id: 456, name: 'isolation' }]
        })
      });

      const ids = await getTmdbKeywordIds(['isolation']);
      
      expect(ids).toEqual([456]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should gracefully handle empty arrays when a generated keyword has zero TMDB matches', async () => {
      // Mock TMDB returning no results for an overly poetic/hallucinated tag
      (fetch as any).mockResolvedValueOnce({
        json: async () => ({ results: [] }) 
      });

      const ids = await getTmdbKeywordIds(['super-abstract-hallucination']);
      
      expect(ids).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchMovies Data Hydration Pipeline', () => {
    it('should correctly merge concurrent movie endpoints into the required frontend schema', async () => {
      // 1. Mock the initial /discover/movie database fetch
      (fetch as any).mockResolvedValueOnce({
        json: async () => ({
          results: [
            { 
              id: 101, 
              title: 'Mocked Masterpiece', 
              poster_path: '/mock.jpg', 
              release_date: '2026-07-13', 
              genre_ids: [18, 53] // Drama, Thriller
            }
          ]
        })
      });

      // 2. Mock the concurrent /movie/{id} hydration fetch
      (fetch as any).mockResolvedValueOnce({
        json: async () => ({
          imdb_id: 'tt9999999',
          keywords: { 
            keywords: [{ id: 456, name: 'isolation' }] 
          }
        })
      });

      // Execute the function with our mocked inputs
      const enrichedMovies = await fetchMovies([18, 53], [456]);

      // Assertions against the returned data structure
      expect(enrichedMovies.length).toBe(1);
      expect(enrichedMovies[0].title).toBe('Mocked Masterpiece');
      expect(enrichedMovies[0].imdb_id).toBe('tt9999999'); // Verifies hydration worked
      
      // Verifies cross-referencing and mapping worked
      expect(enrichedMovies[0].matched_tags).toContain('isolation');
      expect(enrichedMovies[0].matched_tags).toContain('Drama');
    });
  });
});