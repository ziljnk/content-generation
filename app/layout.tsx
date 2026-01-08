import type { Metadata } from "next";
import { Nunito_Sans, Varela_Round } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/clay-toast";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const varelaRound = Varela_Round({
  variable: "--font-varela-round",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ClayAI Generator",
  description: "AI Content Generation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunitoSans.variable} ${varelaRound.variable} antialiased flex bg-[#f0f4f8] text-slate-800`}
      >
        <ToastProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto h-screen p-8 relative flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 flex-1 flex flex-col">
              <Header />
              {children}
            </div>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
