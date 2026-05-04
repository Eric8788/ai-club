import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Reduce blur to 3px
html = html.replace('filter: blur(6px);', 'filter: blur(3px);')

# 2. Make tags more obvious: increase font-size and color intensity
html = re.sub(r'--tag-text: #4b5563;', '--tag-text: #374151;', html) # Darker text
html = re.sub(r'\.tag \{[^\}]*\}', 
    '.tag {\n        font-size: 0.85rem;\n        font-weight: 600;\n        padding: 5px 12px;\n        border-radius: 20px;\n        background-color: var(--tag-bg);\n        color: var(--tag-text);\n        border: 1px solid var(--tag-border);\n      }', 
    html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
