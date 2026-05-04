import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Title size
html = html.replace('font-size: 3.5rem;', 'font-size: 5rem;')

# 2. Bubble rendering
old_draw = """    draw() {
      // 呼吸动态大小
      this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.4);
      this.pulsePhase += this.pulseSpeed;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }"""

new_draw = """    draw() {
      // 呼吸动态大小
      this.size = this.baseSize + Math.sin(this.pulsePhase) * (this.baseSize * 0.4);
      this.pulsePhase += this.pulseSpeed;

      // 气泡半透明主体
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color; 
      ctx.globalAlpha = 0.15; 
      ctx.fill();

      // 气泡边缘轮廓
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.6;
      ctx.stroke();

      // 气泡高光 (模拟反光)
      ctx.beginPath();
      ctx.arc(this.x - this.size * 0.35, this.y - this.size * 0.35, this.size * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.fill();

      ctx.globalAlpha = 1.0;
    }"""

html = html.replace(old_draw, new_draw)

# Make baseSize bigger for bubbles
html = html.replace('this.baseSize = Math.random() * 5 + 1.5;', 'this.baseSize = Math.random() * 10 + 4;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
