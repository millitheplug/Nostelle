import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, ArrowUpRight, Film } from 'lucide-react';
import { MOTION_FILMS, type PerfumeId } from '../data/perfumes';
import {
  AtelierSoundscape,
  initMotionFilmCanvas,
  type MotionFilmController,
} from '../webgl/motionFilmCanvas';

interface MotionFilmSectionProps {
  onSelectPerfume: (perfumeId: PerfumeId) => void;
}

function formatTimecode(sec: number): string {
  const s = Math.floor(sec);
  return `00:${String(s).padStart(2, '0')}`;
}

export function MotionFilmSection({ onSelectPerfume }: MotionFilmSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() =>
    typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<MotionFilmController | null>(null);
  const soundRef = useRef<AtelierSoundscape | null>(null);

  const activeFilm = MOTION_FILMS[activeIndex];

  useEffect(() => {
    const controller = initMotionFilmCanvas(
      canvasRef.current,
      MOTION_FILMS[0].image,
      MOTION_FILMS[0].grade,
      MOTION_FILMS[0].durationSec,
      (sec) => setCurrentTime(sec)
    );
    controllerRef.current = controller;
    soundRef.current = new AtelierSoundscape();

    return () => {
      controller.destroy();
      soundRef.current?.stop();
    };
  }, []);

  const handleSelectFilm = (index: number) => {
    setActiveIndex(index);
    const film = MOTION_FILMS[index];
    controllerRef.current?.setFilm(film.image, film.grade);
    controllerRef.current?.setPlaying(isPlaying);
  };

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    controllerRef.current?.setPlaying(next);
  };

  const toggleSound = () => {
    if (!soundRef.current) return;
    const next = soundRef.current.toggle();
    setSoundOn(next);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    controllerRef.current?.seek(val);
  };

  const progressPct = (currentTime / activeFilm.durationSec) * 100;

  return (
    <section id="films" className="films-section">
      <div className="container">
        <div className="films-header">
          <div>
            <p className="eyebrow-line">Nostelle Cinema · Motion Studies</p>
            <h2 className="section-title">Some scents stay with you.</h2>
          </div>
          <p className="films-intro">
            Three continuous atmospheric film studies capturing warm window light,
            drifting mist, and the quiet elegance of Nostelle Fragrances.
          </p>
        </div>

        <div className="film-stage-card">
          <div className="film-viewport">
            <canvas
              ref={canvasRef}
              className="film-canvas"
              aria-label={`Motion film preview for ${activeFilm.title}`}
            />

            <div className="film-overlay-top">
              <span className="film-meta-text">
                <Film size={15} strokeWidth={1.6} aria-hidden="true" />
                <span>{activeFilm.chapter}</span>
                <span aria-hidden="true">·</span>
                <span>{activeFilm.notesCaption}</span>
              </span>

              <button
                type="button"
                className="film-sound-btn"
                onClick={toggleSound}
                aria-label={soundOn ? 'Mute ambient score' : 'Play ambient score'}
              >
                {soundOn ? (
                  <Volume2 size={16} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <VolumeX size={16} strokeWidth={1.75} aria-hidden="true" />
                )}
                <span>{soundOn ? 'Score On' : 'Ambient Score'}</span>
              </button>
            </div>

            <div className="film-overlay-bottom">
              <div className="film-copy">
                <h3 className="film-title">{activeFilm.title}</h3>
                <p className="film-sub">{activeFilm.subtitle}</p>
              </div>

              <div className="film-controls-bar">
                <button
                  type="button"
                  className="film-play-btn"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause motion film' : 'Play motion film'}
                >
                  {isPlaying ? (
                    <Pause size={17} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Play size={17} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>

                <div className="film-scrubber-wrap">
                  <input
                    type="range"
                    min={0}
                    max={activeFilm.durationSec}
                    step={0.1}
                    value={currentTime}
                    onChange={handleScrub}
                    aria-label="Scrub motion film timeline"
                    className="film-scrubber"
                    style={
                      {
                        '--scrub-pct': `${progressPct.toFixed(1)}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>

                <span className="film-timecode tabular-nums">
                  {formatTimecode(currentTime)} / {formatTimecode(activeFilm.durationSec)}
                </span>

                <a
                  href="#configure"
                  className="film-shop-link"
                  onClick={() => onSelectPerfume(activeFilm.perfumeId)}
                >
                  <span>Configure Extrait</span>
                  <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <div className="film-chapters-row" role="tablist" aria-label="Select motion film">
            {MOTION_FILMS.map((film, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={film.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`film-chapter-btn${isSelected ? ' is-active' : ''}`}
                  onClick={() => handleSelectFilm(idx)}
                >
                  <span className="chapter-code tabular-nums">{film.chapter}</span>
                  <span className="chapter-name">{film.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
