import '@videojs/html/i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlayer } from '../frame/player';
import './demo.css';

interface FrameEntry {
  index: number;
  time: number;
  file: string;
}

interface Chapter {
  n: number;
  start: number;
  end: number;
  title: string;
  thumb: string;
}

const CHAPTERS: Chapter[] = [
  { n: 1, start: 0, end: 20, title: 'A Never-Before-Seen Look', thumb: './chapters/chapter-1.jpg' },
  { n: 2, start: 20, end: 52, title: 'The Voyage to Cosmic Dawn', thumb: './chapters/chapter-2.jpg' },
  { n: 3, start: 52, end: 73, title: 'Building and Launching Webb', thumb: './chapters/chapter-3.jpg' },
  { n: 4, start: 73, end: 111.14, title: 'The Challenges and Promise of Webb', thumb: './chapters/chapter-4.jpg' },
];

type MediaLike = HTMLVideoElement;

function formatTC(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function chapterForTime(t: number): Chapter {
  return CHAPTERS.find((c) => t >= c.start && t < c.end) ?? CHAPTERS[CHAPTERS.length - 1]!;
}

function chapterForFrame(t: number): Chapter {
  return chapterForTime(t);
}

function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaLike | null>(null);
  const activeCellRef = useRef<HTMLButtonElement | null>(null);

  const [frames, setFrames] = useState<FrameEntry[]>([]);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(111.14);
  const [paused, setPaused] = useState(true);

  // Mount the player once.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || stage.childElementCount > 0) return;
    const i18n = document.createElement('media-i18n');
    i18n.append(createPlayer());
    stage.append(i18n);
  }, []);

  // Load the contact-sheet manifest.
  useEffect(() => {
    let cancelled = false;
    fetch('./frames/frames.json')
      .then((r) => r.json())
      .then((data: FrameEntry[]) => {
        if (!cancelled) setFrames(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Track the media element: events where they fire, polling as a guarantee.
  useEffect(() => {
    let interval = 0;
    const find = () => {
      const stage = stageRef.current;
      if (!stage) return;
      for (const element of stage.querySelectorAll('*')) {
        if (element.localName.startsWith('media-')) continue;
        if ('paused' in element && 'play' in element && typeof (element as MediaLike).play === 'function') {
          mediaRef.current = element as MediaLike;
          return;
        }
      }
    };
    find();
    const observer = new MutationObserver(find);
    if (stageRef.current) observer.observe(stageRef.current, { childList: true, subtree: true });

    interval = window.setInterval(() => {
      const media = mediaRef.current;
      if (!media) {
        find();
        return;
      }
      setTime(media.currentTime || 0);
      if (Number.isFinite(media.duration) && media.duration > 0) setDuration(media.duration);
      setPaused(media.paused);
    }, 250);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  const activeChapter = useMemo(() => chapterForTime(time), [time]);
  const activeFrame = useMemo(() => {
    let current: FrameEntry | undefined;
    for (const frame of frames) {
      if (frame.time <= time + 0.001) current = frame;
      else break;
    }
    return current ?? frames[0];
  }, [frames, time]);

  // Keep the active frame in view inside the strip.
  useEffect(() => {
    const cell = activeCellRef.current;
    const strip = stripRef.current;
    if (!cell || !strip) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cell.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [activeFrame]);

  const seekTo = (t: number, play = true) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = t;
    if (play && media.paused) void media.play().catch(() => undefined);
  };

  return (
    <div className="fi-page">
      <header className="fi-header">
        <div className="fi-wordmark">
          <span className="fi-logo-mark" aria-hidden="true">
            FI
          </span>
          <div>
            <h1>FRAME INDEX</h1>
            <p className="fi-tagline">Every Frame Has a Story.</p>
          </div>
        </div>
        <p className="fi-header-meta">
          A contact-sheet skin for Video.js v10
          <span className="fi-meta-sep" aria-hidden="true">
            /
          </span>
          Contra × Mux Skins Design Challenge
        </p>
      </header>

      <main>
        <div className="fi-mount">
          <div className="fi-stage" ref={stageRef} aria-label="FRAME INDEX player — Cosmic Dawn trailer" />

          <section className="fi-sheet" aria-label="Contact sheet — click a frame to seek">
            <div className="fi-sheet-head">
              <h2>Contact Sheet</h2>
              <p className="fi-sheet-status" role="status">
                {activeFrame ? (
                  <>
                    Frame <strong>F-{String(activeFrame.index).padStart(3, '0')}</strong>
                    <span className="fi-meta-sep" aria-hidden="true">
                      /
                    </span>
                    TC {formatTC(time)} / {formatTC(duration)}
                    <span className="fi-meta-sep" aria-hidden="true">
                      /
                    </span>
                    Scene {activeChapter.n} — {activeChapter.title}
                    <span className="fi-meta-sep" aria-hidden="true">
                      /
                    </span>
                    {paused ? 'Paused' : 'Playing'}
                  </>
                ) : (
                  'Indexing frames…'
                )}
              </p>
              <p className="fi-sheet-hint">28 real frames · click a frame to seek</p>
            </div>
            <div className="fi-strip" ref={stripRef}>
              {frames.map((frame) => {
                const chapter = chapterForFrame(frame.time);
                const isChapterStart =
                  frame.time >= chapter.start &&
                  !frames.some((f) => f.time >= chapter.start && f.time < frame.time);
                const isActive = activeFrame?.index === frame.index;
                return (
                  <button
                    key={frame.index}
                    type="button"
                    ref={isActive ? activeCellRef : undefined}
                    className={`fi-cell${isActive ? ' is-active' : ''}`}
                    onClick={() => seekTo(frame.time)}
                    aria-label={`Seek to frame ${frame.index}, ${formatTC(frame.time)} — Scene ${chapter.n}: ${chapter.title}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="fi-cell-img">
                      <img src={`./frames/${frame.file}`} alt="" loading="lazy" decoding="async" />
                      {isChapterStart && <span className="fi-cell-scene">SCENE {chapter.n}</span>}
                    </span>
                    <span className="fi-cell-meta">
                      <span className="fi-cell-no">F-{String(frame.index).padStart(3, '0')}</span>
                      <span className="fi-cell-tc">{formatTC(frame.time)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="fi-columns">
          <section className="fi-scenes" aria-label="Scene explorer">
            <div className="fi-section-head">
              <h2>Scene Explorer</h2>
              <p>Four scenes, indexed from the film’s own chapter track.</p>
            </div>
            <ol className="fi-scene-list">
              {CHAPTERS.map((chapter) => {
                const isActive = activeChapter.n === chapter.n;
                return (
                  <li key={chapter.n}>
                    <button
                      type="button"
                      className={`fi-scene${isActive ? ' is-active' : ''}`}
                      onClick={() => seekTo(chapter.start)}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <img src={chapter.thumb} alt="" loading="lazy" decoding="async" />
                      <span className="fi-scene-text">
                        <span className="fi-scene-no">SCENE {String(chapter.n).padStart(2, '0')}</span>
                        <span className="fi-scene-title">{chapter.title}</span>
                        <span className="fi-scene-range">
                          {formatTC(chapter.start)} — {formatTC(chapter.end)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="fi-about" aria-label="About this skin">
            <div className="fi-section-head">
              <h2>The Idea</h2>
              <p>
                Archivists navigate film by its contact sheet — every frame laid out, numbered and
                filed. FRAME INDEX gives a streaming player the same instrument: the film is indexed
                into 28 real frames, printed on a persistent film strip under the picture. Navigation
                stops being a guess along a blank line and becomes reading the film itself.
              </p>
            </div>
            <ul className="fi-features">
              <li>
                <strong>Contact-Sheet Timeline.</strong> A persistent strip of real frames from the
                film. Click any frame to seek; the index follows playback and keeps the current
                frame in view.
              </li>
              <li>
                <strong>Scene Explorer.</strong> The chapter track rendered as an archivist’s index
                cards — thumbnail, title, timecode range. One click files you into the scene.
              </li>
              <li>
                <strong>Precision feedback.</strong> Seek, volume and speed changes answer back as
                flat index cards — value first, no decoration — with a ruled time slider, chapter
                segments and a live timecode slate.
              </li>
              <li>
                <strong>Archive discipline.</strong> Full keyboard control, visible focus, 44px
                touch targets, reduced-motion support and captions in English and Japanese — matte
                ink bands keep every control legible over bright and dark footage alike.
              </li>
            </ul>
            <dl className="fi-tech">
              <div>
                <dt>Player</dt>
                <dd>Video.js v10 — @videojs/html + @videojs/mux-video 10.4.0</dd>
              </div>
              <div>
                <dt>Streaming</dt>
                <dd>Mux HLS · playback ID 2U9qL96d…Cq4mg</dd>
              </div>
              <div>
                <dt>Film</dt>
                <dd>“Cosmic Dawn” — NASA / Webb Telescope trailer, public domain</dd>
              </div>
              <div>
                <dt>Frames</dt>
                <dd>Extracted from the film with ffmpeg — no stock, no mock data</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>

      <footer className="fi-footer">
        <p>FRAME INDEX — a Video.js v10 skin. Source released under the Apache License 2.0.</p>
        <p className="fi-footer-sub">Demo film © NASA (public domain). Skin and demo © Vikas Kumar Meena.</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
