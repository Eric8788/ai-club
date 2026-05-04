import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_script = """<script>
  // Advanced Canvas Interactive Particles with Depth of Field
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  // High-end Google Antigravity Colors
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4', '#F442A8'];
  
  const mouse = { x: -1000, y: -1000, radius: 200 };

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
      // Z-depth: 0 (Far) to 1 (Near)
      this.z = Math.random();
      
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      
      // Size scales with Z (Parallax) - Near bubbles are huge
      this.baseSize = (this.z * 25) + 3; 
      this.size = this.baseSize;
      
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      // Speed scales with Z
      let speedFactor = (this.z * 1.5) + 0.2;
      this.vx = (Math.random() - 0.5) * speedFactor;
      this.vy = (Math.random() - 0.5) * speedFactor;
      
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
    }

    draw() {
      this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.15);
      this.pulsePhase += this.pulseSpeed;

      // Depth of Field Blur
      let blurAmount = (1 - this.z) * 6; // Far particles get up to 6px blur
      if (blurAmount < 1.0) blurAmount = 0; // Keep near ones crisp
      
      if (blurAmount > 0) {
        ctx.filter = `blur(${blurAmount}px)`;
      } else {
        ctx.filter = 'none';
      }

      // Bubble Body (Translucent)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.15 + (this.z * 0.15); 
      ctx.fill();

      // Bubble Outline
      ctx.lineWidth = 1 + (this.z * 1.5);
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.4 + (this.z * 0.4);
      ctx.stroke();

      // High-Gloss Reflection (only for near, crisp bubbles)
      if (this.z > 0.6) {
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.fill();
        
        // Secondary small reflection
        ctx.beginPath();
        ctx.arc(this.x + this.size * 0.4, this.y + this.size * 0.4, this.size * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.fill();
      }

      ctx.filter = 'none';
      ctx.globalAlpha = 1.0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x > width + 50) this.x = -50;
      else if (this.x < -50) this.x = width + 50;
      
      if (this.y > height + 50) this.y = -50;
      else if (this.y < -50) this.y = height + 50;

      // Mouse repel (Near objects are repelled more heavily)
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let force = (mouse.radius - distance) / mouse.radius;
        
        let repelPower = 0.2 + (this.z * 0.5); // Near gets pushed faster
        this.vx -= forceDirectionX * force * repelPower;
        this.vy -= forceDirectionY * force * repelPower;
      }
      
      let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      let maxSpeed = (this.z * 2.0) + 0.5;
      if (speed > maxSpeed) {
        this.vx *= 0.95;
        this.vy *= 0.95;
      } else if (speed < 0.1) {
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;
      }

      this.draw();
    }
  }

  function init() {
    particles = [];
    const numParticles = Math.min((width * height) / 8000, 100); 
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
    // Sort by Z so far particles are drawn first (behind)
    particles.sort((a, b) => a.z - b.z);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
    }

    // Connect ONLY background particles for depth
    for (let i = 0; i < particles.length; i++) {
      // Don't connect near big bubbles
      if (particles[i].z > 0.6) continue;
      
      for (let j = i + 1; j < particles.length; j++) {
        if (particles[j].z > 0.6) continue;

        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let distSquare = dx * dx + dy * dy;
        
        if (distSquare < 8000) { 
          ctx.beginPath();
          let opacity = (1 - (distSquare / 8000)) * 0.4;
          ctx.strokeStyle = particles[i].color; 
          ctx.globalAlpha = opacity; 
          ctx.lineWidth = 1;
          
          // Apply blur to far connection lines
          let blurLine = (1 - particles[i].z) * 4;
          if (blurLine > 0) ctx.filter = `blur(${blurLine}px)`;
          
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;
        }
      }
    }

    requestAnimationFrame(animate);
  }

  init();
  animate();
</script>"""

# We need to replace the entire <script> block for the canvas logic
# Locate from "// Advanced Canvas Interactive Particles" to "</script>"
html = re.sub(r'<script>\s*//.*?animate\(\);\s*</script>', new_script, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
