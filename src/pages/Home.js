import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">🛒 TouchlessShop</h1>
        <p className="home-subtitle">Shop with Voice & Gestures</p>
        <p className="home-description">
          Experience the future of shopping with touch-free interaction. 
          Browse products, add to cart, and checkout using just your voice and hand gestures.
        </p>
        <div className="home-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/shop')}
          >
            Start Shopping
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/cart')}
          >
            View Cart
          </button>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🎤</div>
          <h3>Voice Commands</h3>
          <p>Control everything with your voice. Say "show shoes" or "add to cart" to navigate.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👋</div>
          <h3>Hand Gestures</h3>
          <p>Use natural hand movements to browse products and interact with the interface.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎮</div>
          <h3>3D View</h3>
          <p>View products in stunning 3D. Rotate and zoom to see every detail.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Fast & Easy</h3>
          <p>No touching required. Shop hands-free with intuitive voice and gesture controls.</p>
        </div>
      </div>

      <div className="home-instructions">
        <h2>How It Works</h2>
        <div className="instructions-grid">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <h4>Allow Camera Access</h4>
            <p>Grant camera permissions to enable gesture detection</p>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <h4>Use Voice Commands</h4>
            <p>Say "show shoes", "show electronics", or "show clothing" to browse</p>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <h4>Navigate with Gestures</h4>
            <p>Swipe left/right to change products, open palm to add to cart</p>
          </div>
          <div className="instruction-step">
            <div className="step-number">4</div>
            <h4>Checkout</h4>
            <p>Review your cart and complete your purchase</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;





