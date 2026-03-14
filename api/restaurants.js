import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    if (type === 'restaurants') {
      // Buscar restaurantes en una ciudad
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `restaurants in ${query} Spain`,
            key: GOOGLE_API_KEY,
            type: 'restaurant'
          }
        }
      );

      const results = response.data.results
        .slice(0, 10)
        .map(place => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 'N/A',
          placeId: place.place_id,
          photoUrl: place.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : null
        }));

      return res.status(200).json({ success: true, data: results });
    }

    res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error fetching data from Google Places', details: error.message });
  }
}
