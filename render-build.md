# Render Build Command สำหรับ Puppeteer

ใช้ Build Command นี้ใน Render Dashboard:

```bash
sudo apt-get update && sudo apt-get install -y wget gnupg ca-certificates fonts-liberation && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google.list && sudo apt-get update && sudo apt-get install -y google-chrome-stable --no-install-recommends && npm install && npm run build:server
```

Environment Variables ที่ต้องเพิ่ม:
- PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
- PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true