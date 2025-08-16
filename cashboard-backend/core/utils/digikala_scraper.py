# core/utils/digikala_scraper.py
import re
from django.utils import timezone
from digikala_api import product_detail

def fetch_product_info(product_url: str) -> dict:
    """
    Accepts a full Digikala product URL (or a URL-like string).
    Returns a dict with keys: title, price, image_url, updated_at
    On error returns: {"error": "message"}
    """
    if not product_url or not isinstance(product_url, str):
        return {"error": "Invalid product_url"}

    # try to extract a product id (last sequence of digits in the url)
    try:
        matches = re.findall(r'(\d+)', product_url)
        if not matches:
            return {"error": "Could not find product id in the URL"}

        product_id = matches[-1]

        # call digikala api
        product = product_detail(product_id)
        if not product:
            return {"error": "Product not found via digikala_api"}

        title = getattr(product, "persian_name", None) or getattr(product, "english_name", "") or ""
        price = getattr(product, "price", None)
        image_url = getattr(product, "image_url", None)

        return {
            "title": title,
            "price": price,
            "image_url": image_url,
            "updated_at": timezone.now()
        }
    except Exception as e:
        # keep error message simple for now; you can log the exception where appropriate
        return {"error": str(e)}
