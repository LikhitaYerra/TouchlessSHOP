# Netlify 404 Fix - Step by Step

## The Problem
React Router routes (like `/shop`, `/cart`) show 404 errors on Netlify because Netlify tries to find actual files/folders for those paths.

## The Solution
We need to tell Netlify to redirect ALL routes to `index.html` so React Router can handle routing.

## ✅ What's Already Fixed

1. ✅ Created `public/_redirects` file
2. ✅ Updated `netlify.toml` with redirects
3. ✅ Added `homepage: "."` to package.json
4. ✅ Rebuilt the app

## 🚀 How to Deploy the Fix

### Method 1: Netlify Dashboard (Easiest)

1. **Go to Netlify Dashboard:**
   - Visit https://app.netlify.com
   - Find your TouchlessShop site

2. **Redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - OR drag and drop the `build` folder again

3. **Verify Settings:**
   - Go to **Site settings** → **Build & deploy**
   - **Publish directory:** Should be `build`
   - **Build command:** Should be `npm run build`

### Method 2: Netlify CLI

```bash
# Make sure you're in the project directory
cd /Users/likhitayerra/HCI

# Deploy to production
netlify deploy --prod --dir=build
```

### Method 3: Git Push (If connected to GitHub)

```bash
# Commit the fixes
git add public/_redirects netlify.toml package.json
git commit -m "Fix Netlify 404 - add React Router redirects"
git push

# Netlify will auto-deploy
```

## 🔍 Verify the Fix

After redeploying, test these URLs:
- `https://your-site.netlify.app/` ✅ Should work
- `https://your-site.netlify.app/shop` ✅ Should work (not 404)
- `https://your-site.netlify.app/cart` ✅ Should work (not 404)

## 📋 Files That Should Exist

1. **`public/_redirects`** - Contains: `/*    /index.html   200`
2. **`netlify.toml`** - Contains redirect configuration
3. **`build/_redirects`** - Should be copied during build
4. **`package.json`** - Should have `"homepage": "."`

## 🐛 If Still Not Working

### Check 1: Verify _redirects is in build folder
```bash
cat build/_redirects
```
Should show: `/*    /index.html   200`

### Check 2: Clear Netlify cache
- Go to Netlify Dashboard
- Site settings → Build & deploy → Clear cache and retry deploy

### Check 3: Check Netlify logs
- Go to Deploys tab
- Click on latest deploy
- Check for any errors

### Check 4: Manual redirects in Netlify
- Go to Site settings → Redirects
- Add redirect manually:
  - From: `/*`
  - To: `/index.html`
  - Status: `200`

## Alternative: Use HashRouter (If redirects don't work)

If redirects still don't work, we can switch to HashRouter which doesn't need server config:

```javascript
// In src/index.js, change:
import { HashRouter } from 'react-router-dom';

// Then routes will be: /#/shop, /#/cart
```

But try the redirects fix first - it's the proper solution.

---

**Current Status:** ✅ All files configured correctly, ready to redeploy

