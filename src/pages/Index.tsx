import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Sparkles, Shield, Zap, Eye, Heart, MessageCircle,
  Bookmark, Share2, TrendingUp, Shuffle, Clock, Moon, Timer, Brain, Link2,
  Star, CheckCircle2, ChevronRight, FileText, Lock, HelpCircle, Mail, Code2,
} from 'lucide-react';
import logo from '@/assets/logo.jpg';
import { PageMeta } from '@/components/seo/PageMeta';

/**
 * Extips Panel — "Cream Studio" light landing.
 * Palette: #FAF6EF cream, #0B1F4B navy, #E6398A magenta, #F5B700 gold, #6B7280 slate.
 * Type:    Fraunces display + Inter body.
 * Hero:    animated isometric conveyor scene (SVG + framer-motion).
 */

const C = {
  cream: '#FAF6EF',
  cream2: '#F1EBDE',
  navy: '#0B1F4B',
  navy2: '#1E2E5C',
  magenta: '#E6398A',
  magentaSoft: '#FCE7F1',
  gold: '#F5B700',
  slate: '#6B7280',
  line: 'rgba(11,31,75,.08)',
  lineStrong: 'rgba(11,31,75,.14)',
  paper: '#FFFFFF',
};

const displayFont = "'Fraunces', 'Times New Roman', serif";

const Chip: React.FC<{ children: React.ReactNode; tone?: 'navy' | 'magenta' }> = ({ children, tone = 'navy' }) => (
  <span
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em]"
    style={{
      color: tone === 'navy' ? C.navy : C.magenta,
      background: tone === 'navy' ? 'rgba(11,31,75,.05)' : C.magentaSoft,
      border: `1px solid ${tone === 'navy' ? C.line : 'rgba(230,57,138,.20)'}`,
    }}
  >
    {children}
  </span>
);

