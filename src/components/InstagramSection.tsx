import React from 'react';
import { Instagram, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { INSTAGRAM_PROFILE_URL, INSTAGRAM_USERNAME } from '../config/social';

interface InstagramSectionProps {
  className?: string;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ className = '' }) => {
  return (
    <section 
      id="instagram-connect-section" 
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full relative z-10 ${className}`}
      aria-label="Connect With Me on Instagram"
    >
      {/* Clickable Luxury Glassmorphism Container */}
      <a
        id="instagram-profile-card-link"
        href={INSTAGRAM_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group block relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#d4af37]/25 hover:border-[#d4af37]/60 bg-gradient-to-br from-[#0d0e15]/90 via-[#08090d]/95 to-[#12141f]/90 p-6 sm:p-10 lg:p-12 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_24px_rgba(212,175,55,0.08)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.2)] hover:-translate-y-1 backdrop-blur-xl"
      >
        {/* Subtle Futuristic Radial Gold Glows */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-[#d4af37]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#d4af37]/15 transition-all duration-700" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#996515]/10 blur-[90px] rounded-full pointer-events-none" />

        {/* Futuristic Subtle Ambient Grid Pattern Accent */}
        <div 
          className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" 
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12">
          
          {/* Left / Main Info: Icon & Typography */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
            
            {/* Instagram Icon Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f5e6be] via-[#d4af37] to-[#805a1b] p-[1.5px] shadow-[0_0_25px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_35px_rgba(212,175,55,0.55)] group-hover:scale-105 transition-all duration-500">
                <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-[#07080c] flex items-center justify-center relative overflow-hidden">
                  {/* Subtle internal gradient fill */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/15 via-transparent to-[#e1306c]/10 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <Instagram className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37] group-hover:text-[#f3e5ab] transition-colors relative z-10" />
                </div>
              </div>

              {/* Verified Status Dot */}
              <div 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#07080c] border border-[#d4af37]/40 flex items-center justify-center shadow-md"
                title="Verified Official Handle"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              </div>
            </div>

            {/* Copy / Headings */}
            <div className="space-y-1.5 sm:space-y-2">
              {/* Category Eyebrow Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.25em]">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>Connect With Me</span>
              </div>

              {/* Main Heading */}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight group-hover:text-[#f3e5ab] transition-colors">
                Follow Me on Instagram
              </h3>

              {/* Handle and Description */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                <span className="font-mono text-sm sm:text-base text-[#d4af37] font-medium tracking-wide">
                  {INSTAGRAM_USERNAME}
                </span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-400 text-xs sm:text-sm font-light">
                  Direct updates, archival previews &amp; creative dispatches
                </span>
              </div>
            </div>
          </div>

          {/* Right: Premium CTA Button */}
          <div className="w-full lg:w-auto shrink-0 flex items-center justify-start lg:justify-end">
            <div 
              id="visit-instagram-btn"
              className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#caa446] text-black text-xs sm:text-sm font-bold uppercase tracking-wider group-hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(212,175,55,0.35)] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.55)] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>VISIT INSTAGRAM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>

        </div>
      </a>
    </section>
  );
};
