import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'FlowForge — AI-Native Workflow Automation',
  description: 'Build, automate, and scale workflows with AI-powered automation. Connect 6,000+ apps.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f0f1a] antialiased">
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
