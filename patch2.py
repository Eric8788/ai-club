import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Change all authors to AI Club
html = re.sub(r'<p class="author">作者: .*?</p>', '<p class="author">作者: AI Club</p>', html)

# Change all picsum images to local cover images
# We map seeds to local paths
os.makedirs('covers', exist_ok=True)

seed_to_name = {
    "sailer": "sailer.jpg",
    "funnysail": "funny-sailing.jpg",
    "snake": "snake.jpg",
    "countdown": "countdown.jpg",
    "vocab": "vocabulary.jpg",
    "grass": "lucy-grass.jpg",
    "cv": "cv-picker.jpg",
    "radar": "flight-radar.jpg"
}

def replace_img(match):
    seed = match.group(1)
    name = seed_to_name.get(seed, f"{seed}.jpg")
    # Touch an empty file so it doesn't 404 entirely (though it'll be broken img icon)
    # Actually, let's not touch empty files, let's just point to them.
    return f'img src="./covers/{name}"'

html = re.sub(r'img src="https://picsum\.photos/seed/([^/]+)/400/225"', replace_img, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
