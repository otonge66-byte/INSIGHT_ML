import type { Metadata } from "next";
import { Press_Start_2P, VT323, Pixelify_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GlobalNavigation } from "@/components/ui/GlobalNavigation";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
  fallback: ["monospace"],
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
  fallback: ["monospace"],
});

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
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
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_placeholder_key_for_static_generation";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html
        lang="en"
        className={`${pressStart.variable} ${vt323.variable} ${pixelifySans.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-[#182320] text-[#C9D7CF] font-sans flex flex-col selection:bg-[#6FCF97] selection:text-[#182320]">
          <GlobalNavigation>{children}</GlobalNavigation>
        </body>
      </html>
    </ClerkProvider>
  );
}
