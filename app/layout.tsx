import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";

// ===================== FONTS LOCALES =====================
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// ===================== METADATA PARA SEO =====================
export const metadata: Metadata = {
  title: "VerifiCARLO - Inspección de Autos Usados en Lima",
  description:
    "Inspecciona tu auto usado antes de comprarlo. Revisamos más de 200 puntos en mecánica, estética y legal. Desde S/249 en Lima. ¡Agendar ahora!",
  keywords:
    "inspección autos usados, verificación vehículos, mecánica automotriz, compra auto usado Lima, revisión técnica vehicular",
  authors: [{ name: "VerifiCARLO" }],
  openGraph: {
    type: "website",
    title: "VerifiCARLO - Inspección de Autos Usados en Lima",
    description:
      "Inspecciona tu auto usado antes de comprarlo. Revisamos más de 200 puntos en mecánica, estética y legal.",
    url: "https://verificarlo.pe",
    images: ["https://verificarlo.pe/assets/images/image0.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifiCARLO - Inspección de Autos Usados en Lima",
    description:
      "Inspecciona tu auto usado antes de comprarlo. Revisamos más de 200 puntos en mecánica, estética y legal.",
    images: ["https://verificarlo.pe/assets/images/image0.png"],
  },
};

// ===================== ROOTLAYOUT =====================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <html
        lang="es-PE"
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <body>
          {/* ================= Google Tag Manager ================= */}
          <Script id="gtm" strategy="afterInteractive">
            {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-N74TS6ZF');
          `}
          </Script>

          {/* ================= Meta Pixel / Facebook ================= */}
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
            }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1381587826730443');
            fbq('track', 'PageView');
          `}
          </Script>

          {/* ================= TikTok Pixel ================= */}
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
            !function(w,d,t){
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D4928FBC77U6O1UKRBG0');ttq.page();
            }(window, document, 'ttq');
          `}
          </Script>

          {/* ================= Noscript Pixel ================= */}
          <noscript>
            <img
              height={1}
              width={1}
              style={{ display: "none" }}
              src="https://www.facebook.com/tr?id=1381587826730443&ev=PageView&noscript=1"
            />
          </noscript>

          <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N74TS6ZF"
              height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}>
            </iframe>
          </noscript>

          {/* ================= FONTS DE GOOGLE Y SPLIDE CSS ================= */}
          <Script id="webfont" strategy="beforeInteractive">
            {`
            WebFont.load({
              google: {
                families: ["DM Sans:regular,500,600,700,800,900", "Inter:regular,500,600,700,800,900"]
              }
            });
          `}
          </Script>

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css"
          />

          {/* ================= FAVICON ================= */}
          <link rel="shortcut icon" href="/assets/images/image0.png" type="image/x-icon" />
          <link rel="apple-touch-icon" href="/assets/images/image0.png" />

          {/* ================= APP CONTENT ================= */}
          {children}

          {/* ================= SCRIPTS LOCALES ================= */}
          {/* <Script src="/script1.js" strategy="afterInteractive" /> */}

          <Script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></Script>
          {/* <Script src="main.js" type="text/javascript"></Script> */}
        </body>
      </html>
    </>
  );

}
