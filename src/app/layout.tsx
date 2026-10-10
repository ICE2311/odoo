import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyline Student Association",
  description: "Official platform for memberships, events, merch, and volunteering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
