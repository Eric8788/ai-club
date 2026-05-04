import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove canvas tag
html = re.sub(r'<canvas id="particle-canvas".*?</canvas>', '', html)

# Remove the particle script
html = re.sub(r'<script>\s*// Advanced Canvas Interactive Particles.*?</script>', '', html, flags=re.DOTALL)
html = re.sub(r'<script>\s*// Canvas Interactive Particles.*?</script>', '', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
