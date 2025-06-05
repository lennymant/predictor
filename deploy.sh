#!/bin/bash

echo "� Deploying predictor..."

# Step 1: Navigate to app
cd /var/www/predictor || {
  echo "❌ Directory not found!"
  exit 1
}

# Step 2: Pull latest code from main
echo "� Pulling from main branch..."
git pull origin main || {
  echo "❌ Git pull failed!"
  exit 1
}

# Step 3: Install/update dependencies
echo "� Running npm install..."
npm install || {
  echo "❌ npm install failed!"
  exit 1
}

# Step 4: Restart app with PM2
echo "� Restarting app with PM2..."
if pm2 list | grep -q predictor; then
  pm2 reload predictor
else
  pm2 start server.js --name predictor
fi

echo "✅ Deploy complete."
