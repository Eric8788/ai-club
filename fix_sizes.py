import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Title size
html = html.replace('font-size: 3.5rem;', 'font-size: 4.5rem;')

# 2. Particle size difference
old_size_code = "this.baseSize = Math.random() * 5 + 1.5; // 大小不一"
new_size_code = "this.baseSize = Math.random() > 0.85 ? Math.random() * 12 + 8 : Math.random() * 4 + 2; // 极度悬殊的大小差"
html = html.replace(old_size_code, new_size_code)

# Make the breathing magnitude proportional to the new big sizes
old_breathe = "this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.4);"
new_breathe = "this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.3);"
html = html.replace(old_breathe, new_breathe)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
