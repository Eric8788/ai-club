import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Title CSS
old_h1_css = """      h1 {
        font-size: 3.5rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #111827;
        margin-bottom: 12px;
      }"""
new_h1_css = """      h1 {
        font-size: 3.5rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        background: linear-gradient(90deg, #4285F4, #A142F4, #EA4335, #FBBC05, #34A853);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient-shift 6s ease infinite;
        margin-bottom: 12px;
      }

      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }"""
html = html.replace(old_h1_css, new_h1_css)

# 2. Update Button colors
html = html.replace('--accent: #000000;', '--accent: #4285F4;')
html = html.replace('--accent-hover: #374151;', '--accent-hover: #3367d6;')

# 3. Update Button text
html = html.replace('>打开项目</a>', '>Start!</a>')

# 4. Remove notice
html = re.sub(r'<p class="notice">.*?</p>', '', html, flags=re.DOTALL)

# 5. Particle adjustments
html = html.replace('this.size = Math.random() * 2 + 1;', 'this.size = Math.random() * 3.5 + 2;')
html = html.replace('this.vx = (Math.random() - 0.5) * 0.5;', 'this.vx = (Math.random() - 0.5) * 1.5;')
html = html.replace('this.vy = (Math.random() - 0.5) * 0.5;', 'this.vy = (Math.random() - 0.5) * 1.5;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
