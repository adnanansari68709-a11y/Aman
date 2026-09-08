import React from 'react';
import { Shield, FileCheck, Lock, Scale } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface LegalProps {
  type: 'privacy' | 'terms';
}

export const Legal: React.FC<LegalProps> = ({ type }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
          Governance &amp; Trust
        </span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mt-2 mb-4">
          {isPrivacy ? 'Privacy & Data Governance' : 'Terms of Resource Distribution'}
        </h1>
        <p className="text-zinc-400 text-sm font-light">
          Effective Date: January 1, 2026 • Version 2.4.0
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 space-y-8 text-zinc-300 text-sm font-light leading-relaxed backdrop-blur-md">
        {isPrivacy ? (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4AF37]" /> 1. No Third-Party Tracking
              </h2>
              <p>
                AMANX ARCHIVE does not utilize commercial ad-trackers, pixel beacons, or invasive behavioral fingerprinting. Visitors may freely search, inspect, and download published files without creating accounts or revealing personal telemetry.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" /> 2. Download Event Logs
              </h2>
              <p>
                To safeguard storage infrastructure against denial-of-service abuse and calculate legitimate popularity rankings, the system logs the receiving IP address, user-agent string, and timestamp of download requests. These logs are preserved in internal storage and never shared with advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D4AF37]" /> 3. Data Protection Inquiries
              </h2>
              <p>
                For questions regarding cryptographic compliance or data retention protocols, contact the executive administrator at{' '}
                <span className="text-[#D4AF37] font-mono">{siteConfig.contactEmail}</span>.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D4AF37]" /> 1. Authorized Distribution
              </h2>
              <p>
                All resources hosted on AMANX ARCHIVE are legitimate proprietary digital assets, open-source releases, or works for which the administration holds valid distribution authorization. Unsolicited copyright infringements or malicious payloads are strictly prohibited.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4AF37]" /> 2. Permitted Usage
              </h2>
              <p>
                Downloaded files are provided for legitimate research, evaluation, design implementation, and software development under their respective licenses. Users may not scrape or mirror the entire repository using automated botnets without express permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D4AF37]" /> 3. Warranty Disclaimer
              </h2>
              <p>
                Resources are delivered on an &quot;AS IS&quot; basis. While rigorous anti-malware and extension validation is enforced upon ingestion, users are advised to verify environment compatibility prior to production deployment.
              </p>
            </section>
          </>
        )}

        <div className="pt-8 border-t border-white/10 text-xs text-zinc-500 text-center">
          &copy; {siteConfig.brand.copyrightYear} {siteConfig.siteName}. All rights reserved under international copyright conventions.
        </div>
      </div>
    </div>
  );
};
