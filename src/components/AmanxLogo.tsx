import React from 'react';

interface AmanxLogoProps {
  /**
   * Overall display size
   * - 'sm': For compact headers or small toolbars (icon: 28px, text: 13px)
   * - 'md': Standard header (icon: 36px, text: 15px)
   * - 'lg': Footer / Prominent cards (icon: 42px, text: 18px)
   * - 'xl': Hero or showcase displays (icon: 56px, text: 24px)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to display the text wordmark alongside the icon mark
   */
  showWordmark?: boolean;
  /**
   * When true, shows "AMANX" on mobile and "AMANX ARCHIVE" on larger viewports
   */
  compactOnMobile?: boolean;
  /**
   * Custom CSS class names for the container
   */
  className?: string;
  /**
   * Subtitle text override (default: "ARCHIVE")
   */
  subtitle?: string;
}

export const AmanxLogo: React.FC<AmanxLogoProps> = ({
  size = 'md',
  showWordmark = true,
  compactOnMobile = true,
  className = '',
  subtitle = 'ARCHIVE'
}) => {
  // Dimension mappings
  const iconDimensions = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl',
    md: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl',
    lg: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl',
    xl: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl'
  }[size];

  const innerRadius = {
    sm: 'rounded-[7px] sm:rounded-[10px]',
    md: 'rounded-[11px]',
    lg: 'rounded-[11px] sm:rounded-[14px]',
    xl: 'rounded-[14px]'
  }[size];

  const titleSizes = {
    sm: 'text-xs sm:text-sm tracking-[0.22em]',
    md: 'text-sm sm:text-base tracking-[0.24em]',
    lg: 'text-base sm:text-lg tracking-[0.25em]',
    xl: 'text-xl sm:text-2xl tracking-[0.28em]'
  }[size];

  const subtitleSizes = {
    sm: 'text-[7px] sm:text-[8px] tracking-[0.32em]',
    md: 'text-[8px] sm:text-[9px] tracking-[0.34em]',
    lg: 'text-[9px] sm:text-[10px] tracking-[0.36em]',
    xl: 'text-[10px] sm:text-[11px] tracking-[0.4em]'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* A / X Monogram Icon Mark */}
      <div 
        className={`${iconDimensions} bg-gradient-to-br from-[#f5e6be] via-[#d4af37] to-[#805a1b] p-[1px] shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all duration-300 flex-shrink-0`}
      >
        <div className={`w-full h-full bg-[#08090d] ${innerRadius} flex items-center justify-center p-1 relative overflow-hidden`}>
          {/* Subtle internal gold luminescence */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/15 via-transparent to-[#f5e6be]/10 opacity-70 group-hover:opacity-100 transition-opacity" />
          
          {/* Crisp Geometric A + X Monogram Vector */}
          <svg 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10 filter drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="amanx-monogram-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7D6" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#9A7620" />
              </linearGradient>
              <linearGradient id="amanx-core-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FFF7D6" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>

            {/* Architectural 'A' Spire Pylons */}
            <path 
              d="M16 4.5 L6 27.5" 
              stroke="url(#amanx-monogram-gold)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
            <path 
              d="M16 4.5 L26 27.5" 
              stroke="url(#amanx-monogram-gold)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />

            {/* 'A' Precision Vault Crossbar */}
            <path 
              d="M10.2 19 L21.8 19" 
              stroke="url(#amanx-monogram-gold)" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
            />

            {/* Intersecting 'X' Diagonal Vault Wings */}
            <path 
              d="M8 8.5 L24 27" 
              stroke="url(#amanx-monogram-gold)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
            <path 
              d="M24 8.5 L8 27" 
              stroke="url(#amanx-monogram-gold)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />

            {/* Center Cryptographic Vault Micro-Diamond Core */}
            <polygon 
              points="16,14.5 18.5,17.5 16,20.5 13.5,17.5" 
              fill="url(#amanx-core-gold)" 
            />
          </svg>
        </div>
      </div>

      {/* Wordmark Typography */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center">
            <span className={`${titleSizes} font-brand font-bold text-white leading-tight group-hover:text-[#f3e5ab] transition-colors whitespace-nowrap`}>
              AMANX
            </span>
            {/* On desktop or non-compact, show inline or keep clean hierarchy */}
          </div>
          <span className={`${subtitleSizes} uppercase text-[#d4af37] font-semibold opacity-95 tracking-[0.32em] leading-tight ${compactOnMobile ? 'hidden sm:inline-block' : 'inline-block'}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
