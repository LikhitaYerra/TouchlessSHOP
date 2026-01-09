import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ParticleBackground from './components/ParticleBackground';
import FloatingOrbs from './components/FloatingOrbs';

function App() {
  const [cart, setCart] = useState([]);

  return (
    <div className="App">
      <FloatingOrbs />
      <ParticleBackground />
      <Header cartItemCount={cart.length} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop cart={cart} setCart={setCart} />} />
          <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
