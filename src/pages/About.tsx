import React from 'react';
import { ShieldCheck, HardDrive, Cpu, Lock, ArrowRight, Zap, CheckCircle } from 'lucide-react';

interface AboutProps {
  onNavigate: (route: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
          System Genesis &amp; Philosophy
        </span>
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white mt-2 mb-6">
          Architected for <span className="italic font-serif text-[#D4AF37]">Excellence</span>.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg font-light leading-relaxed">
          AMANX ARCHIVE is an exclusive digital resource repository operated under a single-owner administrative model, guaranteeing strict provenance, cryptographic payload verification, and zero advertising intrusion.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">Single-Owner Governance</h3>
          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            Unlike public aggregators cluttered with unverified community uploads and adware installers, every byte in the AMANX ARCHIVE is directly authored or vetted by the primary administrator.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">Direct Edge Transmission</h3>
          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            Downloads flow directly from dedicated high-throughput object storage without countdown timers, interstitial redirects, or paywalls.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">Lossless Preservation</h3>
          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            Assets maintain original bitrates, vector paths, and metadata structures. Files are stored uncompressed and unmodified.
          </p>
        </div>
      </div>

      {/* Infrastructure Details */}
      <div className="bg-black/60 border border-white/10 rounded-3xl p-8 sm:p-12 mb-16">
        <h3 className="text-2xl font-light text-white mb-6">Technical Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-medium mb-1">MIME &amp; Extension Double-Lock</div>
              <div className="text-zinc-400 text-xs leading-relaxed">
                Ingested payloads are validated against strict whitelist schemas to reject executable scripts and malicious binaries.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-medium mb-1">Atomic State Serialization</div>
              <div className="text-zinc-400 text-xs leading-relaxed">
                Database operations utilize transactional write-and-rename guarantees, eliminating state corruption.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-medium mb-1">Privacy by Default</div>
              <div className="text-zinc-400 text-xs leading-relaxed">
                Public downloads require no user registration, no email capture, and no tracking cookies.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-medium mb-1">Signed Administrative Tokens</div>
              <div className="text-zinc-400 text-xs leading-relaxed">
                The administrative panel operates via bcrypt password hashing and cryptographic JSON Web Tokens.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={() => onNavigate('/library')}
          className="px-8 py-3.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#E5C158] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          Explore Repository Artifacts
        </button>
      </div>
    </div>
  );
};
