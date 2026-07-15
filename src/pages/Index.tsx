import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Sparkles, Shield, Zap, Eye, Heart, MessageCircle,
  Bookmark, Share2, TrendingUp, Shuffle, Clock, Moon, Timer, Brain, Link2,
  Star, CheckCircle2, ChevronRight, FileText, Lock, HelpCircle, Mail, Code2,
} from 'lucide-react';
import logo from '@/assets/logo.jpg';
import { PageMeta } from '@/components/seo/PageMeta';

/**
 * Extips Panel — "Deep Ocean Glow" landing.
 * Palette: #05070E ink, #EAF2FF paper, #3A86FF blue, #00D4FF aqua, #B15CFF violet.
 * Type: Fraunces (display serif) + Inter (body).
 */

const C = {
  ink: '#05070E',
  ink2: '#0B1024',
  surface: '#0A1024',
  surface2: '#0E1633',
  line: 'rgba(234,242,255,.08)',
  lineStrong: 'rgba(234,242,255,.14)',
  paper: '#EAF2FF',
  mute: 'rgba(234,242,255,.62)',
  mute2: 'rgba(234,242,255,.42)',
  blue: '#3A86FF',
  aqua: '#00D4FF',
  violet: '#B15CFF',
  gold: '#FFD166',
};

const displayFont = "'Fraunces', 'Times New Roman', serif";

const Chip: React.FC<{ children: React.ReactNode; tone?: 'aqua' | 'violet' }> = ({ children, tone = 'aqua' }) => (
  <span
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em]"
    style={{
      color: tone === 'aqua' ? C.aqua : C.violet,
      background: tone === 'aqua' ? 'rgba(0,212,255,.08)' : 'rgba(177,92,255,.10)',
      border: `1px solid ${tone === 'aqua' ? 'rgba(0,212,255,.28)' : 'rgba(177,92,255,.30)'}`,
    }}
  >
    {children}
  </span>
);

