import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ClientOnly from '@/components/ClientOnly';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Markaz An-noor Student Reporting System',
  description: 'Full Stack Reporting System for Islamic Education - Manage student participation, grading, and reports',
  keywords: 'Islamic education, student management, reporting, grading, participation tracking',
  authors: [{ name: 'Markaz An-noor' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings from browser extensions
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = (...args) => {
                  if (typeof args[0] === 'string' && args[0].includes('Hydration failed')) {
                    return;
                  }
                  originalError(...args);
                };
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ClientOnly>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  );
}