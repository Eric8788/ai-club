import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add canvas tag if missing
if '<canvas id="particle-canvas"' not in html:
    html = html.replace('<body>', '<body>\n  <canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;"></canvas>')

# The flat particle script
particle_js = """<script>
  // Flat Canvas Interactive Particles
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  // High-end Google Antigravity Colors
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4', '#F442A8'];
  
  const mouse = { x: -1000, y: -1000, radius: 150 };

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
      this.baseSize = Math.random() * 3.5 + 2; // Flat and crisp size
      this.size = this.baseSize;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Wrap
      if (this.x > width + 20) this.x = -20;
      else if (this.x < -20) this.x = width + 20;
      
      if (this.y > height + 20) this.y = -20;
      else if (this.y < -20) this.y = height + 20;

      // Repel
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let force = (mouse.radius - distance) / mouse.radius;
        
        this.vx -= forceDirectionX * force * 0.4;
        this.vy -= forceDirectionY * force * 0.4;
      }
      
      let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 1.5) {
        this.vx *= 0.95;
        this.vy *= 0.95;
      } else if (speed < 0.2) {
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }

      this.draw();
    }
  }

  function init() {
    particles = [];
    const numParticles = Math.min((width * height) / 8000, 200); 
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
</script>"""

html = html.replace('</body>', particle_js + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
