from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

section = soup.find('section', class_='grid')
cards = section.find_all('article', class_='card')

# We want to group by primary tag. First tag in .tags
def get_primary_tag(card):
    tags_div = card.find('div', class_='tags')
    if tags_div:
        first_tag = tags_div.find('span', class_='tag')
        if first_tag:
            return first_tag.text.strip().lower()
    return "zzz"

# Sort priority: game -> tool -> simulation/map
priority = {
    'game': 1,
    'tool': 2,
    'map': 3,
    'simulation': 4,
    'ai': 5
}

def sort_key(card):
    tag = get_primary_tag(card)
    return priority.get(tag, 99)

cards_sorted = sorted(cards, key=sort_key)

# Clear the section and append sorted cards
section.clear()
section.append("\n")
for card in cards_sorted:
    section.append("        ")
    section.append(card)
    section.append("\n\n")
section.append("      ")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Sorted successfully")
