import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Modify styles
new_styles = """
      .card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.06);
      }

      .card-cover {
        height: 180px;
        background: #e2e8f0;
        position: relative;
        overflow: hidden;
      }

      .card-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }
      
      .card:hover .card-cover img {
        transform: scale(1.05);
      }

      .card-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
      }

      .card-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .card h2 {
        margin: 0;
        font-size: 20px;
        line-height: 1.3;
        letter-spacing: -0.01em;
        color: var(--text);
      }

      .card .author {
        margin: 0;
        font-size: 14px;
        color: var(--muted);
        font-weight: 500;
      }

      .card p.desc {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
        font-size: 14px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: auto;
        padding-top: 8px;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 2px 10px;
        border-radius: 6px;
        background: var(--tag);
        color: var(--accent-dark);
        font-size: 12px;
        font-weight: 600;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--accent);
        color: white;
        text-decoration: none;
        font-weight: 600;
        margin-top: 12px;
        transition: background 0.2s;
      }

      .button:hover {
        background: var(--accent-dark);
      }
"""

html = re.sub(r'\.card \{.*?\.button:hover \{.*?\}', new_styles.strip(), html, flags=re.DOTALL)

# Re-write the cards
cards_data = [
    {
        "title": "Sailer 2D",
        "author": "Eric / AI Club",
        "desc": "A serious 2D sailing simulator for learning wind, sail, rudder, force, and boat movement.",
        "tags": ["Sailing", "2D", "Simulation"],
        "link": 'data-port="5180" data-path="/" href="http://localhost:5180/"',
        "img_seed": "sailer"
    },
    {
        "title": "Funny Sailing 2D",
        "author": "AI Club",
        "desc": "A playful sailing wave-dodge game for quick experiments, silly turns, and funny mechanics.",
        "tags": ["Game", "Sailing", "2D"],
        "link": 'data-path="/HAPPY-games/index.html" href="../HAPPY-games/index.html"',
        "img_seed": "funnysail"
    },
    {
        "title": "Cooka Snake",
        "author": "Cooka",
        "desc": "A simple snake game that is easy to understand, remix, and extend with new rules.",
        "tags": ["Game"],
        "link": 'data-path="/Cooka_snake.html" href="../Cooka_snake.html"',
        "img_seed": "snake"
    },
    {
        "title": "帆船起航倒计时",
        "author": "Albert",
        "desc": "A sailing race start countdown tool for real training and event scenarios.",
        "tags": ["Tool", "Sailing"],
        "link": 'data-path="/Albert_帆船比赛起航倒计时（群发赛版）.html" href="../Albert_帆船比赛起航倒计时（群发赛版）.html"',
        "img_seed": "countdown"
    },
    {
        "title": "Peter 背单词",
        "author": "Peter",
        "desc": "A minimal vocabulary tool and a good starter for personal learning apps.",
        "tags": ["Tool"],
        "link": 'data-path="/Peter_背单词.html" href="../Peter_背单词.html"',
        "img_seed": "vocab"
    },
    {
        "title": "Lucy Grass",
        "author": "Lucy",
        "desc": "A small visual artwork project for exploring interactive art and atmosphere.",
        "tags": ["Visual", "Art"],
        "link": 'data-path="/Lucy_grass.html" href="../Lucy_grass.html"',
        "img_seed": "grass"
    },
    {
        "title": "CV 点名抽签",
        "author": "Student Project",
        "desc": "A classroom random picker demo with a camera-inspired interaction concept.",
        "tags": ["Tool", "Classroom"],
        "link": 'data-path="/2_学生项目_Student_Projects/codex-p1/index.html" href="../2_学生项目_Student_Projects/codex-p1/index.html"',
        "img_seed": "cv"
    },
    {
        "title": "Peter Flight Radar",
        "author": "Peter",
        "desc": "A map and route starter for flight, navigation, and real-world tracking ideas.",
        "tags": ["Map", "Starter"],
        "link": 'data-path="/社团管理_Club_Management/2_教学资源_Resources/Starters/Peter_FlightRadar/index.html" href="../社团管理_Club_Management/2_教学资源_Resources/Starters/Peter_FlightRadar/index.html"',
        "img_seed": "radar"
    }
    # Lucy Portfolio is removed!
]

new_section = '<section class="grid" aria-label="AI Club projects">\n'
for c in cards_data:
    tags_html = "".join([f'<span class="tag">{t}</span>' for t in c["tags"]])
    new_section += f"""        <article class="card">
          <div class="card-cover">
            <img src="https://picsum.photos/seed/{c["img_seed"]}/400/225" alt="{c["title"]} cover" loading="lazy" />
          </div>
          <div class="card-content">
            <div class="card-header">
              <h2>{c["title"]}</h2>
              <p class="author">作者: {c["author"]}</p>
            </div>
            <p class="desc">{c["desc"]}</p>
            <div class="tags">
              {tags_html}
            </div>
            <a class="button" {c["link"]} target="_blank" rel="noopener">打开项目</a>
          </div>
        </article>
"""
new_section += '      </section>'

html = re.sub(r'<section class="grid" aria-label="AI Club projects">.*?</section>', new_section, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
