import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Canvas CSS to include blur and slight opacity drop so it's a soft mask
html = html.replace('<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;">',
                    '<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none; filter: blur(15px); opacity: 0.8;"></canvas>')

# 2. Make particles significantly larger
html = html.replace('this.baseSize = Math.random() * 3.5 + 2;', 'this.baseSize = Math.random() * 25 + 15;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
