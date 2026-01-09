import React from 'react';
import { motion } from 'framer-motion';
import './ShoppingCart.css';

const ShoppingCart = ({ cart, setCart, onCheckout }) => {
  const totalPrice = cart.reduce((sum, item) => {
    return sum + parseFloat(item.price.replace('$', ''));
  }, 0);

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  return (
    <div className="shopping-cart-modern">
      <div className="cart-header">
        <h3>🛒 Shopping Cart</h3>
        {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
      </div>
      
      {cart.length > 0 ? (
        <>
          <div className="cart-items-modern">
            {cart.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="cart-item-modern"
              >
                <div className="cart-item-image-container">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="cart-item-image-fallback" style={{ display: 'none' }}>
                    {item.name.charAt(0)}
                  </div>
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-brand">{item.brand}</div>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{item.price}</div>
                  {item.rating && (
                    <div className="cart-item-rating">
                      <span className="cart-rating-stars">★</span>
                      <span className="cart-rating-value">{item.rating}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="btn-remove-modern"
                  aria-label="Remove item"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
          
          <div className="cart-summary-modern">
            <div className="summary-line">
              <span>Items:</span>
              <strong>{cart.length}</strong>
            </div>
            <div className="summary-line">
              <span>Subtotal:</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>
            <div className="summary-line">
              <span>Shipping:</span>
              <strong>Free</strong>
            </div>
            <div className="summary-line total">
              <span>Total:</span>
              <strong className="total-amount">${totalPrice.toFixed(2)}</strong>
            </div>
          </div>
          
          <button
            onClick={onCheckout}
            className="btn-checkout-modern"
          >
            Proceed to Checkout
          </button>
        </>
      ) : (
        <div className="empty-cart-modern">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <p className="empty-hint">Add items using voice or gestures</p>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
