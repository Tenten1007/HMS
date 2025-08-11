#!/bin/bash
set -e

echo "Starting Chrome installation for Render..."
echo "User ID: $(id -u), running as: $(whoami)"

# Update package list
echo "Updating package list..."
apt-get update

# Install dependencies first
echo "Installing dependencies..."
apt-get install -y wget gnupg ca-certificates fonts-liberation

# Add Google Chrome repository
echo "Adding Chrome repository..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list

# Update package list with new repository
echo "Updating package list with Chrome repository..."
apt-get update

# Install Google Chrome
echo "Installing Google Chrome..."
apt-get install -y google-chrome-stable --no-install-recommends

echo "Chrome installation completed successfully!"

# Verify installation
if command -v google-chrome-stable &> /dev/null; then
    echo "Chrome version: $(google-chrome-stable --version)"
else
    echo "Chrome installation may have failed"
    exit 1
fi