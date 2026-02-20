import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assignment 2 - Supabase Data Viewer",
  description: "Next.js app that renders rows from Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
