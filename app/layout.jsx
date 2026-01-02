export const metadata = {
  title: "Bible in 365 Days",
  description: "Read the Bible in one year with daily reflections",
  manifest: "/manifest.json",
  themeColor: "#6B3E26",
};

import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#6B3E26" />
      </head>
      <body>{children}</body>
    </html>
  );
}
