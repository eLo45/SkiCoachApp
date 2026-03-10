
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/components/Providers";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ski Coach App",
  description: "Video analysis for ski coaching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <NextAuthProvider>{children}</NextAuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
