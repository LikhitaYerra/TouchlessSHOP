import React from 'react';
import { useNavigate } from 'react-router-dom';
import ShoppingCart from '../components/ShoppingCart';
import './Cart.css';

const Cart = ({ cart, setCart }) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.length > 0) {
      alert('Checkout complete! Thank you for shopping with TouchlessShop!');
      setCart([]);
      navigate('/');
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-header-section">
        <h1>Shopping Cart</h1>
        <p>Review your items before checkout</p>
      </div>
      <div className="cart-content">
        <ShoppingCart cart={cart} setCart={setCart} onCheckout={handleCheckout} />
      </div>
      <div className="cart-actions">
        <button 
          className="btn-back"
          onClick={() => navigate('/shop')}
        >
          ← Continue Shopping
        </button>
        <button 
          className="btn-home"
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>
      </div>
    </div>
  );
};

export default Cart;





