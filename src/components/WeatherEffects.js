import React from 'react';

const WeatherEffects = ({ activeEffects }) => {
  const createParticles = (effect, duration) => {
    const particles = [];
    const count = getParticleCount(effect);
    const style = getParticleStyle(effect);
    
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 5;
      const size = getParticleSize(effect);
      
      particles.push(
        <div
          key={`${effect}-${i}`}
          style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: `-${size}px`,
            fontSize: `${size}px`,
            color: style.color,
            textShadow: style.textShadow,
            animation: `fall ${duration}s ${delay}s linear infinite`,
            willChange: 'transform',
            zIndex: 1000,
          }}
        >
          {style.content}
        </div>
      );
    }
    return particles;
  };

  const getParticleCount = (effect) => {
    switch(effect) {
      case 'snow': return 50;  // Fewer snowflakes for better visibility
      case 'rain': return 100;
      case 'miasma': return 75;
      case 'time': return 75;
      default: return 50;
    }
  };

  const getParticleSize = (effect) => {
    switch(effect) {
      case 'snow': return 12 + Math.random() * 8;
      case 'rain': return 2 + Math.random() * 1;
      case 'miasma': return 16 + Math.random() * 8;
      case 'time': return 18 + Math.random() * 8;  // Increased from 14+6 to 18+8
      default: return 4;
    }
  };

  const getParticleStyle = (effect) => {
    switch(effect) {
      case 'rain':
        return {
          content: '|',
          color: '#00BFFF', // Changed to Deep Sky Blue
          textShadow: '0 0 3px rgba(0,191,255,0.5)' // Brighter glow
        };
      case 'snow':
        return {
          content: '❆',
          color: '#FFFFFF',
          textShadow: '0 0 2px rgba(0,0,0,0.3), 0 0 5px rgba(0,0,255,0.2)'
        };
      case 'miasma':
        return {
          content: '☣',
          color: '#39FF14', // Changed to Neon Green
          textShadow: '0 0 8px rgba(57,255,20,0.6)' // Matching glow
        };
      case 'time':
        return {
          content: Math.random() > 0.5 ? '⏱' : '⏲',
          color: '#FF69B4',
          textShadow: '0 0 8px rgba(238,130,238,0.6)'
        };
      default:
        return {
          content: '.',
          color: '#000000'
        };
    }
  };

  const getOverlayStyle = (effect) => {
    switch(effect) {
      case 'snow':
        return [
          {
            backgroundColor: 'rgba(166, 209, 255, 0.15)',
            mixBlendMode: 'screen',
            zIndex: 999
          },
          {
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(166,209,255,0.2) 100%)',
            mixBlendMode: 'overlay',
            zIndex: 998
          },
          {
            backdropFilter: 'brightness(1.1) contrast(0.95)',
            zIndex: 997
          }
        ];
      case 'night':
        return [{
          backgroundColor: 'rgba(0, 0, 32, 0.45)',
          mixBlendMode: 'multiply',
          zIndex: 999
        }];
      case 'fog':
        return [{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          mixBlendMode: 'screen',
          zIndex: 999
        }];
      case 'heatwave':
        return [{
          background: 'linear-gradient(0deg, rgba(255,69,0,0.1) 0%, rgba(255,140,0,0.15) 100%)',
          mixBlendMode: 'color-dodge',
          filter: 'contrast(1.1)',
          zIndex: 999
        }];
      case 'miasma':
        return [{
          backgroundColor: 'rgba(47, 79, 79, 0.2)',
          mixBlendMode: 'hard-light',
          zIndex: 999
        }];
      case 'time':
        return [
          {
            background: `
              radial-gradient(circle at 50% 50%, 
                rgba(255,105,180,0.1) 0%,
                rgba(238,130,238,0.15) 50%,
                rgba(255,105,180,0.1) 100%)
            `,
            mixBlendMode: 'screen',
            animation: 'timeSwirl 10s infinite linear',
            zIndex: 999
          },
          {
            background: 'rgba(255,192,203,0.15)',  // Light pink smoke
            mixBlendMode: 'soft-light',
            backdropFilter: 'blur(1px)',
            animation: 'smokePulse 8s infinite ease-in-out',
            zIndex: 998
          }
        ];
      default:
        return [];
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {activeEffects.map(effect => (
        getOverlayStyle(effect).map((style, index) => (
          <div
            key={`${effect}-overlay-${index}`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              ...style
            }}
          />
        ))
      ))}
      
      {activeEffects.map(effect => {
        const particleStyles = `
          @keyframes fall {
            0% {
              transform: translateY(0) ${effect === 'snow' ? 'rotate(0deg)' : ''} 
                        ${effect === 'rain' ? 'translateX(0)' : ''};
            }
            100% {
              transform: translateY(100vh) 
                        ${effect === 'snow' ? 'rotate(360deg)' : ''} 
                        ${effect === 'rain' ? 'translateX(-10px)' : ''}; /* Reduced sideways movement */
            }
          }
          
          @keyframes rise {
            0% {
              transform: translateY(100vh) scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: translateY(-100px) scale(1.2);
              opacity: 0;
            }
          }
          
          @keyframes timeSwirl {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes smokePulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.2; }
            100% { opacity: 0.1; }
          }
        `;
        
        // Adjust duration for rain particles
        const duration = effect === 'rain' 
          ? 4 + Math.random() * 3  // Faster for rain (was 8 + random * 7)
          : 8 + Math.random() * 7; // Original speed for others

        return (
          <React.Fragment key={effect}>
            {createParticles(effect, duration)}
            <style>{particleStyles}</style>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WeatherEffects;
