import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add a subtle gaussian blur to the canvas
html = html.replace('<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;"></canvas>',
                    '<canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none; filter: blur(6px);"></canvas>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