const Index = () => {
  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: C.ink,
        color: C.paper,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <PageMeta
        title="Extips Panel — Growth that behaves like real audiences"
        description="Human-pattern social growth for Instagram, YouTube and TikTok. Deep-ocean smart delivery — no spikes, no bans, just organic momentum."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* Google Font — Fraunces */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&display=swap"
      />

      {/* Ambient aurora background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-64 -left-40 w-[820px] h-[820px] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${C.blue}55, transparent 70%)`, filter: 'blur(60px)' }}
        />
        <div
          className="absolute top-[10%] right-[-15%] w-[700px] h-[700px] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${C.violet}44, transparent 70%)`, filter: 'blur(70px)' }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] w-[900px] h-[900px] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${C.aqua}33, transparent 70%)`, filter: 'blur(80px)' }}
        />
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(234,242,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* ══════ NAV ══════ */}
      <nav className="sticky top-4 z-50 w-full px-3 sm:px-6">
        <div
          className="max-w-6xl mx-auto flex items-center justify-between h-14 pl-3 pr-2 rounded-full"
          style={{
            background: 'rgba(10,16,36,.72)',
            backdropFilter: 'blur(18px) saturate(160%)',
            border: `1px solid ${C.lineStrong}`,
            boxShadow: '0 20px 60px rgba(0,0,0,.4)',
          }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className="absolute -inset-1 rounded-2xl blur-md opacity-70"
                style={{ background: `linear-gradient(135deg, ${C.aqua}, ${C.violet})` }}
              />
              <img
                src={logo}
                alt="Extips Panel"
                className="relative w-8 h-8 rounded-xl object-cover"
                style={{ border: `1px solid ${C.lineStrong}` }}
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: C.paper }}>
              Extips <span style={{ color: C.aqua }}>Panel</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px]" style={{ color: C.mute }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#comparison" className="hover:text-white transition-colors">Why us</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex h-9 px-3.5 items-center text-[13px]" style={{ color: C.mute }}>
              Sign in
            </Link>
            <Link
              to="/auth"
              className="h-10 px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5"
              style={{
                background: `linear-gradient(135deg, ${C.aqua}, ${C.blue})`,
                color: C.ink,
                boxShadow: `0 8px 24px ${C.aqua}55`,
              }}
            >
              Get started <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ══════ HERO — split screen ══════ */}
        <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.15fr,1fr] gap-10 lg:gap-14 items-center">
            {/* LEFT */}
            <div>
              <Chip>
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: C.aqua, boxShadow: `0 0 12px ${C.aqua}` }}
                />
                v2.0 · Human-pattern engine live
              </Chip>

              <h1
                className="mt-6 text-[2.6rem] sm:text-[3.6rem] lg:text-[4.6rem] leading-[0.98] tracking-[-0.03em] font-black"
                style={{ fontFamily: displayFont, color: C.paper }}
              >
                Growth that <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.aqua }}>breathes</em>
                <br />
                like a real audience.
              </h1>

              <p className="mt-6 max-w-xl text-[15.5px] sm:text-[17px] leading-[1.65]" style={{ color: C.mute }}>
                Extips Panel choreographs every view, like and comment on a rhythm your platform
                already trusts. Deep-ocean delivery — no floods, no fingerprints, no risk to your handles.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto h-12 px-6 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${C.aqua}, ${C.blue} 55%, ${C.violet})`,
                    color: C.ink,
                    boxShadow: `0 14px 40px ${C.blue}55`,
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Launch my account free
                </Link>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto h-12 px-6 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2"
                  style={{
                    color: C.paper,
                    background: 'rgba(234,242,255,.04)',
                    border: `1px solid ${C.lineStrong}`,
                  }}
                >
                  Explore the catalog <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px]" style={{ color: C.mute2 }}>
                {['No card needed', 'Every tool unlocked', 'Ready in a minute'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.aqua }} /> {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: C.gold }} />
                  ))}
                  <span className="text-[12.5px] font-semibold ml-1">4.9/5</span>
                  <span className="text-[12px]" style={{ color: C.mute2 }}>· 2,400+ creators</span>
                </div>
                <span className="h-4 w-px" style={{ background: C.lineStrong }} />
                <span className="text-[12.5px]" style={{ color: C.mute }}>
                  <strong style={{ color: C.paper }}>50,000+</strong> campaigns shipped
                </span>
              </div>
            </div>

            {/* RIGHT — animated delivery card */}
            <div className="relative">
              <div
                className="relative rounded-[28px] p-5 sm:p-6"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(14,22,51,.9) 0%, rgba(10,16,36,.9) 100%)',
                  border: `1px solid ${C.lineStrong}`,
                  boxShadow: `0 30px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(234,242,255,.06)`,
                }}
              >
                {/* Terminal-style header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.gold }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.aqua }} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.mute2 }}>
                    live delivery
                  </span>
                </div>

                {/* Link input */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                  style={{ background: 'rgba(234,242,255,.04)', border: `1px dashed ${C.lineStrong}` }}
                >
                  <Link2 className="w-4 h-4" style={{ color: C.aqua }} />
                  <span className="text-[12px] font-mono truncate" style={{ color: C.mute }}>
                    https://instagram.com/p/your-post
                  </span>
                </div>

                {/* SVG delivery chart */}
                <div
                  className="relative rounded-2xl p-4 mb-4"
                  style={{
                    background: `radial-gradient(circle at 30% 0%, ${C.violet}22, transparent 60%), ${C.surface2}`,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] mb-2" style={{ color: C.mute2 }}>
                    <span>ORGANIC CURVE</span>
                    <span style={{ color: C.aqua }}>+312% · 24h</span>
                  </div>
                  <svg viewBox="0 0 300 100" className="w-full h-24">
                    <defs>
                      <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={C.aqua} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={C.aqua} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="line" x1="0" x2="1">
                        <stop offset="0%" stopColor={C.aqua} />
                        <stop offset="50%" stopColor={C.blue} />
                        <stop offset="100%" stopColor={C.violet} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,88 C40,80 60,72 90,60 C120,50 140,55 170,42 C200,30 220,18 260,12 L300,8 L300,100 L0,100 Z"
                      fill="url(#area)"
                    />
                    <path
                      d="M0,88 C40,80 60,72 90,60 C120,50 140,55 170,42 C200,30 220,18 260,12 L300,8"
                      stroke="url(#line)"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* dotted human jitter markers */}
                    {[
                      { x: 30, y: 82 }, { x: 90, y: 60 }, { x: 170, y: 42 }, { x: 260, y: 12 },
                    ].map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="6" fill={C.aqua} opacity="0.15" />
                        <circle cx={p.x} cy={p.y} r="2.5" fill={C.aqua} />
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Engagement mix */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { icon: Eye, label: 'Views', color: C.aqua },
                    { icon: Heart, label: 'Likes', color: '#FF5D8F' },
                    { icon: MessageCircle, label: 'Comments', color: C.violet },
                    { icon: Bookmark, label: 'Saves', color: C.gold },
                    { icon: Share2, label: 'Shares', color: C.blue },
                  ].map(e => (
                    <div
                      key={e.label}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl"
                      style={{ background: 'rgba(234,242,255,.03)', border: `1px solid ${C.line}` }}
                    >
                      <e.icon className="w-4 h-4" style={{ color: e.color }} />
                      <span className="text-[10px] font-semibold" style={{ color: C.mute }}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chips */}
              <div
                className="hidden sm:flex absolute -top-4 -left-4 items-center gap-2 px-3 py-2 rounded-full"
                style={{
                  background: 'rgba(10,16,36,.92)',
                  border: `1px solid ${C.lineStrong}`,
                  boxShadow: `0 10px 30px rgba(0,0,0,.4)`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: C.aqua, boxShadow: `0 0 10px ${C.aqua}` }}
                />
                <span className="text-[11px] font-semibold">Views leading · likes trailing</span>
              </div>
              <div
                className="hidden sm:flex absolute -bottom-4 -right-3 items-center gap-2 px-3 py-2 rounded-full"
                style={{
                  background: 'rgba(10,16,36,.92)',
                  border: `1px solid ${C.lineStrong}`,
                  boxShadow: `0 10px 30px rgba(0,0,0,.4)`,
                }}
              >
                <Shield className="w-3.5 h-3.5" style={{ color: C.aqua }} />
                <span className="text-[11px] font-semibold">Zero bans · 50k+ orders</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ FEATURES ══════ */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Chip tone="violet"><Zap className="w-3 h-3" /> Tools you won't find elsewhere</Chip>
              <h2
                className="mt-5 text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] font-black tracking-[-0.02em]"
                style={{ fontFamily: displayFont }}
              >
                Tuned to move{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.aqua }}>like real people do.</em>
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
                <div
                  key={f.title}
                  className="group rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(180deg, rgba(14,22,51,.7), rgba(10,16,36,.6))',
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: i % 2 === 0 ? 'rgba(0,212,255,.12)' : 'rgba(177,92,255,.14)',
                      border: `1px solid ${i % 2 === 0 ? 'rgba(0,212,255,.25)' : 'rgba(177,92,255,.28)'}`,
                    }}
                  >
                    <f.icon className="w-4 h-4" style={{ color: i % 2 === 0 ? C.aqua : C.violet }} />
                  </div>
                  <h3 className="text-[13px] font-bold mb-1" style={{ color: C.paper }}>{f.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: C.mute2 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ COMPARISON ══════ */}
        <section id="comparison" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
          <div
            className="max-w-5xl mx-auto rounded-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(14,22,51,.85), rgba(10,16,36,.85))',
              border: `1px solid ${C.lineStrong}`,
              boxShadow: '0 30px 80px rgba(0,0,0,.4)',
            }}
          >
            <div className="grid md:grid-cols-2">
              <div className="p-7 sm:p-10" style={{ borderRight: `1px solid ${C.line}` }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                    style={{ background: 'rgba(234,242,255,.06)', color: C.mute }}
                  >×</div>
                  <span className="text-[14px] font-semibold" style={{ color: C.mute }}>Typical SMM panels</span>
                </div>
                {[
                  'Identical batches every run — instant giveaway',
                  'Clockwork intervals — bots leave a fingerprint',
                  'Non-stop dumping — nothing looks human',
                  'Handles get shadow-flagged or wiped',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: '#FF5D8F' }} />
                    <span className="text-[13px] leading-relaxed" style={{ color: C.mute }}>{t}</span>
                  </div>
                ))}
              </div>
              <div
                className="p-7 sm:p-10 relative"
                style={{
                  background: `radial-gradient(circle at 100% 0%, ${C.aqua}18, transparent 60%)`,
                }}
              >
                <span
                  className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: C.aqua, color: C.ink }}
                >Our approach</span>
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,212,255,.14)' }}
                  ><CheckCircle2 className="w-4 h-4" style={{ color: C.aqua }} /></div>
                  <span className="text-[14px] font-semibold" style={{ color: C.paper }}>Extips Panel</span>
                </div>
                {[
                  'Every drop is a fresh shape — reads like real fans',
                  'Micro-jittered timing — no repeating cadence',
                  'Prime-time lift, quiet nights — matches user habits',
                  'Zero bans logged across 50k+ deliveries',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: C.aqua }} />
                    <span className="text-[13px] leading-relaxed" style={{ color: C.paper }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="flex flex-wrap justify-center gap-6 sm:gap-10 py-5 px-6 text-[12.5px]"
              style={{ borderTop: `1px solid ${C.line}`, background: 'rgba(5,7,14,.5)', color: C.mute }}
            >
              <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" style={{ color: C.aqua }} /> 50,000+ campaigns</span>
              <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" style={{ color: C.aqua }} /> Zero handles banned</span>
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" style={{ color: C.aqua }} /> 99.9% uptime</span>
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
                style={{ fontFamily: displayFont }}
              >
                Drop one link.{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.violet }}>Everything else runs on its own.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', icon: Link2, title: 'Drop the URL', desc: 'Paste any Instagram, YouTube or TikTok link — that single input is all we need.' },
                { step: '02', icon: Sparkles, title: 'Choose the mix', desc: 'Flip on views, likes, comments, saves or shares and dial in your goal.' },
                { step: '03', icon: Brain, title: 'Engine plans it', desc: 'S-curve pacing, ±50% variance, peak-hour lifts, calm nights — laid out for you.' },
                { step: '04', icon: TrendingUp, title: 'Watch it unfold', desc: 'Everything rolls in gradually, tracked live, with your handles staying safe.' },
              ].map(s => (
                <div
                  key={s.step}
                  className="relative rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(14,22,51,.7), rgba(10,16,36,.6))',
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <span
                    className="absolute -top-3 -right-3 text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: C.ink, color: C.aqua, border: `1px solid ${C.aqua}55` }}
                  >{s.step}</span>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,212,255,.10)', border: `1px solid rgba(0,212,255,.24)` }}
                  >
                    <s.icon className="w-5 h-5" style={{ color: C.aqua }} />
                  </div>
                  <h3 className="text-[14.5px] font-bold mb-1.5" style={{ color: C.paper }}>{s.title}</h3>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: C.mute }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA ══════ */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
          <div
            className="max-w-4xl mx-auto rounded-[32px] text-center py-14 sm:py-20 px-6 sm:px-10 relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,212,255,.10) 0%, rgba(58,134,255,.08) 40%, rgba(177,92,255,.10) 100%)',
              border: `1px solid ${C.lineStrong}`,
            }}
          >
            <div
              aria-hidden
              className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${C.aqua}55, transparent 70%)`, filter: 'blur(60px)' }}
            />
            <div
              aria-hidden
              className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${C.violet}55, transparent 70%)`, filter: 'blur(60px)' }}
            />
            <div className="relative">
              <Chip><Sparkles className="w-3 h-3" /> Free onboarding</Chip>
              <h2
                className="mt-5 text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.05] font-black tracking-[-0.02em]"
                style={{ fontFamily: displayFont }}
              >
                Time to grow the{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.aqua }}>human way</em>?
              </h2>
              <p className="mt-4 max-w-md mx-auto text-[15px]" style={{ color: C.mute }}>
                Thousands of creators are already scaling with human-pattern delivery — jump in
                without touching your wallet.
              </p>
              <Link
                to="/auth"
                className="mt-8 inline-flex h-12 px-8 rounded-full text-[14px] font-bold items-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${C.aqua}, ${C.blue} 55%, ${C.violet})`,
                  color: C.ink,
                  boxShadow: `0 14px 40px ${C.blue}55`,
                }}
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
                <img src={logo} alt="Extips Panel" className="w-9 h-9 rounded-xl object-cover" style={{ border: `1px solid ${C.lineStrong}` }} />
                <span className="text-[15px] font-semibold" style={{ color: C.paper }}>Extips Panel</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: C.mute2 }}>
                Deep-ocean organic growth for creators. Human-pattern delivery, calibrated for every platform.
              </p>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.mute }}>Product</h3>
              <div className="space-y-2.5">
                <Link to="/auth" className="block text-[13px]" style={{ color: C.mute2 }}>Get started</Link>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.mute }}>Legal</h3>
              <div className="space-y-2.5">
                {[
                  { to: '/terms', icon: FileText, label: 'Terms' },
                  { to: '/privacy', icon: Lock, label: 'Privacy' },
                  { to: '/refund', icon: FileText, label: 'Refund' },
                  { to: '/shipping', icon: FileText, label: 'Shipping' },
                  { to: '/cookies', icon: FileText, label: 'Cookies' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.mute2 }}>
                    <l.icon className="w-3 h-3" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.mute }}>Support</h3>
              <div className="space-y-2.5">
                {[
                  { to: '/about', icon: HelpCircle, label: 'About us' },
                  { to: '/contact', icon: Mail, label: 'Contact' },
                  { to: '/support', icon: HelpCircle, label: 'Help center' },
                  { to: '/api-access', icon: Code2, label: 'API docs' },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.mute2 }}>
                    <l.icon className="w-3 h-3" /> {l.label}
                  </Link>
                ))}
                <a href="mailto:support@extipspanel.com" className="block text-[12px] mt-2" style={{ color: C.mute2 }}>support@extipspanel.com</a>
                <a href="tel:+13678288027" className="block text-[12px]" style={{ color: C.mute2 }}>+1 (367) 828-8027</a>
              </div>
            </div>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[12px]"
            style={{ borderTop: `1px solid ${C.line}`, color: C.mute2 }}
          >
            <p>© {new Date().getFullYear()} Extips Panel LLC — Dover, Delaware, USA.</p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" style={{ color: C.aqua }} /> SSL secured</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" style={{ color: C.aqua }} /> 99.9% uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
