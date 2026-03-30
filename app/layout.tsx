import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenAI Assistants API Migration Tool',
  description: 'Migrate from OpenAI Assistants API to Responses API or Claude API before August 26, 2026 deadline.',
  openGraph: {
    title: 'OpenAI Assistants API Migration Tool',
    description: 'Free tool to migrate your Assistants API code to Responses API or Claude API.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