/* ─── Animated isometric hero scene ─── */
const HeroScene: React.FC = () => (
  <div className="relative w-full" style={{ aspectRatio: '1 / 1', maxWidth: 560, marginInline: 'auto' }}>
    {/* Ground shadow */}
    <div
      aria-hidden
      className="absolute left-1/2 -translate-x-1/2 rounded-full"
      style={{
        bottom: '4%', width: '80%', height: 40,
        background: 'radial-gradient(closest-side, rgba(11,31,75,.18), transparent 70%)',
        filter: 'blur(8px)',
      }}
    />

    <svg viewBox="0 0 500 500" className="relative w-full h-full">
      <defs>
        <linearGradient id="tile" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFE9DC" />
        </linearGradient>
        <linearGradient id="shopFront" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1EBDE" />
        </linearGradient>
        <linearGradient id="shopSide" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#EDE6D6" />
          <stop offset="100%" stopColor="#D9D0BC" />
        </linearGradient>
        <linearGradient id="shopTop" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F6F0E4" />
        </linearGradient>
        <linearGradient id="belt" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#E7DFCC" />
          <stop offset="100%" stopColor="#CFC6B0" />
        </linearGradient>
        <linearGradient id="box" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E8C68A" />
          <stop offset="100%" stopColor="#C69A57" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#D6AF6F" />
          <stop offset="100%" stopColor="#A87B3E" />
        </linearGradient>
        <linearGradient id="magenta" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F154A0" />
          <stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {/* Isometric floor tiles */}
      <g opacity="0.9">
        {[0, 1, 2, 3, 4].map(i => (
          <path
            key={i}
            d={`M ${60 + i * 78} 360 l 60 30 l 60 -30 l -60 -30 z`}
            fill="url(#tile)"
            stroke="rgba(11,31,75,.06)"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Conveyor belt — isometric */}
      <g>
        {/* belt top */}
        <path d="M 40 220 L 260 330 L 340 290 L 120 180 Z" fill="url(#belt)" stroke="rgba(11,31,75,.10)" />
        {/* belt side */}
        <path d="M 40 220 L 40 240 L 260 350 L 260 330 Z" fill="#B8AE96" />
        {/* belt lines */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line
            key={i}
            x1={70 + i * 42} y1={200 + i * 15}
            x2={130 + i * 42} y2={230 + i * 15}
            stroke="rgba(11,31,75,.10)" strokeWidth="1.2"
          />
        ))}
      </g>

      {/* Shop building */}
      <g>
        {/* Top */}
        <path d="M 250 210 L 400 285 L 470 250 L 320 175 Z" fill="url(#shopTop)" stroke="rgba(11,31,75,.08)" />
        {/* Front */}
        <path d="M 250 210 L 250 400 L 400 475 L 400 285 Z" fill="url(#shopFront)" stroke="rgba(11,31,75,.06)" />
        {/* Side */}
        <path d="M 400 285 L 400 475 L 470 440 L 470 250 Z" fill="url(#shopSide)" stroke="rgba(11,31,75,.06)" />

        {/* Magenta arched door */}
        <path
          d="M 290 305
             Q 290 275 315 287
             L 315 400
             L 290 388 Z"
          fill="url(#magenta)"
        />
        <path d="M 315 287 Q 315 258 340 270 L 340 412 L 315 400 Z" fill="#C71E75" opacity="0.85" />

        {/* Awning striped */}
        <g>
          <path d="M 400 285 L 470 250 L 470 275 L 400 310 Z" fill="#FFFFFF" />
          {[0, 1, 2, 3, 4].map(i => (
            <path
              key={i}
              d={`M ${410 + i * 12} ${300 - i * 6} l 12 -6 l 0 12 l -12 6 z`}
              fill={C.magenta}
              opacity="0.9"
            />
          ))}
          {/* awning skirt */}
          <path d="M 400 310 L 470 275 L 460 295 L 405 325 Z" fill={C.magenta} opacity="0.7" />
        </g>

        {/* Logo dot on front */}
        <circle cx="365" cy="330" r="10" fill={C.gold} />
        <text x="365" y="335" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.navy}>e</text>
      </g>

      {/* Animated boxes drifting along belt (framer-motion translates the group) */}
      <g />
    </svg>

    {/* Boxes as separate HTML/motion divs positioned absolutely for animation */}
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        aria-hidden
        className="absolute"
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{
          x: ['0%', '55%'],
          y: ['0%', '38%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 5.5,
          delay: i * 1.8,
          repeat: Infinity,
          ease: 'linear',
          times: [0, 0.08, 0.92, 1],
        }}
        style={{
          left: '6%',
          top: '30%',
          width: 78,
          height: 78,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* isometric box */}
          <path d="M 50 20 L 90 40 L 50 60 L 10 40 Z" fill="url(#box)" stroke="rgba(11,31,75,.15)" />
          <path d="M 10 40 L 10 70 L 50 90 L 50 60 Z" fill="url(#boxSide)" stroke="rgba(11,31,75,.15)" />
          <path d="M 50 60 L 90 40 L 90 70 L 50 90 Z" fill="#B78949" stroke="rgba(11,31,75,.15)" />
          {/* label */}
          <text x="30" y="76" fontSize="9" fill="#5C3E14" fontWeight="700" transform="rotate(-16 30 76)">extips</text>
        </svg>
      </motion.div>
    ))}

    {/* Floating engagement chips — each icon has its own micro-animation */}
    {([
      {
        pos: { top: '4%', left: '0%' },
        label: '+2,410 views',
        color: C.navy,
        float: [0, -6, 0],
        dur: 4,
        delay: 0,
        icon: (
          <motion.span
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Eye className="w-3.5 h-3.5" style={{ color: C.navy }} />
          </motion.span>
        ),
      },
      {
        pos: { top: '22%', right: '-6%' },
        label: '+318 likes',
        color: C.magenta,
        float: [0, 6, 0],
        dur: 4.5,
        delay: 0.6,
        icon: (
          <motion.span
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.4 }}
            className="inline-flex"
          >
            <Heart className="w-3.5 h-3.5" fill={C.magenta} style={{ color: C.magenta }} />
          </motion.span>
        ),
      },
      {
        pos: { top: '46%', left: '-4%' },
        label: '+92 comments',
        color: C.navy,
        float: [0, -5, 0],
        dur: 5,
        delay: 1.1,
        icon: (
          <motion.span
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex origin-bottom"
          >
            <MessageCircle className="w-3.5 h-3.5" style={{ color: C.navy }} />
          </motion.span>
        ),
      },
      {
        pos: { top: '58%', right: '-8%' },
        label: '+204 saves',
        color: C.gold,
        float: [0, 5, 0],
        dur: 4.8,
        delay: 1.6,
        icon: (
          <motion.span
            animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Bookmark className="w-3.5 h-3.5" fill={C.gold} style={{ color: C.gold }} />
          </motion.span>
        ),
      },
      {
        pos: { bottom: '14%', left: '2%' },
        label: '+147 shares',
        color: C.navy,
        float: [0, -6, 0],
        dur: 5.2,
        delay: 2.1,
        icon: (
          <motion.span
            animate={{ x: [0, 3, 0], rotate: [0, 12, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Share2 className="w-3.5 h-3.5" style={{ color: C.navy }} />
          </motion.span>
        ),
      },
      {
        pos: { bottom: '2%', right: '6%' },
        label: '+68 reposts',
        color: C.magenta,
        float: [0, -5, 0],
        dur: 5.4,
        delay: 2.6,
        icon: (
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            className="inline-flex"
          >
            <Shuffle className="w-3.5 h-3.5" style={{ color: C.magenta }} />
          </motion.span>
        ),
      },
    ] as const).map((chip, i) => (
      <motion.div
        key={i}
        className="absolute flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          ...chip.pos,
          background: C.paper,
          border: `1px solid ${C.line}`,
          boxShadow: '0 12px 30px rgba(11,31,75,.08)',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: chip.float as unknown as number[] }}
        transition={{
          opacity: { duration: 0.5, delay: chip.delay * 0.3 },
          scale: { duration: 0.5, delay: chip.delay * 0.3 },
          y: { duration: chip.dur, repeat: Infinity, ease: 'easeInOut', delay: chip.delay },
        }}
      >
        {chip.icon}
        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: C.navy }}>
          {chip.label}
        </span>
      </motion.div>
    ))}
  </div>
);

