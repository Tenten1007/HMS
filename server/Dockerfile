# Dockerfile for HMS server (Express/TypeScript)
FROM node:20-slim

# Install latest chrome dev package and fonts to support thai language
RUN apt-get update && apt-get install -y wget gnupg2 apt-transport-https \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    fonts-liberation \
    fonts-thai-tlwg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3001
CMD ["node", "dist/index.js"] 