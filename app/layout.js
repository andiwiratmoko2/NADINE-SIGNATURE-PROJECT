import './globals.css';
import {Header} from '@/components/ui';
export const metadata={title:'Nadine Signature — Konfeksi Premium',description:'Busana dan perlengkapan konfeksi premium.'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}){
  return(<html lang="id"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600&display=swap"/></head>
  <body><Header/>{children}<footer>© Nadine Signature</footer></body></html>);
}
