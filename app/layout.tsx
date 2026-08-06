import type { Metadata } from "next";
import { Press_Start_2P, VT323, Inter } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "InsightML • Interactive Machine Learning Playground",
  description:
    "Watch machine learning happen right in your browser. Explore Perceptron, Gradient Descent, and Neural Networks — no setup, no coding, free for everyone.",
  openGraph: {
    title: "InsightML • Interactive Machine Learning Playground",
    description: "Watch machine learning happen right in your browser. Explore Perceptron, Gradient Descent, and Neural Networks.",
    url: "https://insightml.dev",
    siteName: "InsightML",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InsightML Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightML • Interactive Machine Learning Playground",
    description: "Watch machine learning happen right in your browser. Explore Perceptron, Gradient Descent, and Neural Networks.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#182320] text-[#C9D7CF] font-sans flex flex-col selection:bg-[#6FCF97] selection:text-[#182320]">
        {children}
      </body>
    </html>
  );
}
