import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_styles = """
      :root {
        --bg: #f8fafc;
        --panel: #ffffff;
        --text: #0f172a;
        --muted: #64748b;
        --line: #e2e8f0;
        --accent: #6366f1;
        --accent-hover: #4f46e5;
        --tag-bg: #eff6ff;
        --tag-text: #3b82f6;
        --radius: 16px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background-color: var(--bg);
        background-image: 
          radial-gradient(at 0% 0%, hsla(253,16%,7%,0.03) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,0.03) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,0.03) 0, transparent 50%);
        color: var(--text);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      main {
        width: min(1100px, calc(100% - 40px));
        margin: 0 auto;
        padding: 64px 0 48px;
      }

      header {
        margin-bottom: 48px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      h1 {
        margin: 0;
        font-size: clamp(40px, 6vw, 56px);
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
      }

      .subtitle {
        margin: 12px 0 0;
        font-size: 20px;
        font-weight: 500;
        color: var(--text);
      }

      .intro {
        margin: 12px 0 0;
        font-size: 16px;
        color: var(--muted);
        max-width: 600px;
      }

      .notice {
        margin: 24px 0 0;
        padding: 12px 20px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(255,255,255,0.8);
        backdrop-filter: blur(12px);
        color: var(--muted);
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
      }

      .card {
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255,255,255,0.8);
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
      }

      .card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0,0,0,0.03);
        background: #ffffff;
      }

      .card-cover {
        height: 160px;
        background: #f1f5f9;
        position: relative;
        overflow: hidden;
      }

      .card-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .card:hover .card-cover img {
        transform: scale(1.05);
      }

      .card-content {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        flex: 1;
      }

      .card-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .card h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: -0.01em;
        color: var(--text);
      }

      .card .author {
        margin: 0;
        font-size: 13px;
        color: var(--muted);
        font-weight: 500;
      }

      .card p.desc {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
        font-size: 14px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: auto;
        padding-top: 10px;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 2px 10px;
        border-radius: 999px;
        background: var(--tag-bg);
        color: var(--tag-text);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 10px 16px;
        border-radius: 10px;
        background: var(--accent);
        color: white;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        margin-top: 14px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
      }

      .button:hover {
        background: var(--accent-hover);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        transform: translateY(-1px);
      }

      footer {
        margin-top: 60px;
        padding-top: 24px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 14px;
        text-align: center;
      }

      code {
        color: var(--accent-hover);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background: var(--tag-bg);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9em;
      }
"""

html = re.sub(r'<style>.*?</style>', f'<style>\n{new_styles}\n    </style>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
