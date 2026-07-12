import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quantix - Investment Research",
  description: "AI-powered comprehensive investment research and analysis platform.",
};

export default function RootLayout({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'pending-client-id';

  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden bg-[#09090b] text-[#ededed] bg-gradient-radial flex flex-col relative`}
      >
        <GoogleOAuthProvider clientId={clientId}>
          <UserProvider>
            {children}
          </UserProvider>
        </GoogleOAuthProvider>
        <Toaster position="bottom-center" theme="dark" richColors />
      </body>
    </html>
  );
}
