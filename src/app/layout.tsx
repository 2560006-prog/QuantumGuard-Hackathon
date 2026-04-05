import ThemeToggle from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Farmer Verification System',
  description: 'Digital platform for verifying and managing farmer profiles',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          [data-theme="dark"] body { background: #0f1a12 !important; color: #e8f5e9 !important; }
          [data-theme="dark"] .f-card,
          [data-theme="dark"] .f-stat,
          [data-theme="dark"] .scheme-card { background: #1a2b1c !important; border-color: #2d4a30 !important; }
          [data-theme="dark"] .f-topbar,
          [data-theme="dark"] .auth-right { background: #111b13 !important; border-color: #2d4a30 !important; }
          [data-theme="dark"] .f-main { background: #0f1a12 !important; }
          [data-theme="dark"] .f-page-title { color: #e8f5e9 !important; }
          [data-theme="dark"] .f-page-sub,
          [data-theme="dark"] .label,
          [data-theme="dark"] .sub { color: #9ca3af !important; }
          [data-theme="dark"] .criteria-row,
          [data-theme="dark"] .profile-field { background: #1e3520 !important; border-color: #2d4a30 !important; }
          [data-theme="dark"] .form-input { background: #111b13 !important; border-color: #2d4a30 !important; color: #e8f5e9 !important; }
          [data-theme="dark"] .scheme-name,
          [data-theme="dark"] .doc-name { color: #e8f5e9 !important; }
          [data-theme="dark"] .scheme-desc,
          [data-theme="dark"] .doc-meta { color: #9ca3af !important; }
        `}</style>
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
