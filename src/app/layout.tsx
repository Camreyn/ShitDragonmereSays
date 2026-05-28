import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/components/audio-player-provider";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Shit Dragonmere Says",
  description: "A searchable prank-call transcript and quote archive with redaction-first guardrails.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AudioPlayerProvider>
          <Header />
          <main className="mx-auto min-h-screen max-w-7xl px-4 pb-32 pt-8">{children}</main>
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
