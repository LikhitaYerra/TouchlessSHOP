import streamlit as st
import cv2
import numpy as np
import json
from typing import List, Dict, Tuple, Optional
import time

# Use OpenCV for hand detection (simpler, more reliable)
# We'll use skin color detection and contour analysis for gesture recognition
def detect_hand_region(frame):
    """Detect hand region using color-based segmentation"""
    # Convert to HSV color space
    hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
    
    # Define skin color range in HSV
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    # Create mask for skin color
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Apply morphological operations to remove noise
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Get the largest contour (likely the hand)
        largest_contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest_contour) > 5000:  # Minimum area threshold
            return largest_contour, mask
    return None, mask

# Product data
PRODUCTS = {
    "shoes": [
        {"id": 1, "name": "Running Shoes", "price": "$89.99", "image": "👟"},
        {"id": 2, "name": "Casual Sneakers", "price": "$69.99", "image": "👟"},
        {"id": 3, "name": "Basketball Shoes", "price": "$119.99", "image": "👟"},
        {"id": 4, "name": "Hiking Boots", "price": "$149.99", "image": "👢"},
    ],
    "electronics": [
        {"id": 5, "name": "Wireless Headphones", "price": "$79.99", "image": "🎧"},
        {"id": 6, "name": "Smart Watch", "price": "$199.99", "image": "⌚"},
        {"id": 7, "name": "Tablet", "price": "$299.99", "image": "📱"},
    ],
    "clothing": [
        {"id": 8, "name": "T-Shirt", "price": "$24.99", "image": "👕"},
        {"id": 9, "name": "Jeans", "price": "$49.99", "image": "👖"},
        {"id": 10, "name": "Jacket", "price": "$89.99", "image": "🧥"},
    ]
}

# Initialize session state
if 'cart' not in st.session_state:
    st.session_state.cart = []
if 'current_category' not in st.session_state:
    st.session_state.current_category = None
if 'current_product_index' not in st.session_state:
    st.session_state.current_product_index = 0
if 'last_gesture' not in st.session_state:
    st.session_state.last_gesture = None
if 'last_gesture_time' not in st.session_state:
    st.session_state.last_gesture_time = 0
if 'voice_command' not in st.session_state:
    st.session_state.voice_command = ""
if 'gesture_history' not in st.session_state:
    st.session_state.gesture_history = []


def detect_gesture(contour, frame_shape) -> Optional[str]:
    """
    Detect gestures from hand contour.
    Returns: 'swipe_left', 'swipe_right', 'open_palm', 'thumbs_up', or None
    """
    if contour is None:
        return None
    
    # Get bounding box and center
    x, y, w, h = cv2.boundingRect(contour)
    center_x = x + w // 2
    center_y = y + h // 2
    
    # Normalize coordinates (0-1 range)
    frame_width, frame_height = frame_shape[1], frame_shape[0]
    normalized_x = center_x / frame_width
    normalized_y = center_y / frame_height
    
    # Swipe detection: track horizontal movement
    if len(st.session_state.gesture_history) > 0:
        prev_x = st.session_state.gesture_history[-1]
        curr_x = normalized_x
        
        # Swipe left: moving left (x decreasing)
        if curr_x < prev_x - 0.1:
            st.session_state.gesture_history.append(normalized_x)
            if len(st.session_state.gesture_history) > 5:
                st.session_state.gesture_history.pop(0)
            return 'swipe_left'
        # Swipe right: moving right (x increasing)
        elif curr_x > prev_x + 0.1:
            st.session_state.gesture_history.append(normalized_x)
            if len(st.session_state.gesture_history) > 5:
                st.session_state.gesture_history.pop(0)
            return 'swipe_right'
    
    # Update gesture history
    st.session_state.gesture_history.append(normalized_x)
    if len(st.session_state.gesture_history) > 5:
        st.session_state.gesture_history.pop(0)
    
    # Detect fingers using convex hull defects
    hull = cv2.convexHull(contour, returnPoints=False)
    if len(hull) > 3:
        defects = cv2.convexityDefects(contour, hull)
        if defects is not None:
            finger_count = 0
            for i in range(defects.shape[0]):
                s, e, f, d = defects[i, 0]
                start = tuple(contour[s][0])
                end = tuple(contour[e][0])
                far = tuple(contour[f][0])
                
                # Calculate angle
                a = np.sqrt((end[0] - start[0])**2 + (end[1] - start[1])**2)
                b = np.sqrt((far[0] - start[0])**2 + (far[1] - start[1])**2)
                c = np.sqrt((end[0] - far[0])**2 + (end[1] - far[1])**2)
                angle = np.arccos((b**2 + c**2 - a**2) / (2 * b * c))
                
                # If angle is less than 90 degrees, it's likely a finger
                if angle <= np.pi / 2 and d > 10000:
                    finger_count += 1
            
            # Open palm: 4-5 fingers detected
            if finger_count >= 4:
                return 'open_palm'
            # Thumbs up: 1-2 fingers (thumb extended)
            elif finger_count <= 2 and h > w * 1.2:  # Hand is vertical
                return 'thumbs_up'
    
    # Simple area-based detection as fallback
    area = cv2.contourArea(contour)
    aspect_ratio = h / w if w > 0 else 0
    
    # Open palm: large area, wider shape
    if area > 15000 and aspect_ratio < 1.2:
        return 'open_palm'
    # Thumbs up: smaller area, taller shape
    elif area > 8000 and aspect_ratio > 1.3:
        return 'thumbs_up'
    
    return None


