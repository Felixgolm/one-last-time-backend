const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

router.get('/restaurants', async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    if (type === 'cities') {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
        params: {
          input: query,
          componentRestrictions: { country: 'es' },
          key: GOOGLE_API_KEY
        }
      });

      const results = response.data.predictions
        .slice(0, 10)
        .map(place => {
          const parts = place.description.split(', ');
          const city = parts[0];
          const province = parts[parts.length - 2] || '';
          return {
            name: city,
            fullName: place.description,
            placeId: place.place_id
          };
        });

      return res.status(200).json({
        success: true,
        data: results
      });
    } else if (type === 'restaurants') {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `restaurants in ${query} Spain`,
          key: GOOGLE_API_KEY
        }
      });

      const results = response.data.results
        .slice(0, 10)
        .map(place => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 'N/A',
          placeId: place.place_id,
          photoUrl: place.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` : null
        }));

      return res.status(200).json({
        success: true,
        data: results
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Error fetching data from Google Places API',
      details: error.message
    });
  }
});

module.exports = router;
