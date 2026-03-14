'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f1a] text-white px-6">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        {/* Logo Mark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Flow<span className="text-[#C9A227]">Forge</span>
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Automate Everything.
          <br />
          <span className="text-[#C9A227]">Intelligently.</span>
        </h1>

        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
          The next-generation workflow automation platform. AI-native.
          Visual builder. 6,000+ app integrations. Built for teams
          who refuse to compromise.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3 bg-[#C9A227] text-[#0C2340] font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-gray-600 text-gray-300 font-medium rounded-lg hover:border-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
        {[
          {
            title: 'Visual Builder',
            desc: 'Drag-and-drop canvas with real-time step configuration and live testing.',
            icon: '🎨',
          },
          {
            title: 'AI-Native',
            desc: 'Claude, GPT-4o, and Gemini built in. AI steps, AI branching, AI agents.',
            icon: '🧠',
          },
          {
            title: 'Enterprise Ready',
            desc: 'RBAC, audit logs, SSO, error handling, flood protection. SOC 2 ready.',
            icon: '🏢',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="glass rounded-xl p-6 text-center hover:border-gray-500 transition-colors"
          >
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-24 mb-8 text-center text-gray-500 text-sm">
        <p>Built by Syed Ali Adnan</p>
        <p className="mt-1">syedaliadnan.com</p>
      </footer>
    </div>
  );
}