def process_voice_command(command: str):
    """Process voice commands"""
    command_lower = command.lower().strip()
    
    if "show shoes" in command_lower or "shoes" in command_lower:
        st.session_state.current_category = "shoes"
        st.session_state.current_product_index = 0
        st.session_state.voice_command = "Category: Shoes"
    elif "show electronics" in command_lower or "electronics" in command_lower:
        st.session_state.current_category = "electronics"
        st.session_state.current_product_index = 0
        st.session_state.voice_command = "Category: Electronics"
    elif "show clothing" in command_lower or "clothing" in command_lower:
        st.session_state.current_category = "clothing"
        st.session_state.current_product_index = 0
        st.session_state.voice_command = "Category: Clothing"
    elif "next product" in command_lower or "next" in command_lower:
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            st.session_state.current_product_index = (
                (st.session_state.current_product_index + 1) % len(products)
            )
            st.session_state.voice_command = "Next product"
    elif "add to cart" in command_lower or "add" in command_lower:
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            product = products[st.session_state.current_product_index]
            if product not in st.session_state.cart:
                st.session_state.cart.append(product)
                st.session_state.voice_command = f"Added: {product['name']}"
    elif "checkout" in command_lower:
        st.session_state.voice_command = "Proceeding to checkout..."
    elif "clear cart" in command_lower:
        st.session_state.cart = []
        st.session_state.voice_command = "Cart cleared"


def process_gesture(gesture: str):
    """Process gesture commands"""
    if not gesture:
        return
    
    current_time = time.time()
    # Debounce gestures (prevent rapid repeats)
    if current_time - st.session_state.last_gesture_time < 0.5:
        return
    
    st.session_state.last_gesture_time = current_time
    
    if gesture == 'swipe_left':
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            st.session_state.current_product_index = (
                (st.session_state.current_product_index - 1) % len(products)
            )
            st.session_state.last_gesture = "← Swipe Left: Previous product"
    elif gesture == 'swipe_right':
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            st.session_state.current_product_index = (
                (st.session_state.current_product_index + 1) % len(products)
            )
            st.session_state.last_gesture = "→ Swipe Right: Next product"
    elif gesture == 'open_palm':
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            product = products[st.session_state.current_product_index]
            if product not in st.session_state.cart:
                st.session_state.cart.append(product)
                st.session_state.last_gesture = f"✋ Open Palm: Added {product['name']}"
    elif gesture == 'thumbs_up':
        if st.session_state.current_category:
            products = PRODUCTS[st.session_state.current_category]
            product = products[st.session_state.current_product_index]
            st.session_state.last_gesture = f"👍 Thumbs Up: Liked {product['name']}"


