import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { siteConfig } from '../config/siteConfig';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please complete all mandatory fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const responseMsg = await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || 'General Resource Inquiry',
        message: message.trim()
      });
      setSuccessMsg(responseMsg);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transmission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
          Communications Gateway
        </span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mt-2 mb-4">
          Contact Concierge
        </h1>
        <p className="text-zinc-400 text-sm font-light leading-relaxed">
          Submit licensing requests, report asset discrepancies, or inquire about custom resource specifications directly to administration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Direct Dispatch
              </span>
              <div className="text-white font-medium text-base mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-mono">{siteConfig.contactEmail}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Operational Hours
              </span>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                24/7 automated integrity monitoring. Executive correspondence reviewed within 4 business hours.
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Integrity Notice
              </span>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                All transmissions are recorded and subject to strict verification protocols.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Encrypted Communications Channel</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
          {successMsg ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Transmission Dispatched</h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed mb-6">
                {successMsg}
              </p>
              <button
                onClick={() => setSuccessMsg(null)}
                className="px-6 py-2.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elizabeth Sterling"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Asset Verification Request"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Inquiry Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request or inquiry..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Encrypting Transmission...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Correspondence</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
