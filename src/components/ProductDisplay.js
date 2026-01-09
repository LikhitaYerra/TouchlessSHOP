import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ProductDisplay.css';
import { PRODUCTS } from '../data/products';
import Scene3D from './Scene3D';
import { smartExtract } from '../utils/productExtractor';

const ProductDisplay = ({ category, productIndex, onCategorySelect, onProductIndexChange, cart, setCart }) => {
  const product = category ? PRODUCTS[category]?.[productIndex] : null;
  const [viewMode, setViewMode] = useState('2D'); // '2D' or '3D'
  const [extractedAttributes, setExtractedAttributes] = useState({ sizes: [], colors: [] });
  const [isExtracting, setIsExtracting] = useState(false);

  const handleAddToCart = () => {
    if (product && !cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
    }
  };

  // Extract attributes when product changes using LLM
  useEffect(() => {
    if (product) {
      setIsExtracting(true);
      
      // Add a small delay to show the extraction animation
      const timeoutId = setTimeout(() => {
        smartExtract({ ...product, category })
          .then(attributes => {
            setExtractedAttributes(attributes);
            setIsExtracting(false);
          })
          .catch(error => {
            console.error('LLM extraction error:', error);
            setIsExtracting(false);
            // Use existing product data as fallback
            setExtractedAttributes({
              sizes: product.sizes || [],
              colors: product.colors || []
            });
          });
      }, 300); // Small delay for UX

      return () => clearTimeout(timeoutId);
    } else {
      setExtractedAttributes({ sizes: [], colors: [] });
    }
  }, [product, category]);

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
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('2D')}
              className={`view-btn ${viewMode === '2D' ? 'active' : ''}`}
            >
              📷 2D View
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`view-btn ${viewMode === '3D' ? 'active' : ''}`}
              disabled={!product.model3D}
              title={!product.model3D ? '3D model not available for this product' : 'View 3D model'}
            >
              🎮 3D View
            </button>
          </div>

          {/* 2D Image View */}
          {viewMode === '2D' && (
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
          )}

          {/* 3D Model View */}
          {viewMode === '3D' && (
            <div className="product-3d-container">
              <Scene3D product={product} isVisible={true} />
            </div>
          )}
          
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
            
            {(product.sizes || extractedAttributes.sizes.length > 0) && (
              <div className="product-sizes">
                <label className="size-label">
                  Size: 
                  {isExtracting && (
                    <span className="extracting-badge">
                      <span className="spinner-small"></span> AI Extracting...
                    </span>
                  )}
                  {!isExtracting && (!product.sizes || product.sizes.length === 0) && extractedAttributes.sizes.length > 0 && (
                    <span className="extracted-badge">✨ AI Extracted</span>
                  )}
                </label>
                <div className="sizes-grid">
                  {(product.sizes || extractedAttributes.sizes).map(size => (
                    <button key={size} className="size-button">{size}</button>
                  ))}
                </div>
              </div>
            )}
            
            {(product.colors || extractedAttributes.colors.length > 0) && (
              <div className="product-colors">
                <label className="color-label">
                  Color:
                  {isExtracting && (
                    <span className="extracting-badge">
                      <span className="spinner-small"></span> AI Extracting...
                    </span>
                  )}
                  {!isExtracting && (!product.colors || product.colors.length === 0) && extractedAttributes.colors.length > 0 && (
                    <span className="extracted-badge">✨ AI Extracted</span>
                  )}
                </label>
                <div className="colors-grid">
                  {(product.colors || extractedAttributes.colors).map(color => {
                    // Map color names to hex values
                    const colorMap = {
                      'black': '#000000',
                      'white': '#ffffff',
                      'blue': '#0000ff',
                      'red': '#ff0000',
                      'gray': '#808080',
                      'grey': '#808080',
                      'navy': '#000080',
                      'brown': '#a52a2a',
                      'green': '#008000',
                      'yellow': '#ffff00',
                      'orange': '#ffa500',
                      'pink': '#ffc0cb',
                      'purple': '#800080',
                      'beige': '#f5f5dc',
                      'tan': '#d2b48c',
                      'khaki': '#c3b091',
                      'olive': '#808000',
                      'maroon': '#800000',
                      'burgundy': '#800020',
                      'teal': '#008080',
                      'cyan': '#00ffff',
                      'magenta': '#ff00ff'
                    };
                    const colorLower = color.toLowerCase();
                    const bgColor = colorMap[colorLower] || colorLower;
                    
                    return (
                      <button 
                        key={color} 
                        className="color-button" 
                        style={{ 
                          backgroundColor: bgColor,
                          border: bgColor === '#ffffff' ? '2px solid #ccc' : 'none'
                        }}
                      >
                        <span className="color-name">{color}</span>
                      </button>
                    );
                  })}
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
