import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Revert Canvas CSS (remove blur and opacity)
html = html.replace('<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none; filter: blur(15px); opacity: 0.8;"></canvas>',
                    '<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;"></canvas>')

# 2. Revert particle size
html = html.replace('this.baseSize = Math.random() * 25 + 15;', 'this.baseSize = Math.random() * 3.5 + 2;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
