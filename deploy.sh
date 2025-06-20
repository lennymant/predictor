#!/bin/bash

echo "ν΄ Deploying predictor..."

# Step 1: Navigate to app
cd /var/www/predictor || {
  echo "β Directory not found!"
  exit 1
}

# Step 2: Pull latest code from main
echo "ν³₯ Pulling from main branch..."
git pull origin main || {
  echo "β Git pull failed!"
  exit 1
}

# Step 3: Install/update dependencies
echo "ν³¦ Running npm install..."
npm install || {
  echo "β npm install failed!"
  exit 1
}

# Step 4: Restart app with PM2
echo "νΊ Restarting app with PM2..."
if pm2 list | grep -q predictor; then
  pm2 reload predictor
else
  pm2 start server.js --name predictor
fi

echo "β Deploy complete."
