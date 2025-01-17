import React, { useState, useEffect } from 'react';
import { CALMING_PHRASES, PHRASE_CHANGE_INTERVAL, PHRASE_FADE_DURATION } from '../../config/ambient-player-config';

const LoadingScreen: React.FC = () => {
  const [phrase, setPhrase] = useState(() => 
    CALMING_PHRASES[Math.floor(Math.random() * CALMING_PHRASES.length)]
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setPhrase(CALMING_PHRASES[Math.floor(Math.random() * CALMING_PHRASES.length)]);
        setIsVisible(true);
      }, PHRASE_FADE_DURATION);
    }, PHRASE_CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        backgroundColor: 'black',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif`,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}
    >
      <div className="w-32 h-32 mb-8 relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 100 100" 
          className="animate-[float_4s_ease-in-out_infinite]"
          style={{ backgroundColor: 'black' }}
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="black" />
          
          {/* Animated elements */}
          <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="2" opacity="0.1"/>
          <g>
            <path d="M 25,50 Q 50,35 75,50" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
              <animate 
                attributeName="d" 
                values="M 25,50 Q 50,35 75,50;
                        M 25,50 Q 50,65 75,50;
                        M 25,50 Q 50,35 75,50"
                dur="4s" 
                repeatCount="indefinite"
              />
            </path>
            <path d="M 25,50 Q 50,65 75,50" fill="none" stroke="white" strokeWidth="2" opacity="0.4">
              <animate 
                attributeName="d" 
                values="M 25,50 Q 50,65 75,50;
                        M 25,50 Q 50,35 75,50;
                        M 25,50 Q 50,65 75,50"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          <circle cx="50" cy="50" r="3" fill="white">
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="3;4;3"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <path 
            d="M 50,15 A 35,35 0 0 1 85,50" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
      <div 
        className={`text-white/60 font-light tracking-widest text-sm uppercase transition-all duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {phrase}
      </div>
    </div>
  );
};

export default LoadingScreen;
