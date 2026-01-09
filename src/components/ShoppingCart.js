import React from 'react';
import { motion } from 'framer-motion';
import './ShoppingCart.css';

const ShoppingCart = ({ cart, setCart, onCheckout }) => {
  const totalPrice = cart.reduce((sum, item) => {
    return sum + parseFloat(item.price.replace('$', '').replace(',', ''));
  }, 0);

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star">★</span>);
    }
    return stars;
  };

  return (
    <div className="shopping-cart-modern">
      <div className="cart-header">
        <div className="cart-header-content">
          <h3>🛒 Shopping Cart</h3>
          {cart.length > 0 && (
            <div className="cart-count-badge">
              <span className="cart-count-number">{cart.length}</span>
              <span className="cart-count-label">{cart.length === 1 ? 'item' : 'items'}</span>
            </div>
          )}
        </div>
      </div>
      
      {cart.length > 0 ? (
        <>
          <div className="cart-items-modern">
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="cart-item-modern"
              >
                <div className="cart-item-image-wrapper">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/120?text=No+Image';
                    }}
                  />
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <span className="cart-item-discount">
                      {Math.round((1 - parseFloat(item.price.replace('$', '').replace(',', '')) / parseFloat(item.originalPrice.replace('$', '').replace(',', ''))) * 100)}% OFF
                    </span>
                  )}
                </div>
                
                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <div className="cart-item-name">{item.name}</div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn-remove-modern"
                      aria-label="Remove item"
                    >
                      <span className="remove-icon">×</span>
                    </button>
                  </div>
                  
                  <div className="cart-item-brand">{item.brand}</div>
                  
                  {item.rating && (
                    <div className="cart-item-rating">
                      <div className="stars-container">
                        {renderStars(item.rating)}
                      </div>
                      <span className="cart-rating-text">{item.rating}</span>
                      <span className="cart-reviews-count">({item.reviews} reviews)</span>
                    </div>
                  )}
                  
                  {item.description && (
                    <div className="cart-item-description">{item.description}</div>
                  )}
                  
                  {item.sizes && (
                    <div className="cart-item-options">
                      <span className="option-label">Sizes:</span>
                      <div className="option-pills">
                        {item.sizes.slice(0, 4).map((size, idx) => (
                          <span key={idx} className="option-pill">{size}</span>
                        ))}
                        {item.sizes.length > 4 && (
                          <span className="option-pill">+{item.sizes.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {item.colors && (
                    <div className="cart-item-options">
                      <span className="option-label">Colors:</span>
                      <div className="option-pills">
                        {item.colors.slice(0, 3).map((color, idx) => (
                          <span key={idx} className="option-pill color-text">{color}</span>
                        ))}
                        {item.colors.length > 3 && (
                          <span className="option-pill">+{item.colors.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {item.features && (
                    <div className="cart-item-features">
                      {item.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="feature-badge">{feature}</span>
                      ))}
                      {item.features.length > 2 && (
                        <span className="feature-badge">+{item.features.length - 2} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="cart-item-price-section">
                    {item.originalPrice && item.originalPrice !== item.price && (
                      <span className="cart-item-original-price">{item.originalPrice}</span>
                    )}
                    <span className="cart-item-price">{item.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="cart-summary-modern">
            <div className="summary-line">
              <span className="summary-label">Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'}):</span>
              <span className="summary-value">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span className="summary-label">Shipping:</span>
              <span className="summary-value free-shipping">Free</span>
            </div>
            <div className="summary-line">
              <span className="summary-label">Tax (estimated):</span>
              <span className="summary-value">${(totalPrice * 0.08).toFixed(2)}</span>
            </div>
            <div className="summary-line total">
              <span className="summary-label">Total:</span>
              <span className="summary-value total-amount">${(totalPrice * 1.08).toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={onCheckout}
            className="btn-checkout-modern"
          >
            <span className="checkout-icon">💳</span>
            <span>Proceed to Checkout</span>
            <span className="checkout-arrow">→</span>
          </button>
        </>
      ) : (
        <div className="empty-cart-modern">
          <div className="empty-cart-illustration">
            <div className="empty-icon">🛒</div>
            <div className="empty-cart-animation"></div>
          </div>
          <h4>Your cart is empty</h4>
          <p>Add items using voice commands or hand gestures</p>
          <div className="empty-cart-tips">
            <div className="tip-item">
              <span className="tip-icon">🎤</span>
              <span>Say "add to cart"</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">✋</span>
              <span>Show open palm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
