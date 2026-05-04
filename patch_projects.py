import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_cards = """
        <article class="card">
          <div class="card-cover">
            <img src="./covers/sail-dodge.jpg" alt="Sail Dodge cover" loading="lazy" />
          </div>
          <div class="card-content">
            <div class="card-header">
              <h2>Sail Dodge</h2>
              <p class="author">作者: AI Club</p>
            </div>
            <p class="desc">A polished, low-poly arcade dodge game where you navigate waves and collect combos.</p>
            <div class="tags">
              <span class="tag">Game</span><span class="tag">Sailing</span>
            </div>
            <a class="button" data-path="/New project/dist/index.html" href="../New project/dist/index.html" target="_blank" rel="noopener">打开项目</a>
          </div>
        </article>
        
        <article class="card">
          <div class="card-cover">
            <img src="./covers/prometheus.jpg" alt="PROMETHEUS cover" loading="lazy" />
          </div>
          <div class="card-content">
            <div class="card-header">
              <h2>PROMETHEUS</h2>
              <p class="author">作者: AI Club</p>
            </div>
            <p class="desc">A high-fidelity interactive terminal-style narrative engine exploring humanity, survival, and choices.</p>
            <div class="tags">
              <span class="tag">AI</span><span class="tag">Game</span><span class="tag">Narrative</span>
            </div>
            <a class="button" data-port="3000" data-path="/" href="http://localhost:3000/" target="_blank" rel="noopener">打开项目</a>
          </div>
        </article>
        
        <article class="card">
          <div class="card-cover">
            <img src="./covers/quant-panel.jpg" alt="Quantitative Alert System cover" loading="lazy" />
          </div>
          <div class="card-content">
            <div class="card-header">
              <h2>Quantitative Panel</h2>
              <p class="author">作者: AI Club</p>
            </div>
            <p class="desc">A professional quantitative monitoring and alert dashboard for analyzing market trends.</p>
            <div class="tags">
              <span class="tag">Tool</span><span class="tag">Data</span><span class="tag">Finance</span>
            </div>
            <a class="button" data-port="8000" data-path="/" href="http://localhost:8000/" target="_blank" rel="noopener">打开项目</a>
          </div>
        </article>
"""

# Insert before the closing </section>
html = html.replace('      </section>', new_cards + '      </section>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
