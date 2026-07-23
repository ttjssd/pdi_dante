import type { Metadata } from "next";
import "./globals.css";
import LauncherUpdateNotice from "./components/LauncherUpdateNotice";
import { APP_DESCRIPTION, APP_NAME } from "./config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <LauncherUpdateNotice />
        {children}
      </body>
    </html>
  );
}
