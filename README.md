# 🛒 TouchlessShop: Multimodal Voice & Gesture-Based E-Commerce Interface

A touch-free shopping interface that combines **voice commands** and **hand gestures** for an innovative HCI experience.

## 🎯 Features

- **Voice Commands**: Navigate and control the interface using natural speech
- **Hand Gestures**: Browse products and interact using MediaPipe hand detection
- **Multimodal Interaction**: Combines two AI-based HCI techniques for robust control
- **Touch-Free**: Perfect for public kiosks, smart TVs, and hygiene-sensitive environments

## 🎤 Voice Commands

| Command | Action |
|---------|--------|
| "Show shoes" | Display shoes category |
| "Show electronics" | Display electronics category |
| "Show clothing" | Display clothing category |
| "Next product" | Move to next product |
| "Add to cart" | Add selected item to cart |
| "Checkout" | Proceed to checkout |

## ✋ Hand Gestures

| Gesture | Action |
|---------|--------|
| **Swipe Left/Right** | Browse products (previous/next) |
| **Open Palm** | Add current product to cart |
| **Thumbs Up** | Like/save current product |

## 🛠 Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   streamlit run app.py
   ```

4. **Open your browser** to the URL shown (typically `http://localhost:8501`)

## 🚀 Usage

1. **Allow camera access** when prompted
2. **Show your hand** to the camera for gesture detection
3. **Use voice commands** via the sidebar input (or integrate Web Speech API)
4. **Navigate products** using gestures or voice
5. **Add items to cart** with open palm gesture or "Add to cart" command

## 🧠 AI Techniques Used

- **MediaPipe Hands**: Real-time hand landmark detection and gesture recognition
- **Speech Recognition**: Voice command processing (Web Speech API compatible)

## 📋 System Workflow

```
User (Voice / Hand)
   ↓
Microphone / Webcam
   ↓
Speech Recognition / Gesture Detection
   ↓
Command Interpretation
   ↓
UI Action (Browse / Add / Checkout)
```

## ⚠️ Notes

- **Camera Required**: The app needs camera access for gesture detection
- **Browser Compatibility**: Works best in Chrome/Edge for camera access
- **Voice Input**: Currently uses text input for demo. For real voice recognition, integrate Web Speech API in a web version
- **Gesture Sensitivity**: Gesture detection may need calibration based on lighting and camera quality

## 🎓 Academic Use

This project demonstrates:
- Multimodal HCI interaction design
- AI-based gesture recognition
- Voice command processing
- Touch-free interface design
- Accessibility considerations

## 🔧 Future Enhancements

- Real-time Web Speech API integration
- More gesture types (pinch, wave, etc.)
- Product image display
- Payment integration
- User preferences and history

## 📝 License

Educational use - HCI Project Demo

---

**Built for HCI Course** | Multimodal Interaction Design

