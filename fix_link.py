import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the wrong link for Sail Dodge
html = html.replace('data-path="/New project/dist/index.html" href="../New project/dist/index.html"', 'data-path="/sail-dodge-dist/index.html" href="../sail-dodge-dist/index.html"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
