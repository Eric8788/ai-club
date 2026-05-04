import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Clean old background divs
html = re.sub(r'<div class="ambient-background">.*?</div>', '', html, flags=re.DOTALL)
html = re.sub(r'<div class="noise-overlay"></div>', '', html)

# 2. Insert Canvas
if '<canvas id="particle-canvas"' not in html:
    html = html.replace('<body>', '<body>\n  <canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;"></canvas>')

# 3. New CSS
new_css = """  <style>
      :root {
        --bg: #ffffff;
        --panel: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --line: #e5e7eb;
        --accent: #000000;
        --accent-hover: #374151;
        --tag-bg: #f3f4f6;
        --tag-border: #e5e7eb;
        --tag-text: #4b5563;
        --radius: 12px;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: var(--bg);
        color: var(--text);
        line-height: 1.5;
        overflow-x: hidden;
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 20px;
      }

      header {
        text-align: center;
        margin-bottom: 60px;
      }

      h1 {
        font-size: 3.5rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #111827;
        margin-bottom: 12px;
      }

      .subtitle {
        font-size: 1.25rem;
        color: var(--muted);
        font-weight: 500;
      }

      .intro {
        margin-top: 8px;
        color: var(--muted);
      }

      .notice {
        display: inline-block;
        margin-top: 24px;
        padding: 10px 20px;
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        border-radius: 30px;
        font-size: 0.9rem;
        color: #6b7280;
      }

      .notice code {
        color: #111827;
        font-weight: 600;
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 32px;
      }

      .card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .card-cover {
        width: 100%;
        aspect-ratio: 16/9;
        background-color: #f3f4f6;
        overflow: hidden;
        border-bottom: 1px solid var(--line);
      }

      .card-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .card:hover .card-cover img {
        transform: scale(1.05);
      }

      .card-content {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .card-header {
        margin-bottom: 12px;
      }

      .card-header h2 {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #111827;
        margin-bottom: 4px;
      }

      .author {
        font-size: 0.85rem;
        color: var(--muted);
      }

      .desc {
        font-size: 0.95rem;
        color: #4b5563;
        margin-bottom: 24px;
        flex: 1;
        line-height: 1.6;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;
      }

      .tag {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
        background-color: var(--tag-bg);
        color: var(--tag-text);
        border: 1px solid var(--tag-border);
      }

      .button {
        display: inline-block;
        text-align: center;
        background-color: var(--accent);
        color: white;
        text-decoration: none;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.95rem;
        transition: background-color 0.2s ease;
      }

      .button:hover {
        background-color: var(--accent-hover);
      }

      footer {
        text-align: center;
        margin-top: 80px;
        color: var(--muted);
        font-size: 0.9rem;
      }
      
      footer code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        color: #111827;
      }
  </style>"""

html = re.sub(r'<style>.*?</style>', new_css, html, flags=re.DOTALL)

# 4. Canvas JS Particle Script
particle_js = """
<script>
  // Canvas Interactive Particles (Antigravity Style)
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  // High-end Google Antigravity Colors
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4', '#F442A8'];
  
  const mouse = { x: -1000, y: -1000 };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 1; // small particles
      this.baseX = this.x;
      this.baseY = this.y;
      this.density = (Math.random() * 30) + 5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      // Drift vector
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    update() {
      // Gentle drift
      this.baseX += this.vx;
      this.baseY += this.vy;

      // Wrap around screen
      if (this.baseX > width + 10) this.baseX = -10;
      if (this.baseX < -10) this.baseX = width + 10;
      if (this.baseY > height + 10) this.baseY = -10;
      if (this.baseY < -10) this.baseY = height + 10;

      // Mouse repel physics
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let forceDirectionX = dx / distance;
      let forceDirectionY = dy / distance;
      let maxDistance = 150;
      let force = (maxDistance - distance) / maxDistance;
      let directionX = forceDirectionX * force * this.density;
      let directionY = forceDirectionY * force * this.density;

      if (distance < maxDistance) {
        this.x -= directionX;
        this.y -= directionY;
      } else {
        if (this.x !== this.baseX) {
          let dx = this.x - this.baseX;
          this.x -= dx / 20;
        }
        if (this.y !== this.baseY) {
          let dy = this.y - this.baseY;
          this.y -= dy / 20;
        }
      }
      this.draw();
    }
  }

  function init() {
    particles = [];
    const numParticles = Math.min((width * height) / 8000, 200); // responsive count
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
    }
    requestAnimationFrame(animate);
  }

  init();
  animate();
</script>
"""

# Insert script right before existing <script> or </body>
if '<script>' in html:
    # We want to replace the FIRST <script> block if it happens to be our old canvas, but there's no old canvas.
    # Just inject before the existing routing script.
    # Existing script starts with <script>\n      const host = location.hostname
    html = html.replace('<script>\n      const host', particle_js + '\n<script>\n      const host')
else:
    html = html.replace('</body>', particle_js + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
