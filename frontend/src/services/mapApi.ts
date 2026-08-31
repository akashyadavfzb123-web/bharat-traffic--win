import axios from 'axios';

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
  type: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const mapSearchService = {
  searchLocations: async (query: string, city: string = 'Bengaluru'): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 2) return [];

    try {
      // Append city name to restrict search results strictly to the target metro
      const searchQuery = query.toLowerCase().includes(city.toLowerCase())
        ? query
        : `${query}, ${city}, India`;

      const response = await axios.get<SearchResult[]>(`${NOMINATIM_BASE_URL}/search`, {
        params: {
          q: searchQuery,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'in',
        },
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      return response.data;
    } catch {
      return [];
    }
  },
};
