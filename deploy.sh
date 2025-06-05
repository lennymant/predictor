#!/bin/bash

echo "Ì¥Å Deploying predictor..."

# Step 1: Navigate to app
cd /var/www/predictor || {
  echo "‚ùå Directory not found!"
  exit 1
}

# Step 2: Pull latest code from main
echo "Ì≥• Pulling from main branch..."
git pull origin main || {
  echo "‚ùå Git pull failed!"
  exit 1
}

# Step 3: Install/update dependencies
echo "Ì≥¶ Running npm install..."
npm install || {
  echo "‚ùå npm install failed!"
  exit 1
}

# Step 4: Restart app with PM2
echo "Ì∫Ä Restarting app with PM2..."
if pm2 list | grep -q predictor; then
  pm2 reload predictor
else
  pm2 start server.js --name predictor
fi

echo "‚úÖ Deploy complete."
