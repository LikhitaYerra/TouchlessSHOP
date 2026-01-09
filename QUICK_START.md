# 🚀 Quick Start Guide - React TouchlessShop

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0
- MediaPipe Hands
- React Scripts
- All required dependencies

### 2. Start Development Server

```bash
npm start
```

The app will automatically open at `http://localhost:3000`

### 3. Allow Permissions

When the app loads:
- **Camera Access**: Click "Allow" when prompted for camera access
- **Microphone Access**: Click "Allow" when prompted for microphone access (for voice commands)

## 🎯 How to Use

### Voice Commands

1. Click **"🎙️ Start Listening"** button in the sidebar
2. Say one of these commands:
   - "Show shoes"
   - "Show electronics"
   - "Show clothing"
   - "Next product"
   - "Add to cart"
   - "Checkout"

### Hand Gestures

1. Position your hand in front of the camera
2. Try these gestures:
   - **Swipe Left/Right** → Browse products
   - **Open Palm** → Add to cart
   - **Thumbs Up** → Like product

### Manual Controls

- Use category buttons to browse
- Use Previous/Next buttons to navigate
- Click "Add to Cart" button manually

## 🛠️ Troubleshooting

### Camera Not Working
- Make sure you granted camera permissions
- Try refreshing the page
- Check if another app is using the camera

### Voice Not Working
- Use Chrome or Edge browser (best support)
- Check microphone permissions
- Make sure you clicked "Start Listening"

### Gestures Not Detected
- Ensure good lighting
- Keep hand clearly visible
- Try moving hand closer/farther from camera

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🌐 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Web Speech API works best in Chrome/Edge

---

**Enjoy your touch-free shopping experience!** 🛒

