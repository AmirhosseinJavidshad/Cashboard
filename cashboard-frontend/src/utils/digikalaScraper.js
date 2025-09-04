// src/utils/digikalaScraper.js
import axios from 'axios';

/**
 * Fetch product info from Digikala URL
 * @param {string} productUrl - full Digikala product URL
 * @returns {Promise<{title: string, price: number, image_url: string, updated_at: string} | {error: string}>}
 */
export async function fetchProductInfo(productUrl) {
  if (!productUrl || typeof productUrl !== 'string') {
    return { error: 'Invalid URL' };
  }

  try {
    // Extract the last numeric sequence as productId
    const matches = productUrl.match(/(\d+)/g);
    if (!matches) return { error: 'Could not extract product ID from URL' };

    const productId = matches[matches.length - 1];

    // API call with browser-like headers
    const response = await axios.get(`https://api.digikala.com/v1/product/${productId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        'Referer': 'https://www.digikala.com/',
      },
      timeout: 5000,
    });

    const product = response.data?.data?.product;

    if (!product) return { error: 'Product not found' };

    const title = product?.title || product?.persian_name || '';
    const price = product?.price?.selling_price || 0;
    const image_url = product?.media?.images?.[0]?.url || '';

    return {
      title,
      price,
      image_url,
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Digikala fetch error:', err.response?.status, err.message);
    return { error: 'Failed to fetch product info' };
  }
}
