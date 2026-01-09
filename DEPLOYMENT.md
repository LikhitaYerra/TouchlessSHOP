# 🚀 Deployment Guide - TouchlessShop

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Or use Vercel Dashboard:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect React and deploy

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

3. **Or use Netlify Dashboard:**
   - Go to https://netlify.com
   - Drag and drop the `build` folder
   - Or connect GitHub repository

### Option 3: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "homepage": "https://yourusername.github.io/touchless-shop",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Option 4: Manual Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Serve locally to test:**
   ```bash
   npx serve -s build
   ```

3. **Upload `build` folder to any static hosting:**
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Any web server

## Important Notes

### Camera & Microphone Permissions
- **HTTPS Required:** Camera and microphone only work over HTTPS
- All deployment platforms provide HTTPS by default
- Local testing requires HTTPS (use `serve` with SSL or ngrok)

### Environment Variables
- No environment variables needed for basic deployment
- All processing is client-side

### Build Configuration
- Build output: `build/` folder
- Entry point: `public/index.html`
- Router: Uses React Router (configured for SPA)

## Deployment Checklist

- [ ] Build succeeds (`npm run build`)
- [ ] Test build locally (`npx serve -s build`)
- [ ] Verify HTTPS is enabled (required for camera/mic)
- [ ] Test camera permissions work
- [ ] Test microphone permissions work
- [ ] Verify all routes work (React Router)
- [ ] Check mobile responsiveness

## Troubleshooting

### Camera/Mic Not Working
- **Issue:** Requires HTTPS
- **Solution:** Ensure deployment uses HTTPS (all platforms do by default)

### Routes Not Working
- **Issue:** React Router needs server configuration
- **Solution:** Configure redirects (see `vercel.json` or `netlify.toml`)

### Build Errors
- **Issue:** Dependencies or code errors
- **Solution:** Fix errors locally first, then deploy

## Current Deployment Status

✅ Build folder ready  
✅ Vercel config created (`vercel.json`)  
✅ Netlify config created (`netlify.toml`)  
✅ Ready to deploy  

---

**Recommended:** Use Vercel for easiest deployment with automatic HTTPS and CDN.

