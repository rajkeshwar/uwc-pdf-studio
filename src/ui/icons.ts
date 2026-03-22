/**
 * SVG Icon Registry
 * All icons defined as inline SVG paths. 24×24 viewBox.
 * Usage: <uwc-icon name="merge"></uwc-icon>
 */

export type IconName =
  // Navigation / features
  | 'merge' | 'compress' | 'images' | 'sign' | 'extract'
  | 'summarize' | 'chat' | 'ocr' | 'translate' | 'table'
  // Annotation tools
  | 'select' | 'pen' | 'highlight' | 'text-add' | 'signature'
  | 'rect' | 'ellipse' | 'line' | 'arrow' | 'eraser'
  // Actions
  | 'undo' | 'redo' | 'trash' | 'download' | 'upload' | 'close' | 'check'
  | 'copy' | 'cut' | 'paste' | 'search' | 'refresh'
  // UI controls
  | 'info' | 'moon' | 'sun' | 'menu' | 'chevron-down' | 'chevron-right'
  | 'chevron-left' | 'chevron-up' | 'external-link' | 'settings'
  // Text formatting
  | 'bold' | 'italic' | 'underline'
  // Status
  | 'spinner' | 'warning' | 'error' | 'success' | 'lock' | 'sparkles';

/** Returns the SVG <path> / <g> inner content for the given icon name */
export const ICONS: Record<IconName, string> = {
  // ── Feature icons ────────────────────────────────────────────
  merge: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9 4H5a1 1 0 0 0-1 1v4m0 6v4a1 1 0 0 0 1 1h4m6-16h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M8 12h8M12 8v8"/>`,

  compress: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M12 3v4m0 0-2-2m2 2 2-2M12 21v-4m0 0-2 2m2-2 2 2M3 12h4m0 0-2-2m2 2-2 2M21 12h-4m0 0 2-2m-2 2 2 2"/>`,

  images: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M4 16l4-4 3 3 3-4 6 5M3 6h18M3 10h18M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"/>`,

  sign: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M6 18 10.5 9l3 3L18 6M6 18h12M4 20h16"/>`,

  extract: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M14 3v4a1 1 0 0 0 1 1h4M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M8 11h8M8 15h8M8 7h1"/>`,

  summarize: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4"/>`,

  chat: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"/>`,

  ocr: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8h10M7 12h10M7 16h6"/>`,

  translate: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m5 8 5-5 5 5M5 16l5 5 5-5M4 5h7M4 19h7M13 12H4M20 12l-3 3 3 3M17 15h3"/>`,

  table: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M3 10h18M3 14h18M10 10v8M14 10v8M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"/>`,

  // ── Annotation tools ─────────────────────────────────────────
  select: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M4 4v16l4-4 3 5 2-1-3-5h5L4 4Z"/>`,

  pen: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"/>`,

  highlight: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M15.232 5.232 18.768 8.768M9 13l-5 5h5v-5Zm0 0 5.5-5.5a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L14 18"/>`,

  'text-add': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M12 3v18M4 7V4h16v3M8 20h8"/>`,

  signature: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M6 18c1.5-4 3-7 4-7s2 3 3 3 2-4 3-4 1 2 2 2M3 20h18"/>`,

  rect: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"/>`,

  ellipse: `<ellipse cx="12" cy="12" rx="9" ry="6"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`,

  line: `<path stroke-linecap="round" stroke-width="1.75" d="M4 20 20 4"/>`,

  arrow: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M4 20 20 4m0 0H9m11 0v11"/>`,

  eraser: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m20 20-7-7-7 7M5.5 19 3 16.5 14 5.5l5 5L8.5 21M20 20H8"/>`,

  // ── Action icons ─────────────────────────────────────────────
  undo: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"/>`,

  redo: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"/>`,

  trash: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m19 7-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16"/>`,

  download: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4"/>`,

  upload: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12"/>`,

  close: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M6 18 18 6M6 6l12 12"/>`,

  check: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M5 13l4 4L19 7"/>`,

  copy: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/>`,

  cut: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M14.121 7.629A3 3 0 0 0 9.017 6.41C6.668 6.932 5 9.426 5 12s1.668 5.068 4.017 5.59a3 3 0 0 0 5.104-1.219M19 12l-7-7m7 7-7 7"/>`,

  paste: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>`,

  search: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>`,

  refresh: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>`,

  // ── UI controls ──────────────────────────────────────────────
  info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>`,

  moon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>`,

  sun: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>`,

  menu: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>`,

  'chevron-down': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="m19 9-7 7-7-7"/>`,

  'chevron-right': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="m9 5 7 7-7 7"/>`,

  'chevron-left': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="m15 19-7-7 7-7"/>`,

  'chevron-up': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="m5 15 7-7 7 7"/>`,

  'external-link': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>`,

  settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>`,

  // ── Text formatting ───────────────────────────────────────────
  bold: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M7 4h6a3 3 0 0 1 0 6H7V4Zm0 6h7a3 3 0 0 1 0 6H7v-6Z"/>`,

  italic: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M19 4h-9M14 20H5m6-16-3 16"/>`,

  underline: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M9 4v7a3 3 0 0 0 6 0V4M4 20h16"/>`,

  // ── Status icons ──────────────────────────────────────────────
  spinner: `<path opacity=".3" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>`,

  warning: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>`,

  error: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>`,

  success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>`,

  lock: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>`,

  sparkles: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>`,
};
