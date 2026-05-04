with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Update root variables for dark mode
new_root = """      :root {
        --bg: transparent;
        --panel: rgba(15, 23, 42, 0.4);
        --text: #f8fafc;
        --muted: #94a3b8;
        --line: rgba(255, 255, 255, 0.1);
        --accent: #6366f1;
        --accent-hover: #818cf8;
        --tag-bg: rgba(99, 102, 241, 0.15);
        --tag-text: #a5b4fc;
        --radius: 16px;
      }"""

html = re.sub(r':root\s*\{[^}]+\}', new_root, html)

# Update card background and border to match dark glassmorphism
html = re.sub(r'border: 1px solid rgba\(255,255,255,0\.8\);', 'border: 1px solid rgba(255,255,255,0.1);', html)
html = re.sub(r'background: rgba\(255, 255, 255, 0\.7\);', 'background: var(--panel); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);', html)
html = re.sub(r'box-shadow: 0 10px 30px -10px rgba\(0,0,0,0\.1\);', 'box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
