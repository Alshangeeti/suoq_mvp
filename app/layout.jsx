import "./globals.css";
import { StoreProvider } from "../lib/store";
import SiteChrome from "../components/SiteChrome";

export const metadata = {
  metadataBase: new URL("https://www.souqmauritania.com"),
  title: {
    default: "Souq Mauritania — سوق موريتانيا",
    template: "%s | Souq Mauritania"
  },
  description:
    "اشترِ من الصين والعالم وادفع ببانكيلي — Achetez de Chine et du monde, payez avec Bankily en MRU. Livraison à Nouakchott.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://www.souqmauritania.com",
    siteName: "Souq Mauritania",
    title: "Souq Mauritania — سوق موريتانيا",
    description: "Shop from AliExpress, Taobao, 1688 & Amazon — pay with Bankily in MRU, delivered in Nouakchott.",
    locale: "ar_MR",
    alternateLocale: "fr_FR"
  },
  twitter: {
    card: "summary",
    title: "Souq Mauritania — سوق موريتانيا",
    description: "Shop from China & the world, pay with Bankily in MRU."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-souq-sand text-souq-ink min-h-screen">
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
