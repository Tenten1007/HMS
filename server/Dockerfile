# Dockerfile for HMS server (Express/TypeScript)
FROM node:20-slim

# Install Chromium and dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create shared memory for Chromium
RUN mkdir -p /dev/shm

# Install dependencies
RUN apt-get update \
    && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-thai-tlwg \
    xvfb \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && chromium --version \
    && rm -rf /var/lib/apt/lists/*

# Set up shared memory volume with proper permissions
VOLUME /dev/shm
RUN chmod 1777 /dev/shm

# Set display for Xvfb
ENV DISPLAY=:99

# Add chrome user with proper permissions
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /dev/shm

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

# Switch to pptruser but keep necessary permissions
USER pptruser

EXPOSE 3001

ENV NODE_ENV=production
# Start Xvfb and the Node application
CMD Xvfb :99 -screen 0 1024x768x16 & node dist/index.js