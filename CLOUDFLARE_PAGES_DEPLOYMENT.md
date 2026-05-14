# Cloudflare Pages Deployment Guide

## Your Project
- **URL**: https://dash.cloudflare.com/524d0d02da6a48ed006aecd83eaaef18/pages/view/jeevajyothimedia
- **GitHub Repo**: https://github.com/Stephen4123/version-3-frontend
- **Frontend Source Directory**: `Frontend/`
- **Production Domain**: https://jeevajyothimedia.com

## Current Status

✅ **Completed**:
- Backend deployed on Render
- Cloudflare Worker deployed and serving at `api.jeevajyothimedia.com`
- Frontend API endpoints updated to use production Worker
- Config file created (`Frontend/assets/js/config.js`)
- All code committed to GitHub

⏳ **Remaining**:
- Configure Cloudflare Pages build settings
- Connect GitHub repository
- Deploy frontend

## Step-by-Step Deployment

### Option A: Connect via Cloudflare Pages Dashboard (Recommended)

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Enter your credentials

2. **Navigate to Pages**
   - Click **Pages** in the left sidebar
   - Click your project: **jeevajyothimedia**

3. **Go to Settings**
   - Click **Settings** tab
   - Scroll to **Build and Deployment** section

4. **Configure Build Settings**
   - **Framework**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `Frontend`
   - **Root directory**: (leave empty)

5. **Environment Variables** (if needed)
   - None required for frontend (production URLs are hardcoded)

6. **Save and Deploy**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy automatically

### Option B: Reconnect GitHub Repo

If the Pages project isn't connected to GitHub:

1. In Pages dashboard, click **Connect a Git repository**
2. Select your GitHub account
3. Select `Stephen4123/version-3-frontend`
4. Configure build settings as shown above
5. Click **Save and Deploy**

## Build Configuration Summary

```
Framework: None
Build command: (none)
Build output directory: Frontend
Root directory: (none)
```

## What Gets Deployed

Your `Frontend/` directory will be deployed, which includes:
- ✅ `index.html` (home page)
- ✅ `Speeches.html`, `voice-hub.html`, etc. (static pages)
- ✅ `assets/js/` (all JavaScript with updated API endpoints)
- ✅ `assets/css/` (all stylesheets)
- ✅ `assets/images/` (images)

## Environment Routing

Your frontend will automatically use:
- **Development** (localhost): `http://localhost:3000/api/public`
- **Production** (jeevajyothimedia.com): `https://api.jeevajyothimedia.com/api/public`

*(Based on config in `Frontend/assets/js/config.js`)*

## Verify Deployment

After deployment completes:

1. **Check Status**
   - Go to https://jeevajyothimedia.com
   - Should load your homepage

2. **Test API Calls**
   ```bash
   # Open browser console (F12)
   # Try fetching data
   fetch('https://api.jeevajyothimedia.com/api/public/voices').then(r => r.json()).then(console.log)
   ```

3. **Check Production Logs**
   - In Pages dashboard → **Deployments**
   - Click latest deployment to see build logs
   - Check **Tail realtime logs** for any errors

## Troubleshooting

### 404 on Pages URL
- **Cause**: Build directory incorrect
- **Fix**: Ensure build output directory is `Frontend`

### API Calls Return 403 CORS Error
- **Cause**: Cloudflare Worker CORS headers
- **Fix**: Worker already configured with CORS headers

### Images/CSS Not Loading
- **Cause**: Relative path issues
- **Fix**: Check browser DevTools (F12) → Network tab
- Frontend uses relative paths, so should work fine

### Build Fails
- **Solution**: Check deployment logs in Pages dashboard
- Most likely: Wrong build output directory

## Quick Links

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://jeevajyothimedia.com | Deploy to Cloudflare Pages |
| Backend | https://jeevajyothi-backend.onrender.com | ✅ Live |
| Worker | https://api.jeevajyothimedia.com | ✅ Live |
| Dashboard | https://dash.cloudflare.com/524d0d02da6a48ed006aecd83eaaef18 | Login required |

## Environment Variables Reference

If you need environment variables later, add them in Pages Settings:

```
# Example (not needed for current setup)
VITE_API_URL=https://api.jeevajyothimedia.com
VITE_BACKEND_URL=https://jeevajyothi-backend.onrender.com
```

These would be referenced in code as: `process.env.VITE_API_URL`

## Final Checklist

- [ ] Logged into Cloudflare dashboard
- [ ] Navigated to jeevajyothimedia Pages project
- [ ] Set build output directory to `Frontend`
- [ ] Confirmed GitHub repo is connected
- [ ] Clicked "Save and Deploy"
- [ ] Waited for deployment to complete
- [ ] Tested https://jeevajyothimedia.com
- [ ] Verified API calls are working in browser console

## Support

If deployment fails:
1. Check deployment logs in Cloudflare Pages dashboard
2. Verify GitHub repo has all updates (run `git push` again)
3. Check that `Frontend/` directory has all required files
4. Ensure there are no typos in build settings
