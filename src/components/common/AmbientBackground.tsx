import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-bg-deep">
      {/* Wave Blob 1: Deep Violet / Blue */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full blur-[120px] opacity-25 animate-wave-slow mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, #8A4FFF 0%, rgba(15, 22, 71, 0) 70%)',
        }}
      />

      {/* Wave Blob 2: Warm Pink / Coral */}
      <div 
        className="absolute top-[35%] -right-[15%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full blur-[140px] opacity-20 animate-wave-reverse mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, #FF3D7F 0%, rgba(255, 61, 127, 0) 70%)',
        }}
      />

      {/* Wave Blob 3: Mint / Turquoise Accent Glow */}
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full blur-[130px] opacity-15 animate-wave-slow mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, #2EE6B6 0%, rgba(46, 230, 182, 0) 70%)',
        }}
      />

      {/* Subtle organic SVG wave contours */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-10 object-cover" 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path 
          d="M-100,300 C300,100 600,500 1100,250 C1300,150 1500,400 1600,350 L1600,900 L-100,900 Z" 
          fill="url(#wave-grad-1)" 
        />
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A4FFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FF3D7F" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2EE6B6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

