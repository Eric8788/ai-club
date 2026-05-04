const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("启动浏览器...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 设置一个适合展示的 16:9 分辨率
  await page.setViewport({ width: 1280, height: 720 });

  const targets = [
    { url: 'http://localhost:5190/sail-dodge-dist/index.html', output: './covers/sail-dodge.jpg' },
    { url: 'http://localhost:3000/', output: './covers/prometheus.jpg' },
    { url: 'http://localhost:8000/', output: './covers/quant-panel.jpg' }
  ];

  for (let t of targets) {
    console.log(`正在截图: ${t.url} ...`);
    try {
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
      // 等待1秒让动画/图表加载完毕
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: t.output, type: 'jpeg', quality: 90 });
      console.log(`✅ 截图保存至: ${t.output}`);
    } catch (err) {
      console.error(`❌ 截图失败: ${t.url}`, err);
    }
  }

  await browser.close();
  console.log("全部完成！");
})();
