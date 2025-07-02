'use client';

export const dynamic = 'force-dynamic';



import '../i18n';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../i18n';
import type React from 'react';
import { useEffect, useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { i18n: i18nInstance, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && ready) {
      document.documentElement.lang = i18nInstance.language;
    }
  }, [i18nInstance.language, isMounted, ready]);

  return (
    <html lang={i18nInstance.language || 'en'} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <I18nextProvider i18n={i18n}>
          {(isMounted && ready) ? <ClientBody>{children}</ClientBody> : null}
        </I18nextProvider>
      </body>
    </html>
  );
}
