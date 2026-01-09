import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CameraFeed from '../components/CameraFeed';
import ProductDisplay from '../components/ProductDisplay';
import { PRODUCTS } from '../data/products';
import './Shop.css';

const Shop = ({ cart, setCart }) => {
  const navigate = useNavigate();
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
    } else if (commandLower.includes('go to cart') || commandLower.includes('cart')) {
      navigate('/cart');
    } else if (commandLower.includes('home') || commandLower.includes('main')) {
      navigate('/');
    }
  };

  const processGesture = (gesture) => {
    if (!gesture || !currentCategory) return;

    const products = PRODUCTS[currentCategory];

    switch (gesture) {
      case 'point_left':
        setCurrentProductIndex((prev) => (prev - 1 + products.length) % products.length);
        setLastGesture('👈 Point Left: Previous product');
        break;
      case 'point_right':
        setCurrentProductIndex((prev) => (prev + 1) % products.length);
        setLastGesture('👉 Point Right: Next product');
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
      case 'happy_emotion':
        const happyProduct = products[currentProductIndex];
        if (!cart.find(item => item.id === happyProduct.id)) {
          setCart([...cart, happyProduct]);
          setLastGesture(`😊 Happy Emotion: Added ${happyProduct.name} to cart!`);
        } else {
          setLastGesture(`😊 You already have ${happyProduct.name} in cart!`);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="shop-page">
      {/* Top row: Sidebar */}
      <div className="shop-top">
        <Sidebar
          voiceCommand={voiceCommand}
          lastGesture={lastGesture}
          processVoiceCommand={processVoiceCommand}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      </div>
      
      {/* Bottom row: Camera and Products side by side */}
      <div className="shop-bottom">
        <div className="shop-camera">
          <CameraFeed onGestureDetected={processGesture} />
        </div>
        <div className="shop-products">
          <ProductDisplay
            category={currentCategory}
            productIndex={currentProductIndex}
            onCategorySelect={setCurrentCategory}
            onProductIndexChange={setCurrentProductIndex}
            cart={cart}
            setCart={setCart}
          />
        </div>
      </div>
    </div>
  );
};

export default Shop;

