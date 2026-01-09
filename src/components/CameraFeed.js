import React, { useRef, useEffect, useState } from 'react';
import './CameraFeed.css';

const CameraFeed = ({ onGestureDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [motionLevel, setMotionLevel] = useState(0);
  const [fps, setFps] = useState(0);
  
  // Refs for motion detection
  const previousFrameRef = useRef(null);
  const handPositionRef = useRef({ x: 0, y: 0 });
  const lastGestureTimeRef = useRef(0);
  const motionHistoryRef = useRef([]);
  const trailRef = useRef([]);
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });
  const detectionSettingsRef = useRef({
    motionThreshold: 25,
    gestureThreshold: 40,
    debounceTime: 1200,
    minMotionPixels: 1500,
    smoothingFactor: 0.7
  });

  useEffect(() => {
    let isMounted = true;
    let animationFrameId = null;
    let stream = null;

    const initializeCamera = async () => {
      try {
        // Request higher quality camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          } 
        });
        
        if (!isMounted || !videoRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Play error:', playError);
        }
        
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
        }

        // Enhanced gesture detection with improved algorithms
        const detectGestures = () => {
          if (!isMounted || !videoRef.current || !canvasRef.current) {
            return;
          }
          
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            animationFrameId = requestAnimationFrame(detectGestures);
            return;
          }
          
          // Calculate FPS
          const now = Date.now();
          fpsRef.current.frames++;
          if (now - fpsRef.current.lastTime >= 1000) {
            setFps(fpsRef.current.frames);
            fpsRef.current.frames = 0;
            fpsRef.current.lastTime = now;
          }
          
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          try {
            // Draw video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get current frame data
            const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const currentData = currentFrame.data;
            
            // Enhanced motion detection with adaptive thresholding
            if (previousFrameRef.current) {
              const prevData = previousFrameRef.current.data;
              let motionSum = 0;
              let motionPixels = 0;
              const motionPoints = [];
              
              // Optimized frame comparison with adaptive sampling
              const sampleRate = 2; // Sample every 2nd pixel for performance
              for (let i = 0; i < currentData.length; i += 4 * sampleRate) {
                const rDiff = Math.abs(currentData[i] - prevData[i]);
                const gDiff = Math.abs(currentData[i + 1] - prevData[i + 1]);
                const bDiff = Math.abs(currentData[i + 2] - prevData[i + 2]);
                const diff = (rDiff + gDiff + bDiff) / 3;
                
                if (diff > detectionSettingsRef.current.motionThreshold) {
                  const pixelIndex = i / 4;
                  const x = pixelIndex % canvas.width;
                  const y = Math.floor(pixelIndex / canvas.width);
                  motionPoints.push({ x, y, intensity: diff });
                  motionSum += diff;
                  motionPixels++;
                }
              }
              
              const avgMotion = motionPixels > 0 ? motionSum / motionPixels : 0;
              const normalizedMotion = Math.min(100, (avgMotion / 100) * 100);
              
              // Update motion level with smoothing
              setMotionLevel(prev => prev * detectionSettingsRef.current.smoothingFactor + 
                normalizedMotion * (1 - detectionSettingsRef.current.smoothingFactor));
              
              // Track motion history for pattern recognition
              motionHistoryRef.current.push(normalizedMotion);
              if (motionHistoryRef.current.length > 30) {
                motionHistoryRef.current.shift();
              }
              
              // Detect hand position using centroid of motion
              if (motionPixels > detectionSettingsRef.current.minMotionPixels) {
                let sumX = 0, sumY = 0, totalWeight = 0;
                
                motionPoints.forEach(point => {
                  const weight = point.intensity;
                  sumX += point.x * weight;
                  sumY += point.y * weight;
                  totalWeight += weight;
                });
                
                if (totalWeight > 0) {
                  const centerX = sumX / totalWeight;
                  const centerY = sumY / totalWeight;
                  
                  // Smooth hand position
                  const prevPos = handPositionRef.current;
                  const smoothedX = prevPos.x * detectionSettingsRef.current.smoothingFactor + 
                    centerX * (1 - detectionSettingsRef.current.smoothingFactor);
                  const smoothedY = prevPos.y * detectionSettingsRef.current.smoothingFactor + 
                    centerY * (1 - detectionSettingsRef.current.smoothingFactor);
                  
                  const deltaX = smoothedX - prevPos.x;
                  const deltaY = smoothedY - prevPos.y;
                  const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                  
                  handPositionRef.current = { x: smoothedX, y: smoothedY };
                  
                  // Add to trail
                  trailRef.current.push({ x: smoothedX, y: smoothedY, time: Date.now() });
                  // Keep only last 20 points
                  trailRef.current = trailRef.current.filter(point => 
                    Date.now() - point.time < 1000
                  );
                  
                  // Enhanced gesture detection with velocity and direction
                  const currentTime = Date.now();
                  const timeSinceLastGesture = currentTime - lastGestureTimeRef.current;
                  
                  if (timeSinceLastGesture > detectionSettingsRef.current.debounceTime) {
                    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                    const absDeltaX = Math.abs(deltaX);
                    const absDeltaY = Math.abs(deltaY);
                    
                    // Swipe left (hand moving left with sufficient velocity)
                    if (deltaX < -detectionSettingsRef.current.gestureThreshold && 
                        absDeltaY < 25 && velocity > 5) {
                      onGestureDetected('swipe_left');
                      setDetectedGesture('← Swipe Left');
                      lastGestureTimeRef.current = currentTime;
                    }
                    // Swipe right (hand moving right with sufficient velocity)
                    else if (deltaX > detectionSettingsRef.current.gestureThreshold && 
                             absDeltaY < 25 && velocity > 5) {
                      onGestureDetected('swipe_right');
                      setDetectedGesture('→ Swipe Right');
                      lastGestureTimeRef.current = currentTime;
                    }
                    // Open palm (hand moving up with high motion)
                    else if (deltaY < -detectionSettingsRef.current.gestureThreshold && 
                             normalizedMotion > 50 && velocity > 4) {
                      onGestureDetected('open_palm');
                      setDetectedGesture('✋ Open Palm');
                      lastGestureTimeRef.current = currentTime;
                    }
                    // Thumbs up (hand moving down with motion)
                    else if (deltaY > detectionSettingsRef.current.gestureThreshold && 
                             normalizedMotion > 35 && velocity > 4) {
                      onGestureDetected('thumbs_up');
                      setDetectedGesture('👍 Thumbs Up');
                      lastGestureTimeRef.current = currentTime;
                    }
                  }
                  
                  // Enhanced visual feedback
                  ctx.save();
                  
                  // Draw motion trail
                  if (trailRef.current.length > 1) {
                    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    trailRef.current.forEach((point, index) => {
                      const alpha = index / trailRef.current.length;
                      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.6})`;
                      if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                      } else {
                        ctx.lineTo(point.x, point.y);
                      }
                    });
                    ctx.stroke();
                  }
                  
                  // Draw hand position with pulsing effect
                  const pulseSize = 15 + Math.sin(Date.now() / 200) * 5;
                  ctx.fillStyle = '#10b981';
                  ctx.beginPath();
                  ctx.arc(smoothedX, smoothedY, pulseSize, 0, 2 * Math.PI);
                  ctx.fill();
                  
                  // Draw outer ring
                  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.arc(smoothedX, smoothedY, pulseSize + 8, 0, 2 * Math.PI);
                  ctx.stroke();
                  
                  // Draw direction indicator
                  if (velocity > 2) {
                    ctx.strokeStyle = '#667eea';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(smoothedX, smoothedY);
                    ctx.lineTo(
                      smoothedX + deltaX * 2, 
                      smoothedY + deltaY * 2
                    );
                    ctx.stroke();
                    
                    // Draw arrowhead
                    const arrowLength = 15;
                    const arrowAngle = Math.atan2(deltaY, deltaX);
                    ctx.beginPath();
                    ctx.moveTo(
                      smoothedX + deltaX * 2, 
                      smoothedY + deltaY * 2
                    );
                    ctx.lineTo(
                      smoothedX + deltaX * 2 - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
                      smoothedY + deltaY * 2 - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
                    );
                    ctx.moveTo(
                      smoothedX + deltaX * 2, 
                      smoothedY + deltaY * 2
                    );
                    ctx.lineTo(
                      smoothedX + deltaX * 2 - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
                      smoothedY + deltaY * 2 - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
                    );
                    ctx.stroke();
                  }
                  
                  ctx.restore();
                }
              }
            }
            
            // Store current frame for next comparison
            previousFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
          } catch (drawError) {
            console.error('Draw error:', drawError);
          }
          
          if (isMounted) {
            animationFrameId = requestAnimationFrame(detectGestures);
          }
        };
        
        const startDetection = () => {
          if (isMounted && videoRef.current && canvasRef.current) {
            setTimeout(() => {
              detectGestures();
            }, 500);
          }
        };
        
        if (videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            startDetection();
          } else {
            videoRef.current.addEventListener('loadedmetadata', startDetection, { once: true });
            videoRef.current.addEventListener('playing', startDetection, { once: true });
          }
        }
        
      } catch (err) {
        console.error('Camera error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera access denied. Please allow camera permissions in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found. Please connect a camera device.');
          } else {
            setError('Failed to access camera. Please check your camera settings.');
          }
          setIsInitialized(false);
        }
      }
    };
    
    initializeCamera();
    
    return () => {
      isMounted = false;
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', () => {});
        videoRef.current.removeEventListener('playing', () => {});
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onGestureDetected]);

  // Clear detected gesture after 3 seconds
  useEffect(() => {
    if (detectedGesture) {
      const timer = setTimeout(() => {
        setDetectedGesture(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [detectedGesture]);

  return (
    <div className="camera-feed">
      <div className="camera-header">
        <div className="camera-title-section">
          <h3>📹 Gesture Camera</h3>
          {isInitialized && (
            <div className="camera-stats">
              <span className="stat-item">
                <span className="stat-label">FPS:</span>
                <span className="stat-value">{fps}</span>
              </span>
              <span className="stat-item">
                <span className="stat-label">Motion:</span>
                <span className="stat-value">{Math.round(motionLevel)}%</span>
              </span>
            </div>
          )}
        </div>
        {isInitialized && <span className="status-indicator active">● Live</span>}
      </div>
      
      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="camera-canvas"
        />
        
        {detectedGesture && (
          <div className="gesture-indicator">
            <div className="gesture-badge">{detectedGesture}</div>
          </div>
        )}
        
        {error && (
          <div className="camera-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        
        {!isInitialized && !error && (
          <div className="camera-loading">
            <div className="spinner"></div>
            <p>Initializing camera...</p>
            <p className="loading-hint">Please allow camera access when prompted</p>
          </div>
        )}
        
        {/* Motion level indicator */}
        {isInitialized && (
          <div className="motion-indicator">
            <div className="motion-bar-container">
              <div 
                className="motion-bar" 
                style={{ width: `${motionLevel}%` }}
              ></div>
            </div>
            <span className="motion-label">Motion Level</span>
          </div>
        )}
      </div>
      
      <div className="camera-hint">
        <p className="hint-main">👋 Move your hand in front of the camera</p>
        <div className="hint-gestures">
          <div className="hint-item">
            <span className="hint-icon">←</span>
            <span>Swipe Left</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">→</span>
            <span>Swipe Right</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">↑</span>
            <span>Open Palm</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">↓</span>
            <span>Thumbs Up</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
