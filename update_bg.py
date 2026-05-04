import re
from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the old background-color and background-image from body
html = re.sub(r'background-color:\s*#0f172a;', 'background-color: transparent;', html)
html = re.sub(r'background-image:.*?;', '', html, flags=re.DOTALL)

# Inject the new background HTML right after <body>
bg_html = """
  <div class="ambient-background">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
    <div class="blob blob-4"></div>
  </div>
  <div class="noise-overlay"></div>
"""

html = html.replace('<body>', '<body>\n' + bg_html)

# Inject the new CSS
bg_css = """
    /* --- Premium Dynamic Gradient Background --- */
    .ambient-background {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: -2;
      overflow: hidden;
      background-color: #030014; /* Deep premium dark */
    }
    
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.7;
      animation: float 20s infinite alternate ease-in-out;
      transform-origin: center;
    }

    .blob-1 {
      background: linear-gradient(135deg, #00c6ff, #0072ff);
      width: 60vw; height: 60vw;
      top: -20%; left: -10%;
      animation-duration: 25s;
    }
    
    .blob-2 {
      background: linear-gradient(135deg, #f12711, #f5af19);
      width: 50vw; height: 50vw;
      bottom: -20%; right: -10%;
      animation-duration: 22s;
      animation-delay: -5s;
    }
    
    .blob-3 {
      background: linear-gradient(135deg, #8a2387, #e94057, #f27121);
      width: 55vw; height: 55vw;
      top: 30%; left: 30%;
      mix-blend-mode: color-dodge;
      animation-duration: 28s;
      animation-delay: -10s;
    }

    .blob-4 {
      background: linear-gradient(135deg, #11998e, #38ef7d);
      width: 45vw; height: 45vw;
      bottom: 20%; left: -10%;
      mix-blend-mode: screen;
      animation-duration: 24s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1) rotate(0deg); }
      33% { transform: translate(15vw, -10vh) scale(1.1) rotate(10deg); }
      66% { transform: translate(-10vw, 15vh) scale(0.9) rotate(-5deg); }
      100% { transform: translate(5vw, 5vh) scale(1.05) rotate(5deg); }
    }

    .noise-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: -1;
      opacity: 0.06;
      pointer-events: none;
      background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
    }
    /* ------------------------------------------- */
"""

html = html.replace('  </style>', bg_css + '\n  </style>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Background updated.")
