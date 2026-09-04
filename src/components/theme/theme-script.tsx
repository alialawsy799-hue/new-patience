import { THEME_COOKIE } from '@/lib/i18n/config';

/**
 * Runs before first paint to prevent a flash of the wrong theme.
 *
 * The server already applies the class from the `pt_theme` cookie, so this only
 * has to handle the first visit (no cookie yet) by following the operating
 * system preference — and it writes the cookie so the server agrees from then
 * on. It also drops the `no-js` class that keeps reveal animations from hiding
 * content when JavaScript is unavailable.
 */
const script = `(function(){try{
var d=document.documentElement;
d.classList.remove('no-js');
var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);
var stored=m?decodeURIComponent(m[1]):null;
var theme=stored;
if(theme!=='dark'&&theme!=='light'){
  theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.cookie='${THEME_COOKIE}='+theme+'; path=/; max-age=31536000; samesite=lax';
}
d.classList.toggle('dark',theme==='dark');
d.style.colorScheme=theme;
}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
