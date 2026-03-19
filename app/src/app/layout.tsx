import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studyond",
  description: "AI-powered student platform",
};

const NAV_LINKS = [
  { href: "/profile", label: "Profile" },
  { href: "/network", label: "Network" },
  { href: "/interview", label: "Interview Prep" },
  { href: "/planner", label: "Thesis GPS" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b">
          <div className="container mx-auto flex items-center gap-6 px-4 py-3">
            <a href="/" className="text-lg font-bold">
              Studyond
            </a>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
