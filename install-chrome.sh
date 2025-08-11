#!/bin/bash
set -e

# Update package list
apt-get update

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable fonts-liberation --no-install-recommends

# Clean up
rm -rf /var/lib/apt/lists/*

echo "Chrome installed successfully"