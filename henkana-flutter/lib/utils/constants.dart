class AppConstants {
  static const String baseApiUrl = 'https://henkana-api.vercel.app/api';

  // ─── Image proxy ─────────────────────────────────────────────────────────
  static String proxyImage(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.contains('/api/proxy/image')) return url;
    return '$baseApiUrl/proxy/image?url=${Uri.encodeComponent(url)}';
  }

  // ─── HLS proxy ────────────────────────────────────────────────────────────
  // HLS streams from hentaicop CDN need Referer header — go through backend proxy.
  static String proxyHls(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.contains('/api/proxy/hls')) return url;
    return '$baseApiUrl/proxy/hls?url=${Uri.encodeComponent(url)}';
  }

  // ─── Colors (dark theme — matches frontend globals.css .dark) ────────────
  //
  // --background   oklch(0.145 0 0) ≈ #1A1A1A
  // --card         oklch(0.205 0 0) ≈ #282828
  // --muted        oklch(0.269 0 0) ≈ #373737
  // --primary      oklch(0.922 0 0) ≈ #E8E8E8  (near-white accent)
  // --foreground   oklch(0.985 0 0) ≈ #FAFAFA
  // --muted-fg     oklch(0.708 0 0) ≈ #9A9A9A
  // --border       oklch(1 0 0 / 10%) ≈ rgba(255,255,255,0.10)

  static const int bgColor         = 0xFF1A1A1A; // --background
  static const int surfaceColor    = 0xFF242424; // navbar / elevated surfaces
  static const int cardColor       = 0xFF282828; // --card
  static const int mutedColor      = 0xFF373737; // --muted / secondary
  static const int borderColor     = 0x1AFFFFFF; // --border (white 10%)
  static const int borderStrong    = 0x26FFFFFF; // white 15%

  static const int primaryColor    = 0xFFE8E8E8; // --primary (near-white)
  static const int primaryFgColor  = 0xFF282828; // --primary-foreground
  static const int accentColor     = 0xFFE8E8E8; // same as primary

  static const int textPrimary     = 0xFFFAFAFA; // --foreground
  static const int textPrimaryDim  = 0xE6FAFAFA; // foreground/90
  static const int textSecondary   = 0xFF9A9A9A; // --muted-foreground
  static const int textMuted       = 0xFF666666; // dimmer muted

  // Semantic
  static const int amber           = 0xFFFBBF24; // star / rating
  static const int mangaBadgeRed   = 0xFFB91C1C; // manga type badge
  static const int destructive     = 0xFFE5534B; // error

  // ─── Radius ───────────────────────────────────────────────────────────────
  // Cards, images, badges → 0 (sharp, matching frontend)
  static const double cardRadius   = 0;
  static const double badgeRadius  = 0;
  static const double inputRadius  = 8;
  static const double pillRadius   = 9999;
  static const double dropRadius   = 12; // dropdowns, sheets
  static const double logoRadius   = 6;

  static const String logoAsset    = 'assets/icon.png';

  // ─── Typography ───────────────────────────────────────────────────────────
  static const String fontFamily   = 'Inter';
}
