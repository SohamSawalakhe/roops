import "@/styles/globals.css";

export const metadata = {
  title: "Roop Sari Palace | Customer Information",
  description:
    "Roop Sari Palace customer information collection form. Share your details so we can serve you better with the finest Indian ethnic wear.",
  keywords: "Roop Sari Palace, customer form, Indian dresses, sarees, lehengas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#b79e8c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Roop Sari" />
      </head>
      <body>{children}</body>
    </html>
  );
}
