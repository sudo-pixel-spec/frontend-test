import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";
import StarfieldBackground from "@/components/fx/StarfieldBackground";
import CursorGlow from "@/components/fx/CursorGlow";

export const metadata: Metadata = {
  title: { default: "Gamified Learn", template: "%s • Gamified Learn" },
  description: "Gamified learning platform for CBSE students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen text-white antialiased overflow-x-hidden">
        <div id="root-bg" />
        <StarfieldBackground />
        <CursorGlow />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}