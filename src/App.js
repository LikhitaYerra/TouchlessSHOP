import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CameraFeed from './components/CameraFeed';
import ProductDisplay from './components/ProductDisplay';
import ShoppingCart from './components/ShoppingCart';
import { PRODUCTS } from './data/products';

function App() {
  const [cart, setCart] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [lastGesture, setLastGesture] = useState(null);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isListening, setIsListening] = useState(false);

  const processVoiceCommand = (command) => {
    const commandLower = command.toLowerCase().trim();
    
    if (commandLower.includes('show shoes') || commandLower.includes('shoes')) {
      setCurrentCategory('shoes');
      setCurrentProductIndex(0);
      setVoiceCommand('Category: Shoes');
    } else if (commandLower.includes('show electronics') || commandLower.includes('electronics')) {
      setCurrentCategory('electronics');
      setCurrentProductIndex(0);
      setVoiceCommand('Category: Electronics');
    } else if (commandLower.includes('show clothing') || commandLower.includes('clothing')) {
      setCurrentCategory('clothing');
      setCurrentProductIndex(0);
      setVoiceCommand('Category: Clothing');
    } else if (commandLower.includes('next product') || commandLower.includes('next')) {
      if (currentCategory) {
        const products = PRODUCTS[currentCategory];
        setCurrentProductIndex((prev) => (prev + 1) % products.length);
        setVoiceCommand('Next product');
      }
    } else if (commandLower.includes('add to cart') || commandLower.includes('add')) {
      if (currentCategory) {
        const products = PRODUCTS[currentCategory];
        const product = products[currentProductIndex];
        if (!cart.find(item => item.id === product.id)) {
          setCart([...cart, product]);
          setVoiceCommand(`Added: ${product.name}`);
        }
      }
    } else if (commandLower.includes('checkout')) {
      setVoiceCommand('Proceeding to checkout...');
    } else if (commandLower.includes('clear cart')) {
      setCart([]);
      setVoiceCommand('Cart cleared');
    }
  };

  const processGesture = (gesture) => {
    if (!gesture || !currentCategory) return;

    const products = PRODUCTS[currentCategory];

    switch (gesture) {
      case 'swipe_left':
        setCurrentProductIndex((prev) => (prev - 1 + products.length) % products.length);
        setLastGesture('← Swipe Left: Previous product');
        break;
      case 'swipe_right':
        setCurrentProductIndex((prev) => (prev + 1) % products.length);
        setLastGesture('→ Swipe Right: Next product');
        break;
      case 'open_palm':
        const product = products[currentProductIndex];
        if (!cart.find(item => item.id === product.id)) {
          setCart([...cart, product]);
          setLastGesture(`✋ Open Palm: Added ${product.name}`);
        }
        break;
      case 'thumbs_up':
        const likedProduct = products[currentProductIndex];
        setLastGesture(`👍 Thumbs Up: Liked ${likedProduct.name}`);
        break;
      default:
        break;
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      alert('Checkout complete! Thank you for shopping with TouchlessShop!');
      setCart([]);
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="app-container">
        <Sidebar
          voiceCommand={voiceCommand}
          lastGesture={lastGesture}
          processVoiceCommand={processVoiceCommand}
          isListening={isListening}
          setIsListening={setIsListening}
        />
        <div className="main-content">
          <div className="content-section">
            <CameraFeed onGestureDetected={processGesture} />
            <ProductDisplay
              category={currentCategory}
              productIndex={currentProductIndex}
              onCategorySelect={setCurrentCategory}
              onProductIndexChange={setCurrentProductIndex}
              cart={cart}
              setCart={setCart}
            />
          </div>
          <div className="content-section">
            <ShoppingCart cart={cart} setCart={setCart} onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

