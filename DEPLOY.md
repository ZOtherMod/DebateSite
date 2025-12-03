# 🚀 Deployment Instructions

## Quick Deploy to Render

### Step 1: GitHub Setup
```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Online Debate Platform"

# Create GitHub repo and push
git remote add origin https://github.com/ZOtherMod/DebateSite.git
git branch -M main
git push -u origin main
```

### Step 2: Render Deployment

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub** repository
4. **Configure:**
   - **Name**: `debate-platform` (or your choice)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && python app.py`
   - **Instance Type**: Free tier is fine for testing

5. **Click "Create Web Service"**

### Step 3: Access Your App

- **URL**: `https://your-app-name.onrender.com`
- **WebSocket**: Automatically configured for production
- **Database**: SQLite file created automatically

## Environment Variables (Optional)

In Render dashboard, you can set:
- `DEBUG=false` (for production)
- `PORT` (Render sets this automatically)

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Python version compatibility
2. **WebSocket connection fails**: Ensure HTTPS/WSS protocol
3. **Static files not loading**: Check file paths in frontend

### Logs:
- Check Render dashboard logs for server errors
- Use browser dev tools for client-side issues

## Local Development vs Production

**Local**: 
- WebSocket: `ws://localhost:8765`
- Static files: Open `index.html` directly

**Production**: 
- WebSocket: `wss://your-app.onrender.com`
- Static files: Served by the application

The code automatically detects the environment and configures URLs accordingly.

---

**That's it! Your debate platform should be live and ready for users! 🎉**
