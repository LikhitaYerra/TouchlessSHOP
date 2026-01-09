import React from 'react';
import { motion } from 'framer-motion';
import './ProductDisplay.css';
import { PRODUCTS } from '../data/products';

const ProductDisplay = ({ category, productIndex, onCategorySelect, onProductIndexChange, cart, setCart }) => {
  const product = category ? PRODUCTS[category]?.[productIndex] : null;

  const handleAddToCart = () => {
    if (product && !cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
    }
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
    <div className="product-display">
      {product ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="product-card-modern"
        >
          <div className="product-image-container">
            <img 
              src={product.image} 
              alt={product.name}
              className="product-image-large"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="product-image-fallback" style={{ display: 'none' }}>
              {product.name.charAt(0)}
            </div>
            {product.originalPrice && (
              <span className="discount-badge">
                {Math.round((1 - parseFloat(product.price.replace('$', '')) / parseFloat(product.originalPrice.replace('$', ''))) * 100)}% OFF
              </span>
            )}
          </div>
          
          <div className="product-details">
            <div className="product-brand">{product.brand}</div>
            <h2 className="product-name-modern">{product.name}</h2>
            
            <div className="product-rating">
              <div className="stars-container">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text">{product.rating}</span>
              <span className="reviews-count">({product.reviews.toLocaleString()} reviews)</span>
            </div>
            
            <div className="product-price-container">
              <div className="product-price-modern">{product.price}</div>
              {product.originalPrice && (
                <div className="product-price-original">{product.originalPrice}</div>
              )}
            </div>
            
            <p className="product-description">{product.description}</p>
            
            {product.sizes && (
              <div className="product-sizes">
                <label className="size-label">Size:</label>
                <div className="sizes-grid">
                  {product.sizes.map(size => (
                    <button key={size} className="size-button">{size}</button>
                  ))}
                </div>
              </div>
            )}
            
            {product.colors && (
              <div className="product-colors">
                <label className="color-label">Color:</label>
                <div className="colors-grid">
                  {product.colors.map(color => (
                    <button key={color} className="color-button" style={{ backgroundColor: color.toLowerCase() }}>
                      <span className="color-name">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {product.features && (
              <div className="product-features">
                <label className="features-label">Features:</label>
                <ul className="features-list">
                  {product.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="product-meta">
              <span className="category-badge">{category}</span>
              <span className="item-counter">{productIndex + 1} / {PRODUCTS[category].length}</span>
              {product.inStock ? (
                <span className="stock-badge in-stock">✓ In Stock</span>
              ) : (
                <span className="stock-badge out-of-stock">Out of Stock</span>
              )}
            </div>
          </div>
          
          <div className="product-actions">
            <div className="nav-buttons">
              <button
                onClick={() => onProductIndexChange((productIndex - 1 + PRODUCTS[category].length) % PRODUCTS[category].length)}
                className="btn-nav-modern"
                aria-label="Previous product"
              >
                ←
              </button>
              <button
                onClick={() => onProductIndexChange((productIndex + 1) % PRODUCTS[category].length)}
                className="btn-nav-modern"
                aria-label="Next product"
              >
                →
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="btn-add-modern"
              disabled={cart.find(item => item.id === product.id) || !product.inStock}
            >
              {cart.find(item => item.id === product.id) ? '✓ In Cart' : product.inStock ? '+ Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="welcome-modern">
          <div className="welcome-icon">🛒</div>
          <h2>Welcome to TouchlessShop</h2>
          <p>Select a category to start shopping</p>
          
          <div className="category-grid">
            <button
              onClick={() => onCategorySelect('shoes')}
              className="category-card"
            >
              <span className="category-icon">👟</span>
              <span className="category-name">Shoes</span>
              <span className="category-count">{PRODUCTS.shoes.length} items</span>
            </button>
            <button
              onClick={() => onCategorySelect('electronics')}
              className="category-card"
            >
              <span className="category-icon">🎧</span>
              <span className="category-name">Electronics</span>
              <span className="category-count">{PRODUCTS.electronics.length} items</span>
            </button>
            <button
              onClick={() => onCategorySelect('clothing')}
              className="category-card"
            >
              <span className="category-icon">👕</span>
              <span className="category-name">Clothing</span>
              <span className="category-count">{PRODUCTS.clothing.length} items</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;
