import { fetchFromTMDB } from '../services/tmdb.service.js';
import { ENV_VARS } from '../config/env.config.js';
import fs from 'fs';
import path from 'path';

/**
 * Fetches a (random) trending tv-show from The Movie Database (TMDB) and returns it.
 *
 * Resolves with a JSON response containing the (random) trending tv-show.
 * If an error occurs during the process, it sends a JSON response with a 500 status code and an error message.
 */
export const getTrendingTvShow = async (req, res) => {
  try {
    const data = await fetchFromTMDB('https://api.themoviedb.org/3/trending/tv/day?language=en-US');
    const randomTvShow = data.results[Math.floor(Math.random() * data.results?.length)];

    res.status(200).json({ success: true, content: randomTvShow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' + error.message });
  }
};

/**
 * Retrieves tv-show trailers from The Movie Database (TMDB) based on the provided tv-show ID.
 *
 * Returns a Promise that resolves with a JSON response containing the tv-show trailers.
 * if the tv-show with the given ID is not found, it sends a JSON response with a 404 status code.
 * If an error occurs during the process, it sends a JSON response with a 500 status code and an error message.
 */
export const getTvShowTrailers = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}/videos?&language=en-US`);

    // Dynamically load trailerMap.json if it exists
    const trailerMapPath = path.resolve('data', 'trailerMap.json');
    let trailerMap = {};
    if (fs.existsSync(trailerMapPath)) {
      trailerMap = JSON.parse(fs.readFileSync(trailerMapPath, 'utf-8'));
    }

    // Check if S3 MP4 exists for this TV show
    const s3Key = `trailers/${id}.mp4`;
    const s3Url = `${ENV_VARS.CLOUDFRONT_URL}/${s3Key}`;
    let s3Exists = false;
    for (const key in trailerMap) {
      if (key === `${id}.mp4` || trailerMap[key] === s3Key) {
        s3Exists = true;
        break;
      }
    }

    let trailers = data.results.map((trailer) => ({
      ...trailer,
      s3Url: null,
    }));

    if (s3Exists) {
      trailers = [
        {
          id: `s3-${id}`,
          key: id,
          name: 'Uploaded Trailer',
          site: 'S3',
          type: 'Trailer',
          s3Url,
        },
        ...trailers,
      ];
    }

    res.status(200).json({ success: true, content: trailers });
  } catch (error) {
    if (error.message.includes('404')) return res.status(404).json({ success: false, message: 'Not Found' });

    res.status(500).json({ success: false, message: 'Internal server error' + error.message });
  }
};

/**
 * Fetches tv-show details from The Movie Database (TMDB) API.
 *
 * Will throw an error if the tv-show with the given ID is not found (404 status code).
 * Will throw an error if there is an internal server error (500 status code).
 */
export const getTvShowDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}?language=en-US`);

    res.status(200).json({ success: true, content: data });
  } catch (error) {
    if (error.message.includes('404')) return res.status(404).json({ success: false, message: 'Not Found' });

    res.status(500).json({ success: false, message: 'Internal server error' + error.message });
  }
};

/**
 * Fetches a list of similar tv-shows for the provided tv-show ID from The Movie Database (TMDB).
 *
 * Returns a Promise that resolves with a JSON response containing a list of similar tv-shows.
 * If an error occurs during the process, it sends a JSON response with a 500 status code and an error message.
 */
export const getSimilarTvShows = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${id}/similar?language=en-US&page=1`);

    res.status(200).json({ success: true, content: data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' + error.message });
  }
};

/**
 * Fetches a list of popular, upcoming and top-rated tv-shows from The Movie Database (TMDB) for a given genre.
 * Returns a Promise that resolves with a JSON response containing a list of tv-shows by category.
 */
export const getTvShowByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = await fetchFromTMDB(`https://api.themoviedb.org/3/tv/${category}?language=en-US&page=1`);

    res.status(200).json({ success: true, content: data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' + error.message });
  }
};
