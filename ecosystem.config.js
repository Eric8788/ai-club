module.exports = {
  apps: [
    {
      name: 'ai-club-hub',
      script: 'python3',
      args: '-m http.server 5190 --bind 0.0.0.0',
      cwd: '/Users/eric/Desktop/AI/AI-CLUB',
      interpreter: 'none',
      autorestart: true,
      watch: false
    },
    {
      name: 'sailer-2d-dev',
      script: 'npm',
      args: 'run dev -- --port 5180',
      cwd: '/Users/eric/Desktop/AI/AI-CLUB/sailer-2d',
      interpreter: 'none',
      autorestart: true,
      watch: false
    },
    {
      name: 'prometheus-backend',
      script: 'story-server.js',
      cwd: '/Users/eric/Desktop/AI/AI-CLUB/AI-GAME/web-game',
      autorestart: true,
      watch: false
    },
    {
      name: 'quant-panel',
      script: 'main.py',
      cwd: '/Users/eric/Desktop/AI/AI-CLUB/Quantitative_Alert_System',
      interpreter: 'python3',
      autorestart: true,
      watch: false
    }
  ]
};
