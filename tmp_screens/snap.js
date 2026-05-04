const puppeteer = require('puppeteer');

const urls = [
    { url: 'http://localhost:5180/', name: 'sailer' },
    { url: 'http://localhost:5190/HAPPY-games/index.html', name: 'funny-sailing' },
    { url: encodeURI('http://localhost:5190/Cooka_snake.html'), name: 'snake' },
    { url: encodeURI('http://localhost:5190/Albert_帆船比赛起航倒计时（群发赛版）.html'), name: 'countdown' },
    { url: encodeURI('http://localhost:5190/Peter_背单词.html'), name: 'vocabulary' },
    { url: encodeURI('http://localhost:5190/Lucy_grass.html'), name: 'lucy-grass' },
    { url: encodeURI('http://localhost:5190/2_学生项目_Student_Projects/codex-p1/index.html'), name: 'cv-picker' },
    { url: encodeURI('http://localhost:5190/社团管理_Club_Management/2_教学资源_Resources/Starters/Peter_FlightRadar/index.html'), name: 'flight-radar' }
];

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const item of urls) {
        console.log(`Taking screenshot for ${item.name}...`);
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        try {
            await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 10000 });
            // Wait an extra 2 seconds for canvas to draw or animations to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            await page.screenshot({ path: `../covers/${item.name}.jpg`, type: 'jpeg', quality: 90 });
            console.log(`Saved ${item.name}.jpg`);
        } catch (e) {
            console.error(`Failed to screenshot ${item.name}: ${e.message}`);
        }
        await page.close();
    }
    
    await browser.close();
})();
