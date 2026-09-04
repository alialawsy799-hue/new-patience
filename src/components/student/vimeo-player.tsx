'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Maximize2, Minimize2, VideoOff } from 'lucide-react';
import { getDictionary, interpolate, type Locale } from '@/lib/i18n';
import { formatDuration } from '@/lib/utils';

type PlaybackPayload = {
  available: boolean;
  embedUrl?: string;
  durationSeconds?: number;
  resumeAtSeconds?: number;
  completed?: boolean;
};

type VimeoPlayerProps = {
  locale: Locale;
  lessonId: string;
  watermark?: string;
  onProgress?: (state: { completed: boolean; progressPercent: number }) => void;
};

const SAVE_INTERVAL = 12_000;

export function VimeoPlayer({ locale, lessonId, watermark, onProgress }: VimeoPlayerProps) {
  const dict = getDictionary(locale);
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const lastSavedRef = useRef(0);
  const positionRef = useRef(0);
  const durationRef = useRef(0);

  const [state, setState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const [payload, setPayload] = useState<PlaybackPayload | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const save = useCallback(
    async (force = false) => {
      const position = Math.round(positionRef.current);
      if (!force && Math.abs(position - lastSavedRef.current) < 5) return;
      lastSavedRef.current = position;

      try {
        const response = await fetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            positionSeconds: position,
            durationSeconds: Math.round(durationRef.current) || undefined,
          }),
          keepalive: true,
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          lesson: { completed: boolean; progressPercent: number };
        };
        onProgress?.(data.lesson);
      } catch {
        // Next heartbeat will retry.
      }
    },
    [lessonId, onProgress],
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setState('loading');
      setPayload(null);
      try {
        const response = await fetch(`/api/student/lessons/${lessonId}/playback`);
        if (!response.ok) {
          if (!cancelled) setState('error');
          return;
        }

        const data = (await response.json()) as PlaybackPayload;
        if (cancelled) return;

        setPayload(data);
        if (!data.available || !data.embedUrl) {
          setState('unavailable');
          return;
        }

        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const embedUrl = payload?.embedUrl;
    if (!iframe || !embedUrl || state !== 'ready') return;
    if (!embedUrl.includes('player.vimeo.com')) return;

    let cancelled = false;

    async function attach() {
      const { default: Player } = await import('@vimeo/player');
      if (cancelled || !iframeRef.current) return;

      const player = new Player(iframeRef.current);
      playerRef.current = player as unknown as { destroy: () => void };

      const duration = await player.getDuration().catch(() => 0);
      durationRef.current = duration;

      const resume = payload?.resumeAtSeconds ?? 0;
      if (resume > 5 && duration > 0 && resume < duration - 15) {
        await player.setCurrentTime(resume).catch(() => {});
      }

      player.on('timeupdate', (event: { seconds: number; duration: number }) => {
        positionRef.current = event.seconds;
        durationRef.current = event.duration;
      });
      player.on('pause', () => void save(true));
      player.on('ended', () => void save(true));
    }

    void attach();

    const timer = window.setInterval(() => void save(), SAVE_INTERVAL);
    const onHide = () => {
      if (document.visibilityState === 'hidden') void save(true);
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      void save(true);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [payload?.embedUrl, payload?.resumeAtSeconds, save, state]);

  useEffect(() => {
    const sync = () => {
      const active = fullscreenElement();
      setIsFullscreen(Boolean(active && shellRef.current && active === shellRef.current));
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (fullscreenElement() === shell) {
        await exitFullscreen();
      } else {
        await requestFullscreen(shell);
      }
    } catch {
      // Browser denied Fullscreen API (missing gesture or policy).
    }
  }, []);

  if (state === 'unavailable') {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-sunken)] px-6 text-center">
        <VideoOff className="size-7 text-[var(--foreground-subtle)]" aria-hidden />
        <p className="text-sm text-[var(--foreground-muted)]">{dict.student.videoUnavailable}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        role="alert"
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--danger-muted)] px-6 text-center"
      >
        <AlertCircle className="size-7 text-[var(--danger)]" aria-hidden />
        <p className="text-sm font-medium text-[var(--danger)]">{dict.errors.unauthorized}</p>
      </div>
    );
  }

  const label = watermark?.trim();
  const embedUrl = payload?.embedUrl;

  return (
    <div>
      <div
        ref={shellRef}
        className={
          isFullscreen
            ? 'player-shell relative h-screen w-screen overflow-hidden bg-black'
            : 'player-shell relative aspect-video overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-lifted)]'
        }
      >
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={dict.student.lessons}
            allow="autoplay; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 z-0 h-full w-full border-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[var(--surface-sunken)]">
            <Loader2 className="size-6 animate-spin text-[var(--foreground-subtle)]" aria-hidden />
            <span className="sr-only">{dict.common.loading}</span>
          </div>
        )}
        {label && embedUrl ? (
          <div className="video-watermark" aria-hidden>
            <span>{label}</span>
            <span>{label}</span>
          </div>
        ) : null}
        {embedUrl ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute end-3 top-3 z-30 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--accent)]"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" aria-hidden /> : <Maximize2 className="size-3.5" aria-hidden />}
            {isFullscreen ? dict.student.exitFullscreen : dict.student.enterFullscreen}
          </button>
        ) : null}
      </div>
      {state === 'ready' && (payload?.resumeAtSeconds ?? 0) > 5 ? (
        <p className="mt-3 text-xs text-[var(--foreground-subtle)]">
          {interpolate(dict.student.resumeFrom, {
            time: formatDuration(payload?.resumeAtSeconds ?? 0),
          })}
        </p>
      ) : null}
    </div>
  );
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestFullscreen(element: HTMLElement) {
  const target = element as FullscreenElement;
  if (target.requestFullscreen) {
    await target.requestFullscreen();
    return;
  }
  await target.webkitRequestFullscreen?.();
}

async function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  await doc.webkitExitFullscreen?.();
}