# Streamlit UI
st.set_page_config(
    page_title="TouchlessShop",
    page_icon="🛒",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for professional UI
st.markdown("""
<style>
    /* Main theme colors */
    :root {
        --primary-color: #6366f1;
        --secondary-color: #8b5cf6;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --danger-color: #ef4444;
        --dark-bg: #1e293b;
        --light-bg: #f8fafc;
        --card-bg: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
    }
    
    /* Hide Streamlit default elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Main container */
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    
    /* Professional header */
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .main-header h1 {
        color: white;
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        text-align: center;
    }
    
    .main-header p {
        color: rgba(255,255,255,0.9);
        text-align: center;
        margin-top: 0.5rem;
        font-size: 1.1rem;
    }
    
    /* Product cards */
    .product-card {
        background: white;
        border-radius: 15px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        margin-bottom: 1rem;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }
    
    .product-image {
        font-size: 5rem;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .product-name {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
    }
    
    .product-price {
        font-size: 1.8rem;
        font-weight: 700;
        color: #6366f1;
        margin: 1rem 0;
    }
    
    /* Status indicators */
    .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0.25rem;
    }
    
    .status-voice {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .status-gesture {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
    }
    
    /* Buttons */
    .stButton > button {
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.3s ease;
        border: none;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    /* Sidebar styling */
    .css-1d391kg {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }
    
    /* Cart items */
    .cart-item {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 0.5rem;
        border-left: 4px solid #6366f1;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    /* Camera feed container */
    .camera-container {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        margin-bottom: 1rem;
    }
    
    /* Section headers */
    .section-header {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #6366f1;
    }
    
    /* Info boxes */
    .info-box {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 4px solid #0ea5e9;
        margin: 1rem 0;
    }
    
    /* Category buttons */
    .category-btn {
        width: 100%;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# Professional Header
st.markdown("""
<div class="main-header">
    <h1>🛒 TouchlessShop</h1>
    <p>Multimodal Voice & Gesture-Based E-Commerce Interface</p>
</div>
""", unsafe_allow_html=True)

# Professional Sidebar
with st.sidebar:
    st.markdown("""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
        <h2 style="color: white; margin: 0; font-size: 1.3rem;">🎤 Voice Commands</h2>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <p style="margin: 0.5rem 0;"><strong>"Show shoes"</strong> - Display category</p>
        <p style="margin: 0.5rem 0;"><strong>"Show electronics"</strong> - Display category</p>
        <p style="margin: 0.5rem 0;"><strong>"Show clothing"</strong> - Display category</p>
        <p style="margin: 0.5rem 0;"><strong>"Next product"</strong> - Browse forward</p>
        <p style="margin: 0.5rem 0;"><strong>"Add to cart"</strong> - Add item</p>
        <p style="margin: 0.5rem 0;"><strong>"Checkout"</strong> - Complete purchase</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
        <h2 style="color: white; margin: 0; font-size: 1.3rem;">✋ Hand Gestures</h2>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <p style="margin: 0.5rem 0;"><strong>← Swipe Left</strong> - Previous product</p>
        <p style="margin: 0.5rem 0;"><strong>→ Swipe Right</strong> - Next product</p>
        <p style="margin: 0.5rem 0;"><strong>✋ Open Palm</strong> - Add to cart</p>
        <p style="margin: 0.5rem 0;"><strong>👍 Thumbs Up</strong> - Like product</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Voice input section
    st.markdown("""
    <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 1.5rem;">
        <h3 style="color: #1e293b; margin-top: 0;">🎙️ Voice Input</h3>
    </div>
    """, unsafe_allow_html=True)
    
    voice_input = st.text_input("Enter command:", key="voice_input", placeholder="e.g., 'Show shoes'")
    if st.button("🎤 Process Command", use_container_width=True) and voice_input:
        process_voice_command(voice_input)
        st.rerun()
    
    # Status display
    st.markdown("""
    <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-top: 1.5rem;">
        <h3 style="color: #1e293b; margin-top: 0;">📊 System Status</h3>
    </div>
    """, unsafe_allow_html=True)
    
    if st.session_state.voice_command:
        st.markdown(f"""
        <div class="status-badge status-voice">
            🎤 Voice: {st.session_state.voice_command}
        </div>
        """, unsafe_allow_html=True)
    
    if st.session_state.last_gesture:
        st.markdown(f"""
        <div class="status-badge status-gesture">
            ✋ {st.session_state.last_gesture}
        </div>
        """, unsafe_allow_html=True)
    
    if not st.session_state.voice_command and not st.session_state.last_gesture:
        st.info("👆 Start using voice or gestures to see status")

# Main content area
col1, col2 = st.columns([1.5, 1])

with col1:
    st.markdown('<div class="section-header">📹 Gesture Recognition Camera</div>', unsafe_allow_html=True)
    
    # Camera input with professional styling
    camera_input = st.camera_input("Position your hand in front of the camera", key="camera")
    
    if camera_input is not None:
        # Convert to OpenCV format
        bytes_data = camera_input.getvalue()
        cv_image = cv2.imdecode(np.frombuffer(bytes_data, np.uint8), cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        
        # Detect hand using OpenCV
        hand_contour, mask = detect_hand_region(rgb_image)
        
        # Draw hand detection with professional styling
        annotated_image = rgb_image.copy()
        gesture_detected = None
        
        if hand_contour is not None:
            # Draw contour
            cv2.drawContours(annotated_image, [hand_contour], -1, (99, 102, 241), 3)
            
            # Draw bounding box
            x, y, w, h = cv2.boundingRect(hand_contour)
            cv2.rectangle(annotated_image, (x, y), (x + w, y + h), (139, 92, 246), 2)
            
            # Draw center point
            center_x = x + w // 2
            center_y = y + h // 2
            cv2.circle(annotated_image, (center_x, center_y), 8, (10, 185, 129), -1)
            
            # Detect gesture
            gesture = detect_gesture(hand_contour, rgb_image.shape)
            if gesture:
                gesture_detected = gesture
                process_gesture(gesture)
        
        # Display annotated image in styled container
        st.markdown('<div class="camera-container">', unsafe_allow_html=True)
        st.image(annotated_image, channels="RGB", use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Show detected gesture with professional styling
        if gesture_detected:
            gesture_name = gesture_detected.replace('_', ' ').title()
            if gesture_detected == 'swipe_left':
                icon = "←"
                color = "#3b82f6"
            elif gesture_detected == 'swipe_right':
                icon = "→"
                color = "#3b82f6"
            elif gesture_detected == 'open_palm':
                icon = "✋"
                color = "#10b981"
            elif gesture_detected == 'thumbs_up':
                icon = "👍"
                color = "#f59e0b"
            else:
                icon = "✋"
                color = "#6366f1"
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, {color}15 0%, {color}25 100%); 
                        padding: 1rem; border-radius: 10px; border-left: 4px solid {color};
                        margin-top: 1rem;">
                <h4 style="color: {color}; margin: 0;">
                    {icon} <strong>Gesture Detected:</strong> {gesture_name}
                </h4>
            </div>
            """, unsafe_allow_html=True)
        else:
            if hand_contour is not None:
                st.markdown("""
                <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; margin-top: 1rem; text-align: center;">
                    <p style="color: #64748b; margin: 0;">👋 Hand detected! Try swiping or showing gestures</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; margin-top: 1rem; text-align: center;">
                    <p style="color: #64748b; margin: 0;">👋 Show your hand to the camera to detect gestures</p>
                </div>
                """, unsafe_allow_html=True)

with col2:
    st.markdown('<div class="section-header">🛍️ Product Display</div>', unsafe_allow_html=True)
    
    if st.session_state.current_category:
        products = PRODUCTS[st.session_state.current_category]
        product = products[st.session_state.current_product_index]
        
        # Professional product card
        st.markdown(f"""
        <div class="product-card">
            <div class="product-image">{product['image']}</div>
            <div class="product-name">{product['name']}</div>
            <div class="product-price">{product['price']}</div>
            <div style="color: #64748b; margin-bottom: 1rem;">
                <strong>Category:</strong> {st.session_state.current_category.title()}<br>
                <strong>Item:</strong> {st.session_state.current_product_index + 1} of {len(products)}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Navigation controls
        st.markdown("### Navigation Controls")
        nav_col1, nav_col2 = st.columns(2)
        with nav_col1:
            if st.button("← Previous", use_container_width=True):
                st.session_state.current_product_index = (
                    (st.session_state.current_product_index - 1) % len(products)
                )
                st.rerun()
        with nav_col2:
            if st.button("Next →", use_container_width=True):
                st.session_state.current_product_index = (
                    (st.session_state.current_product_index + 1) % len(products)
                )
                st.rerun()
        
        # Add to cart button
        if st.button("🛒 Add to Cart", use_container_width=True, type="primary"):
            if product not in st.session_state.cart:
                st.session_state.cart.append(product)
                st.success(f"✅ Added {product['name']} to cart!")
                st.rerun()
    else:
        # Welcome screen with category selection
        st.markdown("""
        <div class="info-box">
            <h4 style="margin-top: 0; color: #0ea5e9;">👋 Welcome to TouchlessShop</h4>
            <p style="color: #64748b; margin-bottom: 0;">
                Use voice commands or select a category below to start shopping.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### Browse Categories")
        
        # Professional category buttons
        if st.button("👟 Shoes Collection", use_container_width=True, key="cat_shoes"):
            st.session_state.current_category = "shoes"
            st.session_state.current_product_index = 0
            st.rerun()
        
        if st.button("🎧 Electronics", use_container_width=True, key="cat_electronics"):
            st.session_state.current_category = "electronics"
            st.session_state.current_product_index = 0
            st.rerun()
        
        if st.button("👕 Clothing", use_container_width=True, key="cat_clothing"):
            st.session_state.current_category = "clothing"
            st.session_state.current_product_index = 0
            st.rerun()

# Professional Cart Section
st.markdown("---")
st.markdown('<div class="section-header">🛒 Shopping Cart</div>', unsafe_allow_html=True)

if st.session_state.cart:
    # Cart items with professional styling
    for i, item in enumerate(st.session_state.cart):
        st.markdown(f"""
        <div class="cart-item">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">{item['image']}</span>
                    <div>
                        <strong style="color: #1e293b; font-size: 1.1rem;">{item['name']}</strong>
                        <div style="color: #6366f1; font-weight: 600; font-size: 1.2rem;">{item['price']}</div>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Remove button
        if st.button("🗑️ Remove", key=f"remove_{i}", use_container_width=True):
            st.session_state.cart.pop(i)
            st.rerun()
    
    # Cart summary
    total_price = sum(float(item['price'].replace('$', '')) for item in st.session_state.cart)
    
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
                padding: 1.5rem; border-radius: 15px; margin: 1.5rem 0;
                border: 2px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="color: #64748b; font-size: 1.1rem;"><strong>Total Items:</strong></span>
            <span style="color: #1e293b; font-size: 1.3rem; font-weight: 700;">{len(st.session_state.cart)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid #e2e8f0;">
            <span style="color: #1e293b; font-size: 1.3rem; font-weight: 700;">Total Price:</span>
            <span style="color: #6366f1; font-size: 2rem; font-weight: 700;">${total_price:.2f}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Checkout button
    if st.button("🛒 Proceed to Checkout", type="primary", use_container_width=True):
        st.balloons()
        st.success("✅ Checkout complete! Thank you for shopping with TouchlessShop! (Demo mode)")
        st.session_state.cart = []
        st.rerun()
else:
    # Empty cart message
    st.markdown("""
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                padding: 3rem; border-radius: 15px; text-align: center; margin: 2rem 0;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
        <h3 style="color: #1e293b; margin-bottom: 0.5rem;">Your cart is empty</h3>
        <p style="color: #64748b; margin: 0;">
            Use voice commands or hand gestures to add items to your cart!
        </p>
    </div>
    """, unsafe_allow_html=True)

# Professional Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; padding: 2rem; color: #64748b;">
    <p style="margin: 0.5rem 0; font-size: 1.1rem;">
        <strong style="color: #1e293b;">TouchlessShop</strong> - Multimodal HCI Interface
    </p>
    <p style="margin: 0.5rem 0; font-size: 0.9rem;">
        Voice Commands + Hand Gestures | Professional E-Commerce Experience
    </p>
</div>
""", unsafe_allow_html=True)

