/**
 * Middleware de Next.js para optimización y seguridad
 *
 * Beneficios:
 * - Reduce invocaciones de funciones serverless bloqueando bots
 * - Headers de seguridad adicionales
 * - Bloqueo de scrapers comunes
 *
 * NOTA: El rate limiting real debería usar Vercel KV o similar.
 * Este middleware se enfoca en bloquear bots para reducir costos.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// User agents de bots conocidos que queremos bloquear (consumen bandwidth sin valor)
const BLOCKED_USER_AGENTS = [
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'MJ12bot',
  'BLEXBot',
  'DataForSeoBot',
  'PetalBot',
  'Bytespider',
  'GPTBot',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'YandexBot',
  'bingbot/1', // Versión vieja de Bing
  'SeznamBot',
  'Sogou',
  'Exabot',
  'facebot', // Facebook crawler (si no lo necesitas)
  'ia_archiver',
  'MegaIndex',
  'BUbiNG',
  'Applebot/0', // Versión vieja de Apple
];

// Paths que requieren rate limiting más estricto
const SENSITIVE_API_PATHS = [
  '/api/register',
  '/api/login',
  '/api/auth/forgot-password',
  '/api/payments',
  '/api/culqi',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // Bloquear bots de SEO/scraping conocidos
  // Esto ahorra MUCHAS invocaciones de funciones y bandwidth
  const isBlockedBot = BLOCKED_USER_AGENTS.some(bot =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );

  if (isBlockedBot) {
    // Retornar 403 para bots bloqueados
    // Ahorra: Function Invocations + Bandwidth
    return new NextResponse(null, { status: 403 });
  }

  // Bloquear requests sin User-Agent (probablemente bots/scrapers)
  if (!userAgent || userAgent.length < 10) {
    // Solo para APIs, permitir assets
    if (pathname.startsWith('/api/')) {
      return new NextResponse(null, { status: 403 });
    }
  }

  // Bloquear paths sospechosos (ataques comunes)
  const suspiciousPaths = [
    '.php',
    '.asp',
    '.aspx',
    'wp-admin',
    'wp-login',
    'wp-content',
    'xmlrpc',
    '.env',
    '.git',
    'phpmyadmin',
    'admin.php',
  ];

  if (suspiciousPaths.some(path => pathname.toLowerCase().includes(path))) {
    return new NextResponse(null, { status: 404 });
  }

  // Continuar con la request normal
  const response = NextResponse.next();

  // Headers de seguridad (también configurados en next.config.mjs pero redundancia es buena)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Para APIs sensibles, agregar headers anti-cache
  if (SENSITIVE_API_PATHS.some(path => pathname.startsWith(path))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

// Configurar qué rutas procesa el middleware
// Excluir assets estáticos para no gastar edge function invocations
export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match pages but not static files
    '/((?!_next/static|_next/image|assets|fonts|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
