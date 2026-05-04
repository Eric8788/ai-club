import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_script = """<script>
  // Advanced Canvas Interactive Particles
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  
  // High-end Google Antigravity Colors
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4', '#F442A8'];
  
  const mouse = { x: -1000, y: -1000, radius: 160 };

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
      this.baseSize = Math.random() * 5 + 1.5; // 大小不一
      this.size = this.baseSize;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      // 赋予基础运动速度
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      
      // 呼吸律动参数
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
    }

    draw() {
      // 呼吸动态大小
      this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.4);
      this.pulsePhase += this.pulseSpeed;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // 修复边界弹飞：平滑穿越屏幕
      if (this.x > width + 50) this.x = -50;
      else if (this.x < -50) this.x = width + 50;
      
      if (this.y > height + 50) this.y = -50;
      else if (this.y < -50) this.y = height + 50;

      // 鼠标排斥交互
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let force = (mouse.radius - distance) / mouse.radius;
        
        // 排斥力改变速度
        this.vx -= forceDirectionX * force * 0.4;
        this.vy -= forceDirectionY * force * 0.4;
      }
      
      // 摩擦力与速度限制（让运动自然流畅）
      let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 1.8) {
        this.vx *= 0.95;
        this.vy *= 0.95;
      } else if (speed < 0.3) {
        // 防止停滞
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }

      this.draw();
    }
  }

  function init() {
    particles = [];
    const numParticles = Math.min((width * height) / 6000, 200); 
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // 渲染粒子
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
    }

    // 粒子之间靠近时产生连接线（融合与分解的视觉效果）
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let distSquare = dx * dx + dy * dy;
        
        if (distSquare < 7000) { // 靠近时融合
          ctx.beginPath();
          let opacity = 1 - (distSquare / 7000);
          ctx.strokeStyle = particles[i].color; // 使用粒子的颜色
          ctx.globalAlpha = opacity * 0.6; 
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }
    }

    requestAnimationFrame(animate);
  }

  init();
  animate();
</script>"""

# Replace old script
html = re.sub(r'<script>\s*// Canvas Interactive Particles.*?animate\(\);\s*</script>', new_script, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
