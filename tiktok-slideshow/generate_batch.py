"""
TikTok Slideshow Batch Generator — 3 videos
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import subprocess
import os
import requests

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTOS_DIR = os.path.join(OUTPUT_DIR, "photos")

WIDTH = 1080
HEIGHT = 1350
DURATION_PER_SLIDE = 4

# ============ 3 VIDEOS ============

VIDEOS = [
    {
        "name": "video_01_2am_trick",
        "slides": [
            {"text": "i failed every exam\nuntil i tried this\nat 2am", "darken": 0.4},
            {"text": "your brain doesn't\nlearn by reading.\nit learns by failing.", "darken": 0.45},
            {"text": "so i closed my notes\nand did this instead 👇", "darken": 0.45},
            {"text": "wrote everything\ni remember. no peeking.\neven the wrong stuff.", "darken": 0.4},
            {"text": "then checked\nwhat i missed.\nTHAT'S what i\nactually studied.", "darken": 0.45},
            {"text": "3 days later\ni remembered 90%\nwithout re-reading once.", "darken": 0.4},
            {"text": "i built an app that\nquizzes you from\nyour own notes.\nlink in bio 👆", "darken": 0.45},
        ],
        "caption": "the trick no one teaches you in school. i made an app that does this automatically — scan your notes → instant quiz. link in bio 🧠",
        "hashtags": "#studytok #studytips #examseason #activerecall #studyhacks #athora",
    },
    {
        "name": "video_02_pomodoro_lie",
        "slides": [
            {"text": "the pomodoro technique\nis a lie.\nhere's what actually works.", "darken": 0.4},
            {"text": "25 minutes isn't\nmagic. your brain\nneeds MORE time\nto get deep.", "darken": 0.45},
            {"text": "try 50 min work\n10 min break.\nlet your brain\nactually sink in.", "darken": 0.45},
            {"text": "but here's\nthe real secret 👇", "darken": 0.4},
            {"text": "during the break:\nno phone. no scrolling.\njust walk or stare\nat nothing.", "darken": 0.45},
            {"text": "your brain processes\nINFO during rest.\ndon't interrupt it.", "darken": 0.4},
            {"text": "or just scan your notes\n→ instant flashcards.\nno typing needed.\nlink in bio 👆", "darken": 0.45},
        ],
        "caption": "pomodoro is overrated. and when you DO study — scan your notes into flashcards in 2 seconds. app in bio 🍅❌",
        "hashtags": "#studytok #pomodoro #studytips #deepwork #focustips #athora",
    },
    {
        "name": "video_03_top_student",
        "slides": [
            {"text": "the top student\nin my class\nnever takes notes\nin lectures.", "darken": 0.4},
            {"text": "i thought she was\njust naturally smart.\nthen she showed me\nher method.", "darken": 0.45},
            {"text": "she LISTENS first.\nno writing.\njust pure focus\nfor 50 minutes.", "darken": 0.45},
            {"text": "then immediately after:\nshe writes ONE page\nfrom memory.", "darken": 0.4},
            {"text": "just the big ideas.\nno details.\nno copying slides.", "darken": 0.45},
            {"text": "she said:\n\"if i can't remember it\n5 min later,\nit wasn't important.\"", "darken": 0.4},
            {"text": "she'd love this app —\nscan notes,\nget quizzes in seconds.\nlink in bio 👆", "darken": 0.45},
        ],
        "caption": "she broke my entire study system in 2 minutes 😭 i made an app that turns your notes into quizzes + flashcards automatically. link in bio 📚",
        "hashtags": "#studytok #studymotivation #examtips #notetaking #gpa #athora",
    },
]

# Unsplash photos — curated per video theme
PHOTO_SETS = [
    [  # Video 1: 2am study trick
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1080&h=1350&fit=crop",
    ],
    [  # Video 2: Pomodoro lie
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1513128034602-7814ccaddd4e?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1473492201326-7c01dd2e596b?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1080&h=1350&fit=crop",
    ],
    [  # Video 3: Top student
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1080&h=1350&fit=crop",
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&h=1350&fit=crop",
    ],
]


def download_photo(url, filepath):
    if os.path.exists(filepath):
        return filepath
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code == 200 and len(resp.content) > 5000:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            return filepath
    except Exception:
        pass
    return None


def get_font(size):
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except (OSError, IOError):
                continue
    return ImageFont.load_default()


def process_photo(filepath, darken=0.5):
    img = Image.open(filepath).convert("RGB")
    target_ratio = WIDTH / HEIGHT
    img_ratio = img.width / img.height

    if img_ratio > target_ratio:
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        img = img.crop((left, 0, left + new_width, img.height))
    else:
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        img = img.crop((0, top, img.width, top + new_height))

    img = img.resize((WIDTH, HEIGHT), Image.LANCZOS)
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(darken)
    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    return img


def draw_text_with_outline(draw, position, text, font, fill=(255, 255, 255), outline_width=3):
    x, y = position
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if abs(dx) + abs(dy) <= outline_width + 1:
                draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0))
    draw.text(position, text, font=font, fill=fill)


def create_slide(slide_data, index, total_slides, photo_path):
    if photo_path and os.path.exists(photo_path):
        img = process_photo(photo_path, slide_data["darken"])
    else:
        img = Image.new("RGB", (WIDTH, HEIGHT), (20, 20, 30))

    draw = ImageDraw.Draw(img)

    # Dots
    dot_y = 70
    dot_spacing = 28
    start_x = (WIDTH - (total_slides - 1) * dot_spacing) // 2
    for i in range(total_slides):
        dot_x = start_x + i * dot_spacing
        r = 6 if i == index else 4
        color = (255, 255, 255) if i == index else (180, 180, 180)
        draw.ellipse([dot_x - r, dot_y - r, dot_x + r, dot_y + r], fill=color)

    # Text
    lines = slide_data["text"].split("\n")
    font_size = 72 if max(len(l) for l in lines) < 22 else 60
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
    draw.text((wm_x, HEIGHT - 90), wm_text, font=small_font, fill=(255, 255, 255))

    return img


def create_video(slides_dir, video_path, num_slides):
    transition_duration = 0.5
    inputs = []
    for i in range(num_slides):
        slide_path = os.path.join(slides_dir, f"slide_{i:02d}.png")
        inputs.extend(["-loop", "1", "-t", str(DURATION_PER_SLIDE), "-i", slide_path])

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
        current_input = output if i < num_slides - 1 else f"[v{i}]"

    filter_complex = ";".join(filter_parts)
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "22", "-r", "30",
        video_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # Fallback simple concat
        concat_path = os.path.join(slides_dir, "concat.txt")
        with open(concat_path, "w") as f:
            for i in range(num_slides):
                f.write(f"file '{slides_dir}/slide_{i:02d}.png'\nduration {DURATION_PER_SLIDE}\n")
            f.write(f"file '{slides_dir}/slide_{num_slides-1:02d}.png'\n")
        cmd2 = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_path,
            "-vf", "fps=30", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "22", video_path,
        ]
        subprocess.run(cmd2, capture_output=True, text=True)
        os.remove(concat_path)

    return os.path.exists(video_path)


def main():
    os.makedirs(PHOTOS_DIR, exist_ok=True)

    print("🎬 Generating 3 TikTok Slideshows\n")

    for vid_idx, video in enumerate(VIDEOS):
        print(f"{'='*50}")
        print(f"📹 Video {vid_idx+1}/3: {video['name']}")
        print(f"{'='*50}")

        vid_photos_dir = os.path.join(PHOTOS_DIR, f"v{vid_idx}")
        vid_slides_dir = os.path.join(OUTPUT_DIR, f"slides_v{vid_idx}")
        vid_path = os.path.join(OUTPUT_DIR, f"{video['name']}.mp4")
        os.makedirs(vid_photos_dir, exist_ok=True)
        os.makedirs(vid_slides_dir, exist_ok=True)

        # Download photos
        print("  📷 Photos...")
        photo_paths = []
        for i, url in enumerate(PHOTO_SETS[vid_idx]):
            fp = os.path.join(vid_photos_dir, f"photo_{i:02d}.jpg")
            path = download_photo(url, fp)
            photo_paths.append(path)
            status = "✓" if path else "❌"
            print(f"    {status} Photo {i+1}/7")

        # Create slides
        print("  🖼 Slides...")
        slides = video["slides"]
        for i, slide in enumerate(slides):
            img = create_slide(slide, i, len(slides), photo_paths[i])
            save_path = os.path.join(vid_slides_dir, f"slide_{i:02d}.png")
            img.save(save_path, quality=95)

        # Render video
        print("  🎬 Rendering...")
        success = create_video(vid_slides_dir, vid_path, len(slides))
        if success:
            size_mb = os.path.getsize(vid_path) / (1024 * 1024)
            print(f"  ✅ {vid_path} ({size_mb:.1f}MB)")
        else:
            print(f"  ❌ Failed!")

        # Print caption
        print(f"  📝 Caption: {video['caption']}")
        print(f"  # {video['hashtags']}\n")

    print("\n🎉 All 3 videos done!")


if __name__ == "__main__":
    main()