const Index = () => {
  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ background: C.cream, color: C.navy, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <PageMeta
        title="Extips Panel — Growth that behaves like real audiences"
        description="Human-pattern social growth for Instagram, YouTube and TikTok. Cream-studio delivery — no spikes, no bans, just organic momentum."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&display=swap"
      />

      {/* Ambient cream wash */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
             style={{ background: `radial-gradient(closest-side, ${C.magentaSoft}, transparent 70%)`, filter: 'blur(30px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full"
             style={{ background: `radial-gradient(closest-side, rgba(245,183,0,.12), transparent 70%)`, filter: 'blur(40px)' }} />
      </div>

      {/* ══════ NAV — floating pill ══════ */}
      <nav className="sticky top-4 z-50 w-full px-3 sm:px-6">
        <div
          className="max-w-6xl mx-auto flex items-center justify-between h-14 pl-3 pr-2 rounded-full"
          style={{
            background: 'rgba(255,255,255,.82)',
            backdropFilter: 'blur(18px) saturate(160%)',
            border: `1px solid ${C.line}`,
            boxShadow: '0 12px 40px rgba(11,31,75,.08)',
          }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Extips Panel"
              className="w-8 h-8 rounded-xl object-cover"
              style={{ border: `1px solid ${C.line}` }}
            />
            <span className="text-[15px] font-bold tracking-tight" style={{ color: C.navy }}>
              extips<span style={{ color: C.magenta }}>.</span>panel
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px]" style={{ color: C.slate }}>
            <a href="#features" className="hover:text-[color:var(--nav-ink)] transition-colors" style={{ ['--nav-ink' as any]: C.navy }}>Features</a>
            <a href="#how-it-works" className="hover:text-[color:var(--nav-ink)] transition-colors" style={{ ['--nav-ink' as any]: C.navy }}>How it works</a>
            <a href="#comparison" className="hover:text-[color:var(--nav-ink)] transition-colors" style={{ ['--nav-ink' as any]: C.navy }}>Why us</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex h-9 px-3.5 items-center text-[13px] font-medium" style={{ color: C.navy }}>
              Login
            </Link>
            <Link
              to="/auth"
              className="h-10 px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5"
              style={{
                background: C.magenta,
                color: '#fff',
                boxShadow: `0 10px 24px ${C.magenta}55`,
              }}
            >
              Start free <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ══════ HERO ══════ */}
        <section className="pt-10 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr,1fr] gap-10 lg:gap-12 items-center">
            {/* LEFT — copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Chip tone="magenta">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: C.magenta, boxShadow: `0 0 10px ${C.magenta}` }} />
                v2.0 · Human-pattern engine
              </Chip>

              <h1
                className="mt-6 text-[3rem] sm:text-[4rem] lg:text-[5rem] leading-[0.95] tracking-[-0.035em] font-black"
                style={{ fontFamily: displayFont, color: C.navy }}
              >
                Grow your<br />
                socials the<br />
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.magenta }}>human way.</em>
              </h1>

              <p className="mt-6 max-w-lg text-[15px] sm:text-[16.5px] leading-[1.65]" style={{ color: C.slate }}>
                Extips Panel choreographs every view, like and comment on a rhythm real
                audiences already follow — no spikes, no floods, no risk to your handles.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div
                  className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full flex-1 sm:flex-none sm:min-w-[380px]"
                  style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: '0 10px 24px rgba(11,31,75,.06)' }}
                >
                  <Link2 className="w-4 h-4 shrink-0" style={{ color: C.slate }} />
                  <input
                    readOnly
                    placeholder="Paste your Instagram / TikTok / YT link"
                    className="flex-1 bg-transparent outline-none text-[13.5px] py-2"
                    style={{ color: C.navy }}
                  />
                  <Link
                    to="/auth"
                    className="h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                    style={{ background: C.magenta, color: '#fff', boxShadow: `0 8px 20px ${C.magenta}55` }}
                    aria-label="Start"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px]" style={{ color: C.slate }}>
                {['No card needed', 'Every tool unlocked', 'Ready in 60 seconds'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.magenta }} /> {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: C.gold }} />
                  ))}
                  <span className="text-[12.5px] font-semibold ml-1">4.9/5</span>
                  <span className="text-[12px]" style={{ color: C.slate }}>· 2,400+ creators</span>
                </div>
                <span className="h-4 w-px" style={{ background: C.line }} />
                <span className="text-[12.5px]" style={{ color: C.slate }}>
                  <strong style={{ color: C.navy }}>50,000+</strong> campaigns shipped
                </span>
              </div>
            </motion.div>

            {/* RIGHT — animated scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            >
              <HeroScene />
            </motion.div>
          </div>
        </section>

        {/* ══════ FEATURES ══════ */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Chip><Zap className="w-3 h-3" /> Tools you won't find elsewhere</Chip>
              <h2
                className="mt-5 text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] font-black tracking-[-0.02em]"
                style={{ fontFamily: displayFont, color: C.navy }}
              >
                Tuned to move{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.magenta }}>like real people do.</em>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { icon: TrendingUp, title: 'S-Curve Rollout', desc: 'Momentum builds like a real trend' },
                { icon: Shuffle, title: '±50% Variance', desc: 'Batch sizes shift every drop' },
                { icon: Clock, title: 'Peak-Hour Push', desc: '1.5× lift during 6–10 PM IST' },
                { icon: Moon, title: 'Overnight Ease-Off', desc: 'Mimics real sleep cycles' },
                { icon: Timer, title: '±5min Jitter', desc: 'Timing no bot can fake' },
                { icon: Eye, title: 'Live Preview', desc: 'Watch the plan before you pay' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl p-4 sm:p-5"
                  style={{
                    background: C.paper,
                    border: `1px solid ${C.line}`,
                    boxShadow: '0 4px 20px rgba(11,31,75,.04)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: i % 2 === 0 ? C.magentaSoft : 'rgba(245,183,0,.14)',
                    }}
                  >
                    <f.icon className="w-4 h-4" style={{ color: i % 2 === 0 ? C.magenta : '#B48800' }} />
                  </div>
                  <h3 className="text-[13px] font-bold mb-1" style={{ color: C.navy }}>{f.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: C.slate }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ COMPARISON ══════ */}
        <section id="comparison" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
          <div
            className="max-w-5xl mx-auto rounded-[28px] overflow-hidden"
            style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              boxShadow: '0 20px 60px rgba(11,31,75,.08)',
            }}
          >
            <div className="grid md:grid-cols-2">
              <div className="p-7 sm:p-10" style={{ borderRight: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                       style={{ background: C.cream2, color: C.slate }}>×</div>
                  <span className="text-[14px] font-semibold" style={{ color: C.slate }}>Typical SMM panels</span>
                </div>
                {[
                  'Identical batches every run — instant giveaway',
                  'Clockwork intervals — bots leave a fingerprint',
                  'Non-stop dumping — nothing looks human',
                  'Handles get shadow-flagged or wiped',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: '#EF4444' }} />
                    <span className="text-[13px] leading-relaxed" style={{ color: C.slate }}>{t}</span>
                  </div>
                ))}
              </div>
              <div className="p-7 sm:p-10 relative"
                   style={{ background: `linear-gradient(135deg, ${C.magentaSoft} 0%, ${C.paper} 100%)` }}>
                <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: C.magenta, color: '#fff' }}>Our approach</span>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                       style={{ background: '#fff', border: `1px solid ${C.line}` }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: C.magenta }} />
                  </div>
                  <span className="text-[14px] font-semibold" style={{ color: C.navy }}>Extips Panel</span>
                </div>
                {[
                  'Every drop is a fresh shape — reads like real fans',
                  'Micro-jittered timing — no repeating cadence',
                  'Prime-time lift, quiet nights — matches user habits',
                  'Zero bans logged across 50k+ deliveries',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: C.magenta }} />
                    <span className="text-[13px] leading-relaxed" style={{ color: C.navy }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 py-5 px-6 text-[12.5px]"
                 style={{ borderTop: `1px solid ${C.line}`, background: C.cream, color: C.slate }}>
              <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" style={{ color: C.magenta }} /> 50,000+ campaigns</span>
              <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" style={{ color: C.magenta }} /> Zero handles banned</span>
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" style={{ color: C.magenta }} /> 99.9% uptime</span>
            </div>
          </div>
        </section>

        {/* ══════ HOW IT WORKS ══════ */}
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Chip><Sparkles className="w-3 h-3" /> How it works</Chip>
              <h2
                className="mt-5 text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] font-black tracking-[-0.02em]"
                style={{ fontFamily: displayFont, color: C.navy }}
              >
                Drop one link.{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.magenta }}>Everything else runs on its own.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', icon: Link2, title: 'Drop the URL', desc: 'Paste any Instagram, YouTube or TikTok link — that single input is all we need.' },
                { step: '02', icon: Sparkles, title: 'Choose the mix', desc: 'Flip on views, likes, comments, saves or shares and dial in your goal.' },
                { step: '03', icon: Brain, title: 'Engine plans it', desc: 'S-curve pacing, ±50% variance, peak-hour lifts, calm nights — laid out for you.' },
                { step: '04', icon: TrendingUp, title: 'Watch it unfold', desc: 'Everything rolls in gradually, tracked live, with your handles staying safe.' },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative rounded-2xl p-5"
                  style={{
                    background: C.paper, border: `1px solid ${C.line}`,
                    boxShadow: '0 8px 24px rgba(11,31,75,.05)',
                  }}
                >
                  <span className="absolute -top-3 -right-3 text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: C.navy, color: '#fff' }}>{s.step}</span>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                       style={{ background: C.magentaSoft }}>
                    <s.icon className="w-5 h-5" style={{ color: C.magenta }} />
                  </div>
                  <h3 className="text-[14.5px] font-bold mb-1.5" style={{ color: C.navy }}>{s.title}</h3>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: C.slate }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA ══════ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
          <div
            className="max-w-4xl mx-auto rounded-[32px] text-center py-14 sm:py-20 px-6 sm:px-10 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.magentaSoft} 100%)`,
              border: `1px solid ${C.line}`,
              boxShadow: '0 20px 60px rgba(230,57,138,.14)',
            }}
          >
            <motion.div
              aria-hidden
              className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${C.magenta}22, transparent 70%)`, filter: 'blur(40px)' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <Chip tone="magenta"><Sparkles className="w-3 h-3" /> Free onboarding</Chip>
              <h2
                className="mt-5 text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] font-black tracking-[-0.02em]"
                style={{ fontFamily: displayFont, color: C.navy }}
              >
                Time to grow the{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.magenta }}>human way</em>?
              </h2>
              <p className="mt-4 max-w-md mx-auto text-[15px]" style={{ color: C.slate }}>
                Thousands of creators are already scaling with human-pattern delivery.
                Jump in without touching your wallet.
              </p>
              <Link
                to="/auth"
                className="mt-8 inline-flex h-12 px-8 rounded-full text-[14px] font-bold items-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{ background: C.magenta, color: '#fff', boxShadow: `0 14px 30px ${C.magenta}55` }}
              >
                Open my free account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="pt-14 pb-10 px-4 sm:px-6 lg:px-10" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src={logo} alt="Extips Panel" className="w-9 h-9 rounded-xl object-cover" style={{ border: `1px solid ${C.line}` }} />
                <span className="text-[15px] font-bold" style={{ color: C.navy }}>Extips Panel</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: C.slate }}>
                Cream-studio organic growth for creators. Human-pattern delivery, calibrated for every platform.
              </p>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.navy }}>Product</h3>
              <div className="space-y-2.5">
                <Link to="/auth" className="block text-[13px]" style={{ color: C.slate }}>Get started</Link>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.navy }}>Legal</h3>
              <div className="space-y-2.5">
                {[
                  { to: '/terms', icon: FileText, label: 'Terms' },
                  { to: '/privacy', icon: Lock, label: 'Privacy' },
                  { to: '/refund', icon: FileText, label: 'Refund' },
                  { to: '/shipping', icon: FileText, label: 'Shipping' },
                  { to: '/cookies', icon: FileText, label: 'Cookies' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.slate }}>
                    <l.icon className="w-3 h-3" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.navy }}>Support</h3>
              <div className="space-y-2.5">
                {[
                  { to: '/about', icon: HelpCircle, label: 'About us' },
                  { to: '/contact', icon: Mail, label: 'Contact' },
                  { to: '/support', icon: HelpCircle, label: 'Help center' },
                  { to: '/api-access', icon: Code2, label: 'API docs' },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.slate }}>
                    <l.icon className="w-3 h-3" /> {l.label}
                  </Link>
                ))}
                <a href="mailto:support@extipspanel.com" className="block text-[12px] mt-2" style={{ color: C.slate }}>support@extipspanel.com</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[12px]"
               style={{ borderTop: `1px solid ${C.line}`, color: C.slate }}>
            <p>© {new Date().getFullYear()} Extips Panel LLC — Dover, Delaware, USA.</p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" style={{ color: C.magenta }} /> SSL secured</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" style={{ color: C.magenta }} /> 99.9% uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
