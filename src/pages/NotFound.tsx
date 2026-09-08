import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (route: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
        Error 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight mt-2 mb-4">
        Archive Coordinate Not Located
      </h1>
      <p className="text-zinc-400 text-sm font-light mb-8 max-w-md mx-auto leading-relaxed">
        The resource or route you requested does not exist or has been relocated to another sector within the AMANX ARCHIVE repository.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-3 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2"
        >
          <span>Return Home</span> <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onNavigate('/library')}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          Search Library
        </button>
      </div>
    </div>
  );
};
