import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowUpRight,
  MoveHorizontal,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import {
  CAMPAIGN_FILM_IMAGE,
  EDITION_META,
  PERFUMES,
  SHOWCASE_CHAPTERS,
  VOLUME_OPTIONS,
  computeUnitPrice,
  formatNaira,
  getPerfumeById,
  type BagItem,
  type EditionId,
  type PerfumeId,
  type TierFilter,
  type VolumeLabel,
} from './data/perfumes';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';
import { ImageWithFallback } from './components/ImageWithFallback';
import { NostelleLogo } from './components/NostelleLogo';
import { MotionFilmSection } from './components/MotionFilmSection';
import { CheckoutView } from './components/CheckoutView';
import { OrderTrackingView } from './components/OrderTrackingView';

gsap.registerPlugin(ScrollTrigger);

const TIERS: TierFilter[] = ['All', 'Everyday', 'Signature', 'Prestige'];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'store' | 'checkout' | 'tracking'>('store');
  const [trackedOrderNum, setTrackedOrderNum] = useState<string | null>(null);

  const [heroEdition, setHeroEdition] = useState<EditionId>('crystal');

  const [tierFilter, setTierFilter] = useState<TierFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [configPerfumeId, setConfigPerfumeId] = useState<PerfumeId>('aura-ambree');
  const [configEdition, setConfigEdition] = useState<EditionId>('crystal');
  const [configVolume, setConfigVolume] = useState<VolumeLabel>('50 ml');
  const [engraving, setEngraving] = useState('');

  const [activeStage, setActiveStage] = useState(0);
  const [captionBlur, setCaptionBlur] = useState(false);

  const [splitPct, setSplitPct] = useState(50);
  const [splitAnimate, setSplitAnimate] = useState(false);

  const [bag, setBag] = useState<BagItem[]>([
    {
      perfumeId: 'aura-ambree',
      edition: 'crystal',
      volume: '50 ml',
      engraving: '',
      unitPrice: 26000,
      qty: 1,
    },
  ]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const tiltWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const stageIdxRef = useRef(0);
  const stageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (view !== 'store') return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let velX = 0;
    let velY = 0;
    let tiltTicker: (() => void) | null = null;

    const heroStage = heroStageRef.current;
    const onHeroMove = (e: PointerEvent) => {
      if (!heroStage) return;
      const rect = heroStage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 13;
      targetRotX = -ny * 9;
    };
    const onHeroLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    if (heroStage && tiltWrapRef.current && !prefersReduced) {
      heroStage.addEventListener('pointermove', onHeroMove);
      heroStage.addEventListener('pointerleave', onHeroLeave);
      tiltTicker = () => {
        const ax = (targetRotX - curRotX) * 0.08;
        const ay = (targetRotY - curRotY) * 0.08;
        velX = (velX + ax) * 0.82;
        velY = (velY + ay) * 0.82;
        curRotX += velX;
        curRotY += velY;
        if (tiltWrapRef.current) {
          tiltWrapRef.current.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
        }
        if (shadowRef.current) {
          shadowRef.current.style.transform = `translateX(${(-curRotY * 1.3).toFixed(1)}px) scale(${1 - Math.abs(curRotX) * 0.01})`;
        }
      };
      gsap.ticker.add(tiltTicker);
    }

    const gsapCtx = gsap.context(() => {
      if (prefersReduced) return;

      const frames = frameRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      if (showcaseRef.current && frames.length === 4) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.65,
            onUpdate: (self: { progress: number }) => {
              const t = self.progress * 3.5;
              let nextIdx = 0;
              if (t >= 3.07) nextIdx = 3;
              else if (t >= 2.02) nextIdx = 2;
              else if (t >= 0.97) nextIdx = 1;

              if (nextIdx !== stageIdxRef.current) {
                stageIdxRef.current = nextIdx;
                setCaptionBlur(true);
                if (stageTimerRef.current !== null) {
                  window.clearTimeout(stageTimerRef.current);
                }
                stageTimerRef.current = window.setTimeout(() => {
                  stageTimerRef.current = null;
                  setActiveStage(nextIdx);
                  setCaptionBlur(false);
                }, 100);
              }
            },
          },
        });

        const wipeStarts = [0.25, 1.3, 2.35];
        frames.forEach((frame, i) => {
          if (i === 0) return;
          tl.fromTo(
            frame,
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
            wipeStarts[i - 1]
          );
        });
        tl.set({}, {}, 3.5);
      }

      if (bentoGridRef.current) {
        gsap.from('.reveal-tile', {
          y: 24,
          scale: 0.97,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: bentoGridRef.current,
            start: 'top 84%',
            once: true,
          },
        });
      }
    });

    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      cleanupHeroGl();
      cleanupSpecsGl();
      gsapCtx.revert();
      if (tiltTicker) gsap.ticker.remove(tiltTicker);
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenis?.destroy();
      heroStage?.removeEventListener('pointermove', onHeroMove);
      heroStage?.removeEventListener('pointerleave', onHeroLeave);
    };
  }, [view]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const filteredPerfumes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PERFUMES.filter((p) => {
      const matchTier = tierFilter === 'All' || p.tier === tierFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.mood.toLowerCase().includes(q) ||
        p.occasion.toLowerCase().includes(q) ||
        p.notes.top.some((n) => n.toLowerCase().includes(q)) ||
        p.notes.heart.some((n) => n.toLowerCase().includes(q)) ||
        p.notes.base.some((n) => n.toLowerCase().includes(q));
      return matchTier && matchQuery;
    });
  }, [tierFilter, searchQuery]);

  const activeConfigPerfume = getPerfumeById(configPerfumeId);
  const activeConfigPrice = computeUnitPrice(
    activeConfigPerfume,
    configVolume,
    configEdition
  );
  const activeVolumeScale =
    VOLUME_OPTIONS.find((v) => v.volume === configVolume)?.scale ?? 1.0;

  const selectStage = (idx: number) => {
    stageIdxRef.current = idx;
    setCaptionBlur(true);
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current);
    }
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      setActiveStage(idx);
      setCaptionBlur(false);
    }, 110);
    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      frame.style.clipPath =
        i <= idx ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)';
    });
  };

  const updateSplit = (pct: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setSplitAnimate(animate);
    setSplitPct(clamped);
  };

  const handleCompPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerUp = () => {
    isDraggingRef.current = false;
  };

  const addItemToBag = (
    perfumeId: PerfumeId,
    edition: EditionId,
    volume: VolumeLabel,
    customEngraving: string
  ) => {
    const perfume = getPerfumeById(perfumeId);
    const unitPrice = computeUnitPrice(perfume, volume, edition);
    const cleanEngraving =
      volume === '10 ml Oil' ? '' : customEngraving.trim().toUpperCase().slice(0, 3);

    setBag((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.perfumeId === perfumeId &&
          item.edition === edition &&
          item.volume === volume &&
          item.engraving === cleanEngraving
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          perfumeId,
          edition,
          volume,
          engraving: cleanEngraving,
          unitPrice,
          qty: 1,
        },
      ];
    });
    setDrawerOpen(true);
  };

  const updateBagQty = (idx: number, delta: number) => {
    setBag((prev) => {
      const next = [...prev];
      const updatedQty = next[idx].qty + delta;
      if (updatedQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], qty: updatedQty };
      }
      return next;
    });
  };

  const navigateToSection = (hash: string) => {
    if (view !== 'store') {
      setView('store');
      window.setTimeout(() => {
        const target = document.querySelector(hash);
        target?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  const handleSelectPerfumeForConfig = (id: PerfumeId) => {
    setConfigPerfumeId(id);
    if (view !== 'store') {
      setView('store');
      window.setTimeout(() => {
        document.querySelector('#configure')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.querySelector('#configure')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalQty = bag.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = bag.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Strict 3-Zone Top Bar Contract: [Brand] — [4 single-line links] — [1 primary action] */}
      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a
            href="#hero"
            className="brand-lockup whitespace-nowrap shrink-0"
            aria-label="Nostelle Fragrances Home"
            onClick={(e) => {
              if (view !== 'store') {
                e.preventDefault();
                setView('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <NostelleLogo variant="mark" className="brand-bottle-mark" />
            <span>Nostelle</span>
          </a>

          <nav className="header-nav" aria-label="Primary">
            <a
              href="#collection"
              className="nav-link whitespace-nowrap shrink-0"
              onClick={() => navigateToSection('#collection')}
            >
              Collection
            </a>
            <a
              href="#films"
              className="nav-link whitespace-nowrap shrink-0"
              onClick={() => navigateToSection('#films')}
            >
              Motion Films
            </a>
            <a
              href="#configure"
              className="nav-link whitespace-nowrap shrink-0"
              onClick={() => navigateToSection('#configure')}
            >
              Configure
            </a>
            <button
              type="button"
              className="nav-link nav-link-btn whitespace-nowrap shrink-0"
              onClick={() => {
                setView('tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Track Order
            </button>
          </nav>

          <button
            type="button"
            className="header-bag-btn whitespace-nowrap shrink-0"
            id="bag-trigger"
            aria-label={`Open shopping bag with ${totalQty} items`}
            onClick={() => setDrawerOpen(true)}
          >
            <ShoppingBag size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="tabular-nums">Bag ({totalQty})</span>
          </button>
        </div>
      </header>

      {view === 'checkout' ? (
        <main>
          <CheckoutView
            bag={bag}
            onUpdateQty={updateBagQty}
            onBackToStore={() => {
              setView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOrderComplete={() => setBag([])}
            onTrackOrder={(orderNum) => {
              setTrackedOrderNum(orderNum);
              setView('tracking');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      ) : view === 'tracking' ? (
        <main>
          <OrderTrackingView
            initialOrderNumber={trackedOrderNum}
            onBackToStore={() => {
              setView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      ) : (
        <main>
          {/* SECTION 1: Asymmetric Split Hero + Official Nostelle Version C Lockup */}
          <section id="hero" className="hero">
            <canvas
              ref={heroCanvasRef}
              id="hero-gl-canvas"
              className="hero-canvas"
              aria-hidden="true"
            />

            <div className="container hero-grid">
              <div className="hero-copy">
                <div className="hero-brand-lockup">
                  <NostelleLogo variant="full" className="hero-logo-svg" />
                </div>

                <h1 className="hero-title">Some feelings never fade.</h1>
                <p className="hero-sub">
                  Everyday fragrance oils from ₦3,000 to Signature extraits and the
                  Prestige Edit—crafted by Peejay&apos;s Luxury so every mood finds a
                  memory that stays.
                </p>

                <div className="hero-actions">
                  <a href="#collection" className="btn btn-primary">
                    Shop Fragrances
                  </a>
                  <a href="#films" className="btn btn-ghost">
                    <span>Watch Motion Films</span>
                    <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </div>

                <div className="hero-utility-row">
                  <button
                    type="button"
                    className="theme-inline-btn"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  >
                    {theme === 'light' ? (
                      <Moon size={15} strokeWidth={1.7} aria-hidden="true" />
                    ) : (
                      <Sun size={15} strokeWidth={1.7} aria-hidden="true" />
                    )}
                    <span>
                      {theme === 'light'
                        ? 'Preview Prestige Dark Edit'
                        : 'Preview Everyday Ivory'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="hero-stage" ref={heroStageRef} id="hero-stage">
                <div
                  className="flacon-tilt-wrap"
                  ref={tiltWrapRef}
                  id="flacon-tilt-wrap"
                >
                  <div className="hero-flacon-frame">
                    <ImageWithFallback
                      src={PERFUMES[1].image}
                      alt={PERFUMES[1].alt}
                      className="flacon-hero-img"
                      id="hero-flacon-img"
                      data-edition={heroEdition}
                      width={600}
                      height={800}
                      fallbackTitle="Aura Ambrée"
                    />
                  </div>
                </div>
                <div className="flacon-shadow" ref={shadowRef} aria-hidden="true" />

                <div
                  className="hero-swatches"
                  role="radiogroup"
                  aria-label="Select flacon finish"
                >
                  {(Object.keys(EDITION_META) as EditionId[]).map((key) => {
                    const meta = EDITION_META[key];
                    const isActive = heroEdition === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        className={`swatch-btn${isActive ? ' is-active' : ''}`}
                        aria-checked={isActive}
                        onClick={() => {
                          setHeroEdition(key);
                          setConfigEdition(key);
                        }}
                      >
                        <span
                          className="swatch-dot"
                          style={{ background: meta.dot }}
                        />
                        <span className="swatch-label">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Nostelle Collection — Everyday (from ₦3,000), Signature & Prestige */}
          <section id="collection" className="collection-section">
            <div className="container">
              <div className="collection-header">
                <div>
                  <p className="eyebrow-line">
                    Everyday Finds from ₦3,000 · Designer & Prestige Extraits
                  </p>
                  <h2 className="section-title">Fragrance for every mood.</h2>
                </div>

                <div className="collection-controls">
                  <div className="filter-tabs" role="tablist" aria-label="Filter by collection tier">
                    {TIERS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        role="tab"
                        aria-selected={tierFilter === tier}
                        className={`filter-tab${tierFilter === tier ? ' is-active' : ''}`}
                        onClick={() => setTierFilter(tier)}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>

                  <div className="search-field-wrap">
                    <Search size={16} strokeWidth={1.7} aria-hidden="true" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search mood, note, or occasion..."
                      aria-label="Search Nostelle fragrances"
                      className="search-input"
                    />
                  </div>
                </div>
              </div>

              {filteredPerfumes.length === 0 ? (
                <div className="collection-empty">
                  <p>No fragrances match “{searchQuery}”. Try searching amber, jasmine, or fresh.</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setTierFilter('All');
                      setSearchQuery('');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="collection-grid">
                  {filteredPerfumes.map((perfume) => {
                    const entryVolume: VolumeLabel =
                      perfume.tier === 'Everyday' ? '10 ml Oil' : '50 ml';
                    const entryPrice = computeUnitPrice(
                      perfume,
                      entryVolume,
                      'crystal'
                    );
                    return (
                      <article key={perfume.id} className="product-card">
                        <div className="product-media">
                          <ImageWithFallback
                            src={perfume.image}
                            alt={perfume.alt}
                            className="product-img"
                            fallbackTitle={perfume.name}
                          />
                        </div>

                        <div className="product-body">
                          <div className="product-meta-line">
                            <span>{perfume.tier}</span>
                            <span aria-hidden="true">·</span>
                            <span>{perfume.mood}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{perfume.longevityHours}h</span>
                          </div>

                          <div className="product-title-row">
                            <h3 className="product-title">{perfume.name}</h3>
                            <span className="product-price tabular-nums font-mono">
                              {perfume.tier === 'Everyday'
                                ? `From ${formatNaira(entryPrice)}`
                                : formatNaira(entryPrice)}
                            </span>
                          </div>

                          <p className="product-subtitle">{perfume.subtitle}</p>
                          <p className="product-occasion">{perfume.occasion}</p>

                          <div className="product-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleSelectPerfumeForConfig(perfume.id)}
                            >
                              Select Size
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                addItemToBag(perfume.id, 'crystal', entryVolume, '')
                              }
                            >
                              Add · {entryVolume}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: Nostelle Motion Films */}
          <MotionFilmSection onSelectPerfume={handleSelectPerfumeForConfig} />

          {/* SECTION 4: Sticky 4-Chapter Olfactory Showcase (Zero DOM Reparenting) */}
          <section id="showcase" ref={showcaseRef} className="showcase-pin">
            <div className="showcase-viewport" id="showcase-viewport">
              <div className="showcase-frames" id="showcase-frames">
                {SHOWCASE_CHAPTERS.map((stage, i) => (
                  <figure
                    key={stage.title}
                    ref={(el: HTMLElement | null) => {
                      frameRefs.current[i] = el;
                    }}
                    className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                    data-index={i}
                  >
                    <ImageWithFallback
                      src={stage.src}
                      alt={stage.alt}
                      className="showcase-img"
                      fallbackTitle={stage.title}
                    />
                  </figure>
                ))}
              </div>

              <div className="showcase-hud">
                <div
                  className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
                  id="showcase-caption"
                >
                  <p className="showcase-kicker tabular-nums">
                    Chapter 0{activeStage + 1} / 04
                  </p>
                  <h2 className="caption-title" id="caption-title">
                    {SHOWCASE_CHAPTERS[activeStage].title}
                  </h2>
                  <p className="caption-sub" id="caption-sub">
                    {SHOWCASE_CHAPTERS[activeStage].sub}
                  </p>
                </div>

                <div
                  className="showcase-dots"
                  role="tablist"
                  aria-label="Showcase chapters"
                >
                  {SHOWCASE_CHAPTERS.map((stage, i) => (
                    <button
                      key={stage.title}
                      type="button"
                      role="tab"
                      aria-selected={activeStage === i}
                      className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                      aria-label={`Chapter ${i + 1}: ${stage.title}`}
                      onClick={() => selectStage(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Day vs Prestige Evening Sillage Comparison + Craft Bento */}
          <section id="craft" className="thermal-section">
            <div className="container thermal-grid">
              <div
                className="comparison-wrap"
                id="comparison-wrap"
                onPointerDown={handleCompPointerDown}
                onPointerMove={handleCompPointerMove}
                onPointerUp={handleCompPointerUp}
                onPointerCancel={handleCompPointerUp}
              >
                <div className="comparison-layer comparison-hot">
                  <ImageWithFallback
                    src={CAMPAIGN_FILM_IMAGE}
                    alt="Warm golden-hour amber parfum flacon on sunlit linen"
                    className="comparison-img"
                    fallbackTitle="Everyday Warmth"
                  />
                </div>

                <div
                  className="comparison-layer comparison-cold"
                  style={{
                    clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                    transition: splitAnimate
                      ? 'clip-path 380ms var(--ease-out)'
                      : 'none',
                  }}
                >
                  <ImageWithFallback
                    src={PERFUMES[2].image}
                    alt="Smoked cedarwood flacon on dark volcanic basalt stone"
                    className="comparison-img"
                    fallbackTitle="Prestige Evening"
                  />
                </div>

                <div
                  className={`comparison-handle${
                    splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                  }`}
                  role="slider"
                  tabIndex={0}
                  aria-label="Compare Everyday warmth and Prestige evening accord"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(splitPct)}
                  style={{
                    left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                    transition: splitAnimate
                      ? 'left 380ms var(--ease-out)'
                      : 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                    if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                  }}
                >
                  <div className="handle-line" />
                  <div className="handle-knob">
                    <MoveHorizontal size={18} strokeWidth={2} aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="thermal-copy">
                <p className="eyebrow-line">Everyday Bright · Prestige Dark</p>
                <h2 className="section-title">From first spritz to midnight trail.</h2>
                <p className="section-sub">
                  One house, two moods: bright, open everyday oils for daily confidence
                  and deep espresso Prestige bottles for moments people remember.
                </p>

                <div
                  className="segmented-control"
                  role="tablist"
                  aria-label="Mood comparison"
                >
                  <button
                    type="button"
                    role="tab"
                    className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                    aria-selected={splitPct >= 98}
                    onClick={() => updateSplit(100, true)}
                  >
                    Prestige Evening
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                    aria-selected={splitPct <= 2}
                    onClick={() => updateSplit(0, true)}
                  >
                    Everyday Sunlit
                  </button>
                </div>

                <div className="thermal-metrics">
                  <div className="metric-item">
                    <span className="metric-value tabular-nums">₦3,000</span>
                    <span className="metric-label">Everyday oils from</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value tabular-nums">18h</span>
                    <span className="metric-label">Prestige longevity</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value tabular-nums">100%</span>
                    <span className="metric-label">Authentic stock</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="container bento-sub-wrap">
              <div className="bento-grid" ref={bentoGridRef}>
                <article className="bento-tile bento-tall reveal-tile">
                  <ImageWithFallback
                    src={PERFUMES[3].image}
                    alt="Jardin Blanc frosted flacon beside fresh jasmine blossoms"
                    className="bento-img"
                    fallbackTitle="The Prestige Edit"
                  />
                  <div className="bento-footer">
                    <h3 className="bento-title">For the moments worth remembering.</h3>
                    <p className="bento-sub">
                      The Prestige Edit — packed in crimson tissue and ivory presentation boxes
                    </p>
                  </div>
                </article>

                <article className="bento-tile bento-top reveal-tile">
                  <ImageWithFallback
                    src={PERFUMES[0].image}
                    alt="Figue and Sage frosted glass bottle with travertine cap"
                    className="bento-img"
                    fallbackTitle="Everyday Oils"
                  />
                  <div className="bento-footer">
                    <h3 className="bento-title">Everyday Finds</h3>
                    <p className="bento-sub">
                      Long-wearing oils and mists starting from ₦3,000
                    </p>
                  </div>
                </article>

                <article className="bento-tile bento-bottom reveal-tile">
                  <canvas
                    ref={specsCanvasRef}
                    id="specs-gl-canvas"
                    className="specs-canvas"
                    aria-hidden="true"
                  />
                  <div className="bento-footer bento-footer-specs">
                    <div>
                      <h3 className="bento-title">N-in-Bottle Stamp</h3>
                      <p className="bento-sub">Crimson seal · Custom monogramming</p>
                    </div>
                    <span className="spec-meta-text tabular-nums font-mono">
                      10 / 30 / 50 / 100 ml
                    </span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* SECTION 6: Interactive Nostelle Flacon & Monogram Configurator */}
          <section id="configure" className="order-section">
            <div className="container order-grid">
              <div className="order-preview" id="order-preview">
                <div className="order-plinth" aria-hidden="true" />
                <div
                  className="order-bottle-stage"
                  style={{ transform: `scale(${activeVolumeScale})` }}
                >
                  <ImageWithFallback
                    src={activeConfigPerfume.image}
                    alt={activeConfigPerfume.alt}
                    className="order-flacon-img"
                    id="order-flacon-img"
                    data-edition={configEdition}
                    width={520}
                    height={680}
                    fallbackTitle={activeConfigPerfume.name}
                  />
                  {engraving.trim() && configVolume !== '10 ml Oil' && (
                    <div
                      className="engraving-preview"
                      aria-label={`Engraving preview ${engraving}`}
                    >
                      {engraving.trim().toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="order-panel">
                <p className="eyebrow-line">
                  {activeConfigPerfume.tier} Tier · {activeConfigPerfume.mood} Mood ·{' '}
                  {activeConfigPerfume.concentration}
                </p>
                <h2 className="section-title">{activeConfigPerfume.name}</h2>
                <p className="order-price tabular-nums font-mono" id="order-price">
                  {formatNaira(activeConfigPrice)}
                </p>
                <p className="order-desc">{activeConfigPerfume.description}</p>

                <div className="config-group">
                  <span className="config-label">Fragrance Selection</span>
                  <div className="option-row">
                    {PERFUMES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`pill-option${
                          configPerfumeId === p.id ? ' is-active' : ''
                        }`}
                        onClick={() => setConfigPerfumeId(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="config-group">
                  <span className="config-label">Size & Format</span>
                  <div className="option-row">
                    {VOLUME_OPTIONS.map((opt) => (
                      <button
                        key={opt.volume}
                        type="button"
                        className={`pill-option${
                          configVolume === opt.volume ? ' is-active' : ''
                        }`}
                        onClick={() => setConfigVolume(opt.volume)}
                      >
                        <span>{opt.volume}</span>
                        <span className="option-sub-mono">{opt.formatLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {configVolume !== '10 ml Oil' && (
                  <>
                    <div className="config-group">
                      <span className="config-label">
                        Bottle Finish — {EDITION_META[configEdition].glassNote}
                      </span>
                      <div className="option-row">
                        {(Object.keys(EDITION_META) as EditionId[]).map((key) => {
                          const meta = EDITION_META[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              className={`pill-option${
                                configEdition === key ? ' is-active' : ''
                              }`}
                              onClick={() => setConfigEdition(key)}
                            >
                              <span
                                className="dot"
                                style={{ background: meta.dot }}
                              />
                              <span>{meta.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="config-group">
                      <label className="config-label" htmlFor="engraving-input">
                        Complimentary Monogram Engraving (up to 3 initials)
                      </label>
                      <input
                        id="engraving-input"
                        type="text"
                        maxLength={3}
                        value={engraving}
                        onChange={(e) => setEngraving(e.target.value.toUpperCase())}
                        placeholder="e.g. P.J"
                        className="field-input engraving-input"
                      />
                    </div>
                  </>
                )}

                <div className="spec-list">
                  <div className="spec-row">
                    <span className="spec-key">Top Notes</span>
                    <span className="spec-val">
                      {activeConfigPerfume.notes.top.join(' · ')}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Heart Notes</span>
                    <span className="spec-val">
                      {activeConfigPerfume.notes.heart.join(' · ')}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Base Notes</span>
                    <span className="spec-val">
                      {activeConfigPerfume.notes.base.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="order-cta-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    id="add-to-bag-btn"
                    onClick={() =>
                      addItemToBag(
                        configPerfumeId,
                        configEdition,
                        configVolume,
                        engraving
                      )
                    }
                  >
                    <Sparkles size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span className="tabular-nums">
                      Add to Bag — {formatNaira(activeConfigPrice)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand-wrap">
            <NostelleLogo variant="mark" className="footer-mark-svg" />
            <span className="footer-brand">Nostelle Fragrances</span>
          </div>
          <span className="footer-tag">
            By Peejay&apos;s Luxury · Some feelings never fade.
          </span>
          <div className="footer-right-links">
            <button
              type="button"
              className="footer-track-btn"
              onClick={() => {
                setView('tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Track Order
            </button>
            <span className="footer-copy">© 2026 Nostelle Fragrances</span>
          </div>
        </div>
      </footer>

      {/* Slide-Over Nostelle Bag Drawer */}
      <div
        className="drawer-backdrop"
        id="drawer-backdrop"
        hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="bag-drawer"
        id="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        hidden={!drawerOpen}
      >
        <div className="drawer-header">
          <h2 id="drawer-title" className="drawer-title">
            Nostelle Bag ({totalQty})
          </h2>
          <button
            type="button"
            className="icon-btn"
            id="drawer-close"
            aria-label="Close bag"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body" id="drawer-body">
          <div className="drawer-empty" id="drawer-empty" hidden={bag.length > 0}>
            <p>Your Nostelle bag is empty.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDrawerOpen(false);
                navigateToSection('#collection');
              }}
            >
              Explore Fragrances
            </button>
          </div>

          <div className="drawer-items" id="drawer-items" hidden={bag.length === 0}>
            {bag.map((item, idx) => {
              const perfume = getPerfumeById(item.perfumeId);
              return (
                <div
                  key={`${item.perfumeId}-${item.edition}-${item.volume}-${item.engraving}-${idx}`}
                  className="bag-item"
                >
                  <ImageWithFallback
                    src={perfume.image}
                    alt={perfume.alt}
                    className="bag-item-thumb"
                    data-edition={item.edition}
                    fallbackTitle={perfume.name}
                  />
                  <div className="bag-item-info">
                    <div className="bag-item-head">
                      <span className="bag-item-name">{perfume.name}</span>
                      <span className="tabular-nums font-mono">
                        {formatNaira(item.unitPrice * item.qty)}
                      </span>
                    </div>
                    <div className="bag-item-meta">
                      {item.volume === '10 ml Oil'
                        ? '10 ml Roll-on Oil'
                        : `${EDITION_META[item.edition].name} · ${item.volume}`}
                      {item.engraving ? ` · Monogram "${item.engraving}"` : ''}
                    </div>
                    <div className="bag-qty-row">
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label="Decrease quantity"
                        onClick={() => updateBagQty(idx, -1)}
                      >
                        -
                      </button>
                      <span className="bag-qty tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label="Increase quantity"
                        onClick={() => updateBagQty(idx, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="drawer-footer" id="drawer-footer" hidden={bag.length === 0}>
          <p className="drawer-sample-promise">
            Includes 2 complimentary 2 ml discovery vials & Paystack checkout.
          </p>
          <div className="drawer-total-row">
            <span>Subtotal</span>
            <span className="drawer-total tabular-nums" id="drawer-total">
              {formatNaira(totalPrice)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full"
            id="checkout-btn"
            onClick={() => {
              setDrawerOpen(false);
              setView('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
