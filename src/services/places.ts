import { GOOGLE_PLACES_API_KEY } from '@/config';

export type GoogleCitySuggestion = { placeId: string; name: string; stateName: string; label: string };

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
    };
  }[];
};

/** Indian city suggestions from Google Places; same request the website makes when a city is not saved yet. */
export async function searchGoogleCities(query: string): Promise<GoogleCitySuggestion[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
    },
    body: JSON.stringify({
      input: query,
      includedPrimaryTypes: ['(cities)'],
      includedRegionCodes: ['in'],
      languageCode: 'en',
      regionCode: 'in',
    }),
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as AutocompleteResponse;
  return (payload.suggestions ?? [])
    .map((item) => {
      const prediction = item.placePrediction ?? {};
      const name = prediction.structuredFormat?.mainText?.text ?? '';
      const stateName = prediction.structuredFormat?.secondaryText?.text?.split(',')[0]?.trim() || 'India';
      return { placeId: prediction.placeId ?? '', name, stateName, label: [name, stateName].filter(Boolean).join(', ') };
    })
    .filter((item) => Boolean(item.placeId && item.name));
}
