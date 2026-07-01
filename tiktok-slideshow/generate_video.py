"""
TikTok Slideshow Generator — with real photos from Pexels/Unsplash
Downloads aesthetic study photos, overlays text, renders to video.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import subprocess
import os
import requests
import io

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTOS_DIR = os.path.join(OUTPUT_DIR, "photos")
SLIDES_DIR = os.path.join(OUTPUT_DIR, "slides")
VIDEO_PATH = os.path.join(OUTPUT_DIR, "slideshow.mp4")

WIDTH = 1080
HEIGHT = 1350
DURATION_PER_SLIDE = 4

# Each slide: text + a search-friendly query to find a matching photo
SLIDES = [
    {
        "text": "i failed every exam\nuntil i tried this\nat 2am",
        "query": "study desk night lamp",
        "darken": 0.45,
    },
    {
        "text": "your brain doesn't\nlearn by reading.\nit learns by failing.",
        "query": "highlighted notes book",
        "darken": 0.5,
    },
    {
        "text": "so i closed my notes\nand did this instead 👇",
        "query": "closed notebook minimal desk",
        "darken": 0.5,
    },
    {
        "text": "wrote everything\ni remember. no peeking.\neven the wrong stuff.",
        "query": "handwriting journal pen",
        "darken": 0.45,
    },
    {
        "text": "then checked what i missed.\nTHAT'S what i\nactually studied.",
        "query": "open textbook study",
        "darken": 0.5,
    },
    {
        "text": "3 days later\ni remembered 90%\nwithout re-reading once.",
        "query": "student confident morning coffee",
        "darken": 0.45,
    },
    {
        "text": "save this.\nyour future self\nwill thank you 📚",
        "query": "aesthetic study flatlay",
        "darken": 0.5,
    },
]


def download_photo(query, index):
    """Download a photo from Unsplash source (free, no API key needed)."""
    filepath = os.path.join(PHOTOS_DIR, f"photo_{index:02d}.jpg")

    if os.path.exists(filepath):
        print(f"  ✓ Photo {index} already exists, skipping download")
        return filepath

    # Use Unsplash source URL — redirects to a random matching photo
    # Format: vertical, high quality
    url = f"https://source.unsplash.com/1080x1350/?{query.replace(' ', ',')}"

    print(f"  ⬇ Downloading photo {index}: '{query}'...")
    try:
        resp = requests.get(url, timeout=15, allow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 10000:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            print(f"  ✓ Saved ({len(resp.content) // 1024}kb)")
            return filepath
    except Exception as e:
        print(f"  ⚠ Unsplash failed: {e}")

    # Fallback: try Pexels (no auth needed for small sizes via their CDN trick)
    # Use Lorem Picsum as reliable fallback
    url2 = f"https://picsum.photos/1080/1350?random={index}"
    try:
        resp = requests.get(url2, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            print(f"  ✓ Saved fallback ({len(resp.content) // 1024}kb)")
            return filepath
    except Exception as e:
        print(f"  ⚠ Fallback also failed: {e}")

    return None


def get_font(size):
    """Get a bold font."""
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except (OSError, IOError):
                continue
    return ImageFont.load_default()


def process_photo(filepath, darken=0.5):
    """Load, crop to 1080x1350, darken for text readability."""
    img = Image.open(filepath).convert("RGB")

    # Crop to target aspect ratio (center crop)
    target_ratio = WIDTH / HEIGHT
    img_ratio = img.width / img.height

    if img_ratio > target_ratio:
        # Too wide — crop sides
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        img = img.crop((left, 0, left + new_width, img.height))
    else:
        # Too tall — crop top/bottom
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        img = img.crop((0, top, img.width, top + new_height))

    # Resize to exact dimensions
    img = img.resize((WIDTH, HEIGHT), Image.LANCZOS)

    # Darken for text contrast
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(darken)

    # Slight blur for depth
    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))

    return img


def draw_text_with_outline(draw, position, text, font, fill=(255, 255, 255), outline_width=3):
    """Draw text with thick outline for readability on any background."""
    x, y = position
    # Black outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if abs(dx) + abs(dy) <= outline_width + 1:
                draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0))
    # White text
    draw.text(position, text, font=font, fill=fill)


def create_slide(slide_data, index, photo_path):
    """Create a slide with real photo background + text overlay."""
    # Load and process photo
    if photo_path and os.path.exists(photo_path):
        img = process_photo(photo_path, slide_data["darken"])
    else:
        # Solid dark fallback if no photo
        img = Image.new("RGB", (WIDTH, HEIGHT), (20, 20, 30))

    draw = ImageDraw.Draw(img)

    # Slide indicator dots
    dot_y = 70
    dot_spacing = 28
    total_dots = len(SLIDES)
    start_x = (WIDTH - (total_dots - 1) * dot_spacing) // 2
    for i in range(total_dots):
        dot_x = start_x + i * dot_spacing
        r = 6 if i == index else 4
        alpha = 255 if i == index else 100
        color = (255, 255, 255) if i == index else (180, 180, 180)
        draw.ellipse([dot_x - r, dot_y - r, dot_x + r, dot_y + r], fill=color)

    # Main text
    lines = slide_data["text"].split("\n")
    font_size = 76 if max(len(l) for l in lines) < 20 else 64
    font = get_font(font_size)

    line_spacing = font_size * 1.5
    total_text_height = len(lines) * line_spacing
    start_y = (HEIGHT - total_text_height) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (WIDTH - text_width) // 2
        y = start_y + i * line_spacing
        draw_text_with_outline(draw, (x, y), line, font)

    # Watermark
    small_font = get_font(26)
    wm_text = "@riskky.nguyen"
    wm_bbox = draw.textbbox((0, 0), wm_text, font=small_font)
    wm_x = (WIDTH - (wm_bbox[2] - wm_bbox[0])) // 2
    draw.text((wm_x, HEIGHT - 90), wm_text, font=small_font, fill=(255, 255, 255, 180))

    return img


def create_video(num_slides):
    """Render slides to MP4 with slide transitions."""
    transition_duration = 0.5
    inputs = []
    for i in range(num_slides):
        slide_path = os.path.join(SLIDES_DIR, f"slide_{i:02d}.png")
        inputs.extend(["-loop", "1", "-t", str(DURATION_PER_SLIDE), "-i", slide_path])

    # xfade filter chain
    filter_parts = []
    current_input = "[0:v]"
    for i in range(1, num_slides):
        next_input = f"[{i}:v]"
        offset = round(i * DURATION_PER_SLIDE - i * transition_duration, 2)
        output = "[outv]" if i == num_slides - 1 else f"[v{i}]"
        filter_parts.append(
            f"{current_input}{next_input}xfade=transition=slideleft:"
            f"duration={transition_duration}:offset={offset}{output}"
        )
        current_input = output if i < num_slides - 1 else None

    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "22",
        "-r", "30",
        VIDEO_PATH,
    ]

    print("\n🎬 Rendering video with transitions...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("  ⚠ xfade failed, using simple concat...")
        concat_path = os.path.join(OUTPUT_DIR, "concat.txt")
        with open(concat_path, "w") as f:
            for i in range(num_slides):
                f.write(f"file '{SLIDES_DIR}/slide_{i:02d}.png'\n")
                f.write(f"duration {DURATION_PER_SLIDE}\n")
            f.write(f"file '{SLIDES_DIR}/slide_{num_slides-1:02d}.png'\n")

        cmd2 = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", concat_path,
            "-vf", "fps=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "22",
            VIDEO_PATH,
        ]
        result = subprocess.run(cmd2, capture_output=True, text=True)
        os.remove(concat_path)
        if result.returncode != 0:
            print(f"  ❌ Error: {result.stderr[-200:]}")
            return False

    print(f"  ✓ Video saved: {VIDEO_PATH}")
    return True


def main():
    os.makedirs(PHOTOS_DIR, exist_ok=True)
    os.makedirs(SLIDES_DIR, exist_ok=True)

    print("🎨 TikTok Slideshow Generator")
    print(f"   Size: {WIDTH}x{HEIGHT} | Slides: {len(SLIDES)} | ~{len(SLIDES)*DURATION_PER_SLIDE}s\n")

    # Step 1: Download photos
    print("📷 Downloading photos...")
    photo_paths = []
    for i, slide in enumerate(SLIDES):
        path = download_photo(slide["query"], i)
        photo_paths.append(path)

    # Step 2: Create slides
    print("\n🖼 Creating slides...")
    for i, slide in enumerate(SLIDES):
        img = create_slide(slide, i, photo_paths[i])
        save_path = os.path.join(SLIDES_DIR, f"slide_{i:02d}.png")
        img.save(save_path, quality=95)
        print(f"  ✓ Slide {i+1}/{len(SLIDES)}")

    # Step 3: Render video
    success = create_video(len(SLIDES))

    if success:
        size_mb = os.path.getsize(VIDEO_PATH) / (1024 * 1024)
        print(f"\n✅ Done! {VIDEO_PATH} ({size_mb:.1f}MB)")
    else:
        print("\n❌ Failed to create video")


if __name__ == "__main__":
    main()
