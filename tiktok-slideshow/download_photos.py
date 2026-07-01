"""Download study-themed photos from Pexels (free API)."""
import requests
import os

PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)

# Pexels free API key (demo/public tier)
PEXELS_API_KEY = "563492ad6f917000010000014b1b9a2c6d5b4ae0b0dbfed0a2cf02fe"

QUERIES = [
    "study desk night lamp cozy",
    "highlighted notes textbook",
    "closed notebook minimal",
    "handwriting journal",
    "open textbook studying",
    "student coffee morning",
    "study flatlay aesthetic",
]

headers = {"Authorization": PEXELS_API_KEY}

for i, query in enumerate(QUERIES):
    filepath = os.path.join(PHOTOS_DIR, f"photo_{i:02d}.jpg")
    print(f"[{i+1}/{len(QUERIES)}] Searching: '{query}'")
    
    try:
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            headers=headers,
            params={"query": query, "per_page": 1, "orientation": "portrait"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("photos"):
                photo_url = data["photos"][0]["src"]["large2x"]
                img_resp = requests.get(photo_url, timeout=15)
                if img_resp.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(img_resp.content)
                    print(f"  ✓ Saved ({len(img_resp.content)//1024}kb)")
                    continue
        print(f"  ⚠ Pexels returned {resp.status_code}")
    except Exception as e:
        print(f"  ⚠ Error: {e}")
    
    # If Pexels fails, note it
    print(f"  ❌ Could not download photo {i}")

print("\nDone!")
