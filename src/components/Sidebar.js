import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';

const Sidebar = ({ voiceCommand, lastGesture, processVoiceCommand, isListening, setIsListening }) => {
  const [voiceInput, setVoiceInput] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript;
        processVoiceCommand(command);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still listening
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    }
  }, [isListening, processVoiceCommand, setIsListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        alert('Could not start speech recognition. Please check microphone permissions.');
      }
    }
  };

  const handleManualCommand = () => {
    if (voiceInput.trim()) {
      processVoiceCommand(voiceInput);
      setVoiceInput('');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="section-header-voice">
          <h2>🎤 Voice Commands</h2>
        </div>
        <div className="command-list">
          <p><strong>"Show shoes"</strong> - Display category</p>
          <p><strong>"Show electronics"</strong> - Display category</p>
          <p><strong>"Show clothing"</strong> - Display category</p>
          <p><strong>"Next product"</strong> - Browse forward</p>
          <p><strong>"Add to cart"</strong> - Add item</p>
          <p><strong>"Checkout"</strong> - Complete purchase</p>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header-gesture">
          <h2>✋ Hand Gestures</h2>
        </div>
        <div className="command-list">
          <p><strong>👈 Point Left</strong> - Previous product</p>
          <p><strong>👉 Point Right</strong> - Next product</p>
          <p><strong>✋ Open Palm</strong> - Add to cart</p>
          <p><strong>👍 Thumbs Up</strong> - Like product</p>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header-input">
          <h3>🎙️ Voice Input</h3>
        </div>
        <div className="voice-controls">
          <input
            type="text"
            value={voiceInput}
            onChange={(e) => setVoiceInput(e.target.value)}
            placeholder="e.g., 'Show shoes'"
            className="voice-input"
            onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
          />
          <button
            onClick={handleManualCommand}
            className="btn-process"
          >
            🎤 Process Command
          </button>
          <button
            onClick={toggleListening}
            className={`btn-listen ${isListening ? 'listening' : ''}`}
          >
            {isListening ? '⏹️ Stop Listening' : '🎙️ Start Listening'}
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header-status">
          <h3>📊 System Status</h3>
        </div>
        <div className="status-display">
          {voiceCommand && (
            <div className="status-badge status-voice">
              🎤 Voice: {voiceCommand}
            </div>
          )}
          {lastGesture && (
            <div className="status-badge status-gesture">
              ✋ {lastGesture}
            </div>
          )}
          {!voiceCommand && !lastGesture && (
            <p className="status-placeholder">👆 Start using voice or gestures to see status</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;





