import React, { useRef, useEffect, useState, useCallback } from 'react';
import './CameraFeed.css';

const CameraFeed = ({ onGestureDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [fps, setFps] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Loading MediaPipe Hands...');
  const [handDetected, setHandDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const handDetectorRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const lastGestureTimeRef = useRef(0);
  const emotionHistoryRef = useRef([]);
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });
  const animationFrameRef = useRef(null);
  const frameSkipRef = useRef(0);
  const lastMediaPipeResultsRef = useRef(null);

  // Initialize MediaPipe Hands directly (like Python OpenCV approach)
  const initializeHandDetector = useCallback(async () => {
    // Wait for MediaPipe Hands to be ready - increased retries for slower connections
    let retries = 0;
    const maxRetries = 100; // Increased from 30 to 100 (10 seconds total)
    
    while (retries < maxRetries && (typeof window.Hands === 'undefined' || !window.mediaPipeHandsReady)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
      
      // Log progress every 20 retries
      if (retries % 20 === 0) {
        console.log(`Waiting for MediaPipe Hands... (${retries}/${maxRetries})`);
      }
    }

    if (typeof window.Hands === 'undefined') {
      console.error('MediaPipe Hands failed to load. Check browser console for errors.');
      console.error('Make sure you are using HTTPS and scripts are not blocked.');
      throw new Error('MediaPipe Hands not loaded. Please refresh the page and ensure you are using HTTPS.');
    }

    console.log('Creating MediaPipe Hands detector...');
    
    return new Promise((resolve, reject) => {
      // Suppress WASM console errors temporarily
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      try {
        
        // Filter out MediaPipe WASM errors (they're warnings but don't break functionality)
        const errorFilter = (...args) => {
          const message = args.join(' ');
          if (message.includes('Module.arguments') || 
              message.includes('Aborted') ||
              message.includes('File exists') ||
              message.includes('Assertion failed')) {
            // Suppress these specific WASM errors - they don't break functionality
            return;
          }
          originalConsoleError.apply(console, args);
        };
        
        const warnFilter = (...args) => {
          const message = args.join(' ');
          if (message.includes('still waiting on run dependencies') ||
              message.includes('dependency:') ||
              message.includes('Module.arguments')) {
            // Suppress MediaPipe WASM dependency warnings
            return;
          }
          originalConsoleWarn.apply(console, args);
        };
        
        console.error = errorFilter;
        console.warn = warnFilter;
        
        // Use a single instance if available, otherwise create new one
        let hands;
        if (window.mediaPipeHandsInstance) {
          console.log('Reusing existing MediaPipe Hands instance');
          hands = window.mediaPipeHandsInstance;
        } else {
          hands = new window.Hands({
            locateFile: (file) => {
              // Ensure proper path resolution for model files
              const baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/';
              return baseUrl + file;
            }
          });
          window.mediaPipeHandsInstance = hands;
        }

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // 0 = lite, 1 = full
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        // Restore console after a delay
        setTimeout(() => {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
        }, 5000);

        // Store results in ref for use in detection loop
        hands.onResults((results) => {
          lastMediaPipeResultsRef.current = results;
          
          // Process results immediately
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              const video = videoRef.current;
              
              if (video && video.readyState >= 2) {
                // Draw video frame
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Process each hand
                results.multiHandLandmarks.forEach((landmarks, index) => {
                  const handedness = results.multiHandedness[index];
                  
                  // Convert MediaPipe landmarks to keypoints format
                  const keypoints = landmarks.map((lm, i) => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z
                  }));
                  
                  // Draw landmarks
                  if (typeof window.drawConnectors !== 'undefined' && typeof window.drawLandmarks !== 'undefined') {
                    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                    window.drawLandmarks(ctx, landmarks, { color: '#FF0000', radius: 3 });
                  } else {
                    // Fallback: use our own drawing function
                    drawHandLandmarks(ctx, keypoints, canvas.width, canvas.height);
                  }
                  
                  // Detect gesture
                  const gesture = detectHandGesture(keypoints, handedness);
                  if (gesture) {
                    const currentTime = Date.now();
                    if (currentTime - lastGestureTimeRef.current > 1000) {
                      console.log('✅ Gesture detected:', gesture);
                      onGestureDetected(gesture);
                      setDetectedGesture(gesture);
                      lastGestureTimeRef.current = currentTime;
                    }
                  }
                  
                  setHandDetected(true);
                });
              }
            }
          } else {
            setHandDetected(false);
          }
        });

        // Wait a bit for MediaPipe to fully initialize before resolving
        setTimeout(() => {
          handDetectorRef.current = hands;
          console.log('✅ MediaPipe Hands detector initialized successfully');
          resolve(hands);
        }, 1000);
      } catch (err) {
        console.error('MediaPipe Hands initialization failed:', err);
        // Restore console
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        reject(new Error(`Could not initialize MediaPipe Hands: ${err.message}`));
      }
    });
  }, [onGestureDetected]);

  // Initialize Face Landmarks Detection for emotion (optional - skip if not available)
  const initializeFaceDetector = async () => {
    // Skip face detection for now - focus on hand gestures for better performance
    console.log('Face detection disabled for better performance');
    return null;
    
    // Uncomment below if you want to enable face detection later
    /*
    if (typeof window.faceLandmarksDetection === 'undefined') {
      console.warn('Face landmarks detection not available');
      return null;
    }

    try {
      const detector = await window.faceLandmarksDetection.createDetector(
        window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: false,
          maxFaces: 1
        }
      );
      return detector;
    } catch (err) {
      console.warn('Face detection initialization failed:', err);
      return null;
    }
    */
  };

  // Detect hand gestures from keypoints with validation
  const detectHandGesture = (keypoints, handedness) => {
    if (!keypoints || keypoints.length < 21) return null;

    // Get key points (normalized coordinates 0-1)
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    const pinkyTip = keypoints[20];
    const thumbMCP = keypoints[2];
    const indexMCP = keypoints[5];
    const middleMCP = keypoints[9];
    const ringMCP = keypoints[13];
    const pinkyMCP = keypoints[17];
    const wrist = keypoints[0];
    const thumbIP = keypoints[3];
    const indexPIP = keypoints[6];
    const middlePIP = keypoints[10];
    const ringPIP = keypoints[14];
    const pinkyPIP = keypoints[18];

    // VALIDATION: Check if this is actually a hand (not a face)
    // Hands have specific proportions - validate keypoint distances
    const wristToMiddleTip = Math.sqrt(
      Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2)
    );
    const indexToPinky = Math.sqrt(
      Math.pow(pinkyTip.x - indexTip.x, 2) + Math.pow(pinkyTip.y - indexTip.y, 2)
    );
    
    // Hand validation: wrist to middle finger should be reasonable, and fingers should be spread
    // If distances are too small or too large, it might be a false detection
    if (wristToMiddleTip < 0.1 || wristToMiddleTip > 0.6) {
      console.log('Invalid hand detection - wrist to middle tip distance:', wristToMiddleTip);
      return null; // Likely not a hand
    }

    // Additional validation: check finger spread
    if (indexToPinky < 0.05 || indexToPinky > 0.4) {
      console.log('Invalid hand detection - finger spread:', indexToPinky);
      return null; // Fingers too close or too far apart
    }

    // Calculate finger states with better thresholds
    // Use PIP (Proximal Interphalangeal) joints for more accurate detection
    const thumbExtended = thumbTip.y < thumbIP.y && thumbIP.y < thumbMCP.y;
    const indexExtended = indexTip.y < indexPIP.y && indexPIP.y < indexMCP.y;
    const middleExtended = middleTip.y < middlePIP.y && middlePIP.y < middleMCP.y;
    const ringExtended = ringTip.y < ringPIP.y && ringPIP.y < ringMCP.y;
    const pinkyExtended = pinkyTip.y < pinkyPIP.y && pinkyPIP.y < pinkyMCP.y;

    const extendedFingers = [
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended
    ].filter(Boolean).length;

    // Pointing gesture detection - index finger pointing left/right
    // Only index finger extended, others closed
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // Check if index finger is pointing horizontally (not up/down)
      const indexToWristY = Math.abs(indexTip.y - wrist.y);
      const indexToWristX = Math.abs(indexTip.x - wrist.x);
      
      // Index finger should be roughly horizontal (more horizontal than vertical)
      if (indexToWristX > indexToWristY * 0.7) {
        // Determine pointing direction based on index finger position relative to wrist
        if (indexTip.x < wrist.x - 0.1) {
          // Index finger is to the left of wrist = pointing left
          return 'point_left';
        } else if (indexTip.x > wrist.x + 0.1) {
          // Index finger is to the right of wrist = pointing right
          return 'point_right';
        }
      }
    }

    // Open Palm (all fingers extended) - require all 5 fingers clearly extended
    if (extendedFingers === 5) {
      // Additional check: fingers should be spread out
      const fingerSpread = Math.max(
        Math.abs(indexTip.x - middleTip.x),
        Math.abs(middleTip.x - ringTip.x),
        Math.abs(ringTip.x - pinkyTip.x)
      );
      if (fingerSpread > 0.03) { // Fingers must be spread
        return 'open_palm';
      }
    }

    // Thumbs Up (only thumb extended, others closed) - stricter validation
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // Check if thumb is pointing up and is above wrist
      if (thumbTip.y < wrist.y && thumbTip.y < thumbMCP.y) {
        // Ensure other fingers are actually closed (tips below MCPs)
        if (indexTip.y > indexMCP.y && middleTip.y > middleMCP.y && 
            ringTip.y > ringMCP.y && pinkyTip.y > pinkyMCP.y) {
          return 'thumbs_up';
        }
      }
    }

    // Fist (no fingers extended) - require all fingers clearly closed
    if (extendedFingers === 0) {
      // Validate: all finger tips should be below their MCPs
      const allFingersClosed = 
        thumbTip.y > thumbMCP.y &&
        indexTip.y > indexMCP.y &&
        middleTip.y > middleMCP.y &&
        ringTip.y > ringMCP.y &&
        pinkyTip.y > pinkyMCP.y;
      
      // Additional check: fingers should be close together (fist shape)
      const fingerCluster = Math.max(
        Math.abs(indexTip.x - middleTip.x),
        Math.abs(middleTip.x - ringTip.x),
        Math.abs(ringTip.x - pinkyTip.x)
      );
      
      if (allFingersClosed && fingerCluster < 0.08) { // Fingers close together
        return 'fist';
      }
    }

    // Peace sign (index and middle extended, others closed) - stricter
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
      // Ensure ring and pinky are closed
      if (ringTip.y > ringMCP.y && pinkyTip.y > pinkyMCP.y) {
        return 'peace';
      }
    }

    return null;
  };

  // Detect emotion from facial landmarks
  const detectEmotionFromFace = (landmarks) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Key facial points for emotion detection
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];

    // Calculate facial features
    const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
    const mouthHeight = Math.abs(mouthTop.y - mouthBottom.y);
    const mouthOpenness = mouthHeight / mouthWidth;

    // Smile detection (mouth corners higher than center)
    const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2;
    const leftCornerY = landmarks[61].y;
    const rightCornerY = landmarks[291].y;
    const isSmiling = (leftCornerY < mouthCenterY - 0.01) && (rightCornerY < mouthCenterY - 0.01);

    // Eye openness
    const leftEyeTop = landmarks[159].y;
    const leftEyeBottom = landmarks[145].y;
    const rightEyeTop = landmarks[386].y;
    const rightEyeBottom = landmarks[374].y;
    const leftEyeOpen = Math.abs(leftEyeTop - leftEyeBottom);
    const rightEyeOpen = Math.abs(rightEyeTop - rightEyeBottom);
    const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;

    // Emotion classification
    if (isSmiling && mouthOpenness > 0.3) {
      return 'excited';
    } else if (isSmiling) {
      return 'happy';
    } else if (mouthOpenness > 0.4) {
      return 'surprised';
    } else if (avgEyeOpen < 0.01) {
      return 'sleepy';
    }

    return null;
  };

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (ctx, keypoints, width, height) => {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
      const startPoint = keypoints[start];
      const endPoint = keypoints[end];
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = '#FF0000';
    keypoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Main detection loop - optimized for performance
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    // Check if detectors are initialized
    if (!handDetectorRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Frame skipping for performance - process every 3rd frame
      frameSkipRef.current++;
      const shouldProcess = frameSkipRef.current % 3 === 0;

      // Detect hands using MediaPipe - only on selected frames
      if (handDetectorRef.current && shouldProcess) {
        try {
          // Ensure MediaPipe is ready before sending frames
          if (handDetectorRef.current && typeof handDetectorRef.current.send === 'function') {
            // MediaPipe Hands uses send() method with image
            handDetectorRef.current.send({ image: canvas });
            
            // Debug logging (only occasionally)
            if (lastMediaPipeResultsRef.current && 
                lastMediaPipeResultsRef.current.multiHandLandmarks && 
                lastMediaPipeResultsRef.current.multiHandLandmarks.length > 0 && 
                frameSkipRef.current % 15 === 0) {
              console.log(`✅ Detected ${lastMediaPipeResultsRef.current.multiHandLandmarks.length} hand(s)`);
            }
          }
        } catch (handErr) {
          // Only log non-WASM errors
          if (!handErr.message || (!handErr.message.includes('Aborted') && !handErr.message.includes('Module.arguments'))) {
            console.error('Hand detection error:', handErr);
          }
          setHandDetected(false);
        }
      } else {
        // Still draw video frame even when skipping detection
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Detect face and emotion - only on selected frames for performance
      if (faceDetectorRef.current && shouldProcess) {
        try {
          const faces = await faceDetectorRef.current.estimateFaces(video, { 
            flipHorizontal: false,
            staticImageMode: false
          });
        
        if (faces && faces.length > 0) {
          setFaceDetected(true);
          
          faces.forEach((face) => {
            const landmarks = face.keypoints;
            if (landmarks && landmarks.length >= 468) {
              const emotion = detectEmotionFromFace(landmarks);
              if (emotion) {
                const currentTime = Date.now();
                const lastEmotionTime = emotionHistoryRef.current[emotionHistoryRef.current.length - 1]?.timestamp || 0;
                if (currentTime - lastEmotionTime > 2000) {
                  console.log('😊 Emotion detected:', emotion);
                  setDetectedEmotion(emotion);
                  emotionHistoryRef.current.push({ emotion, timestamp: currentTime });
                  if (emotionHistoryRef.current.length > 5) {
                    emotionHistoryRef.current.shift();
                  }
                  // Map emotion to gesture for cart addition
                  if (emotion === 'happy' || emotion === 'excited') {
                    onGestureDetected('happy_emotion');
                    setDetectedGesture('happy_emotion');
                  }
                }
              }
            }
          });
        } else {
          setFaceDetected(false);
        }
        } catch (faceErr) {
          console.error('Face detection error:', faceErr);
          setFaceDetected(false);
        }
      }

      // Calculate FPS
      const now = Date.now();
      fpsRef.current.frames++;
      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

    } catch (err) {
      console.error('Detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [onGestureDetected]);

  useEffect(() => {
    let isMounted = true;
    let stream = null;
    const video = videoRef.current; // Capture ref value for cleanup

    const initializeCamera = async () => {
      try {
        setLoadingStatus('Loading MediaPipe Hands...');
        
        // Wait for MediaPipe Hands to load with better error handling
        let retries = 0;
        const maxRetries = 50; // Increased retries
        while (retries < maxRetries) {
          if (typeof window.Hands !== 'undefined') {
            console.log('✅ MediaPipe Hands loaded successfully');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
          if (retries % 10 === 0) {
            console.log(`Waiting for MediaPipe Hands... (${retries}/${maxRetries})`);
          }
        }

        if (typeof window.Hands === 'undefined') {
          console.error('MediaPipe Hands not loaded');
          throw new Error('MediaPipe Hands failed to load. Please refresh the page.');
        }

        console.log('Initializing hand detector...');
        setLoadingStatus('Initializing hand detector...');
        try {
          handDetectorRef.current = await initializeHandDetector();
          console.log('✅ Hand detector initialized successfully');
        } catch (handErr) {
          console.error('Hand detector initialization failed:', handErr);
          throw new Error(`Hand detector failed: ${handErr.message}`);
        }

        console.log('Initializing face detector...');
        setLoadingStatus('Initializing face detector...');
        try {
          faceDetectorRef.current = await initializeFaceDetector();
          if (faceDetectorRef.current) {
            console.log('✅ Face detector initialized successfully');
          } else {
            console.warn('Face detector not available, continuing without face detection');
          }
        } catch (faceErr) {
          console.warn('Face detector initialization failed, continuing without it:', faceErr);
          faceDetectorRef.current = null;
        }

        setLoadingStatus('Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 640 }, // Limit resolution for performance
            height: { ideal: 480, max: 480 },
            facingMode: 'user',
            frameRate: { ideal: 24, max: 30 } // Lower frame rate for better performance
          }
        });

        if (!isMounted || !videoRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.addEventListener('loadedmetadata', resolve, { once: true });
          }
        });

        await videoRef.current.play();

        if (!isMounted) return;

        setLoadingStatus('Starting detection...');
        
        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Start detection loop
        console.log('Starting detection loop...');
        detectLoop();

        if (isMounted) {
          setIsInitialized(true);
          setError(null);
          setLoadingStatus('Ready - MediaPipe Hands Active');
        }

      } catch (err) {
        console.error('Camera initialization error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera access denied. Please allow camera permissions.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found. Please connect a camera device.');
          } else {
            setError(`Failed to initialize: ${err.message || 'Unknown error'}`);
          }
          setIsInitialized(false);
          setLoadingStatus('Error');
        }
      }
    };

    initializeCamera();

    return () => {
      isMounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Cleanup MediaPipe Hands (no dispose method, just stop using it)
      if (handDetectorRef.current) {
        // MediaPipe Hands doesn't have dispose(), just stop sending frames
        handDetectorRef.current = null;
      }

      // Cleanup face detector (if it exists)
      if (faceDetectorRef.current) {
        // Check if dispose method exists before calling
        if (typeof faceDetectorRef.current.dispose === 'function') {
          faceDetectorRef.current.dispose();
        }
        faceDetectorRef.current = null;
      }

      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onGestureDetected, initializeHandDetector, detectLoop]);

  useEffect(() => {
    if (detectedGesture) {
      const timer = setTimeout(() => setDetectedGesture(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [detectedGesture]);

  useEffect(() => {
    if (detectedEmotion) {
      const timer = setTimeout(() => setDetectedEmotion(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [detectedEmotion]);

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
                <span className="stat-label">Hand:</span>
                <span className="stat-value" style={{ color: handDetected ? '#10b981' : '#6b7280' }}>
                  {handDetected ? '✅ Detected' : 'None'}
                </span>
              </span>
              <span className="stat-item">
                <span className="stat-label">Face:</span>
                <span className="stat-value" style={{ color: faceDetected ? '#10b981' : '#6b7280' }}>
                  {faceDetected ? '✅ Detected' : 'None'}
                </span>
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
            <div className="gesture-badge animate-pop">
              {detectedGesture === 'point_left' && '👈 Point Left Detected!'}
              {detectedGesture === 'point_right' && '👉 Point Right Detected!'}
              {detectedGesture === 'open_palm' && '✋ Open Palm Detected!'}
              {detectedGesture === 'thumbs_up' && '👍 Thumbs Up Detected!'}
              {detectedGesture === 'happy_emotion' && '😊 Happy Emotion Detected!'}
              {detectedGesture === 'fist' && '✊ Fist Detected!'}
              {detectedGesture === 'peace' && '✌️ Peace Sign Detected!'}
            </div>
          </div>
        )}

        {detectedEmotion && (
          <div className="emotion-indicator">
            <div className="emotion-badge animate-pop">
              {detectedEmotion === 'happy' && '😊 Happy Detected!'}
              {detectedEmotion === 'excited' && '🎉 Excited Detected!'}
              {detectedEmotion === 'surprised' && '😲 Surprised Detected!'}
            </div>
          </div>
        )}

        {/* Debug info - show what's being detected */}
        {isInitialized && (
          <div className="detection-debug">
            <div className="debug-item">
              <span className="debug-label">Hand:</span>
              <span className="debug-value" style={{ color: handDetected ? '#10b981' : '#6b7280' }}>
                {handDetected ? '✅ Detected' : 'Not Detected'}
              </span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Face:</span>
              <span className="debug-value" style={{ color: faceDetected ? '#10b981' : '#6b7280' }}>
                {faceDetected ? '✅ Detected' : 'Not Detected'}
              </span>
            </div>
            {detectedGesture && (
              <div className="debug-item">
                <span className="debug-label">Gesture:</span>
                <span className="debug-value" style={{ color: '#3b82f6' }}>
                  {detectedGesture}
                </span>
              </div>
            )}
            {detectedEmotion && (
              <div className="debug-item">
                <span className="debug-label">Emotion:</span>
                <span className="debug-value" style={{ color: '#ec4899' }}>
                  {detectedEmotion}
                </span>
              </div>
            )}
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
            <p>{loadingStatus}</p>
            <p className="loading-hint">Please allow camera access when prompted</p>
          </div>
        )}
      </div>

      <div className="camera-hint">
        <p className="hint-main">👋 Show your hand to the camera</p>
        <div className="hint-gestures">
          <div className="hint-item">
            <span className="hint-icon">👈</span>
            <span>Point Left</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">👉</span>
            <span>Point Right</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">✋</span>
            <span>Open Palm</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">👍</span>
            <span>Thumbs Up</span>
          </div>
          <div className="hint-item emotion-hint">
            <span className="hint-icon">😊</span>
            <span>Smile/Happy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;
