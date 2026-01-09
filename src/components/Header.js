import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ cartItemCount = 0 }) => {
  const location = useLocation();

  const getLinkClass = (path) => {
    return `nav-link ${location.pathname === path ? 'active' : ''}`;
  };

  return (
    <header className="main-header">
      <Link to="/" className="header-logo">
        <h1>🛒 TouchlessShop</h1>
      </Link>
      <p>Multimodal Voice & Gesture-Based E-Commerce Interface</p>
      <nav className="main-nav">
        <Link to="/" className={getLinkClass('/')}>Home</Link>
        <Link to="/shop" className={getLinkClass('/shop')}>Shop</Link>
        <Link to="/cart" className={getLinkClass('/cart')}>
          Cart {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
        </Link>
      </nav>
    </header>
  );
};

export default Header;

