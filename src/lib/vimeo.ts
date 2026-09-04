import { env } from '@/lib/env';

/**
 * Vimeo embed construction.
 *
 * The strongest practical protections available to an embedded player are
 * applied here and in the Vimeo account settings:
 *
 *  - The video file itself is never downloaded to or served from this server;
 *    playback always goes through Vimeo's official player iframe.
 *  - `dnt=1` disables Vimeo's own session tracking of the viewer.
 *  - Downloads, sharing, the title bar, the byline and the portrait are all
 *    turned off at the player level.
 *  - The frame is only rendered after a server-side authorisation check
 *    (see `/api/student/lessons/[lessonId]/playback`), so the embed URL is
 *    never present in the HTML of a page the student is not entitled to.
 *  - `VIMEO_ALLOWED_DOMAIN` documents the domain the videos should be locked
 *    to in Vimeo ("Where can this be embedded?" → Specific domains). Combined
 *    with unlisted/private privacy, that is what actually stops the embed URL
 *    from working if it is copied elsewhere.
 *
 * What no web application can do is prevent screen recording: the operating
 * system, a second device or a camera can always capture what is on screen.
 * These measures raise the cost of casual copying; they are not DRM and are
 * not presented as such.
 */
export function isAllowedEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return (
      url.hostname === 'player.vimeo.com' ||
      url.hostname === 'vimeo.com' ||
      url.hostname.endsWith('.spotlightr.com')
    );
  } catch {
    return false;
  }
}

export function isLessonVideoRef(value: string): boolean {
  const trimmed = value.trim();
  return isValidVimeoId(trimmed) || isAllowedEmbedUrl(trimmed);
}

export function buildLessonEmbed(videoId: string, privacyHash?: string | null): string {
  const trimmed = videoId.trim();
  if (isAllowedEmbedUrl(trimmed)) return trimmed;
  return buildVimeoEmbed(trimmed, privacyHash);
}

export function buildVimeoEmbed(videoId: string, privacyHash?: string | null): string {
  const base = privacyHash
    ? `https://player.vimeo.com/video/${videoId}?h=${encodeURIComponent(privacyHash)}`
    : `https://player.vimeo.com/video/${videoId}?`;

  const params = new URLSearchParams({
    badge: '0',
    autopause: '0',
    byline: '0',
    portrait: '0',
    title: '0',
    dnt: '1',
    pip: '0',
    playsinline: '1',
    transparent: '0',
    fullscreen: '0',
  });

  return `${base}${base.endsWith('?') ? '' : '&'}${params.toString()}`;
}

/** Digits only — an id like "123456789". Rejects full URLs and anything else. */
export function isValidVimeoId(value: string): boolean {
  return /^\d{6,15}$/.test(value.trim());
}

/**
 * Pulls duration and thumbnail from the Vimeo API so an administrator does not
 * have to type them. Server-side only: the token never reaches the browser.
 * Returns null when no token is configured, which is a supported state.
 */
export async function fetchVimeoMetadata(
  videoId: string,
): Promise<{ durationSeconds: number; thumbnailUrl: string | null } | null> {
  if (!env.vimeo.accessToken) return null;

  try {
    const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${env.vimeo.accessToken}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      duration?: number;
      pictures?: { sizes?: { width: number; link: string }[] };
    };

    const sizes = data.pictures?.sizes ?? [];
    const largest = sizes.reduce<{ width: number; link: string } | null>(
      (best, size) => (!best || size.width > best.width ? size : best),
      null,
    );

    return {
      durationSeconds: Math.max(0, Math.round(data.duration ?? 0)),
      thumbnailUrl: largest?.link ?? null,
    };
  } catch (error) {
    console.error('[vimeo] metadata lookup failed', error);
    return null;
  }
}
