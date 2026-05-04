import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 2. 第二个项目名称改为Sailer 3D (Funny Sailing 2D -> Sailer 3D)
html = html.replace('<h2>Funny Sailing 2D</h2>', '<h2>Sailer 3D</h2>')

# 3. Cooka Snake去掉cooka，cooka改为作者
html = html.replace('<h2>Cooka Snake</h2>', '<h2>Snake</h2>')
# We need to change author of Cooka Snake
# It currently has:
# <h2>Snake</h2>
# <p class="author">作者: AI Club</p>
# We can use regex to target the specific block
html = re.sub(r'(<h2>Snake</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Cooka\2', html)

# 4. 第四个作者Albert (帆船起航倒计时)
html = re.sub(r'(<h2>帆船起航倒计时</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Albert\2', html)

# 5. 第五个作者改为Peter (Peter 背单词)
# I will also remove "Peter " from the title to be consistent, but let's strictly follow if possible. Let's just remove Peter.
html = html.replace('<h2>Peter 背单词</h2>', '<h2>背单词</h2>')
html = re.sub(r'(<h2>背单词</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Peter\2', html)

# 6. 第六个标题改为草原梦境，作者为Lucy/Eric (Lucy Grass)
html = html.replace('<h2>Lucy Grass</h2>', '<h2>草原梦境</h2>')
html = re.sub(r'(<h2>草原梦境</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Lucy / Eric\2', html)

# 7. 第七个你修复一下，作者改为eric (CV 点名抽签)
html = re.sub(r'(<h2>CV 点名抽签</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Eric\2', html)

# 8. 第八个修复一下项目 (Peter Flight Radar)
# Probably wants title "Flight Radar" and author "Peter"
html = html.replace('<h2>Peter Flight Radar</h2>', '<h2>Flight Radar</h2>')
html = re.sub(r'(<h2>Flight Radar</h2>\s*<p class="author">)作者: AI Club(</p>)', r'\1作者: Peter\2', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
