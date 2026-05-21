import React, { useEffect, useRef, useState } from 'react';

interface LoadingProgressProps {
  progress: number;
  message: string;
}

const STEPS = [
  { label: 'Auth',    threshold: 0   },
  { label: 'Weather', threshold: 20  },
  { label: 'Connect', threshold: 40  },
  { label: 'AI',      threshold: 60  },
  { label: 'UI',      threshold: 80  },
  { label: 'Ready',   threshold: 100 },
];

const CSS = `
  @keyframes lp-shimmer {
    0%   { transform: translateX(-150%) skewX(-12deg); opacity: 0;   }
    25%  { opacity: 1; }
    75%  { opacity: 1; }
    100% { transform: translateX(350%)  skewX(-12deg); opacity: 0;   }
  }
  @keyframes lp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes lp-fade-slide {
    from { opacity: 0; transform: translateY(5px) scale(0.98); filter: blur(4px); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0);   }
  }
  @keyframes lp-float-a {
    0%, 100% { transform: translate(0px, 0px)   scale(1);    }
    33%      { transform: translate(14px,-20px)  scale(1.04); }
    66%      { transform: translate(-10px, 12px) scale(0.97); }
  }
  @keyframes lp-float-b {
    0%, 100% { transform: translate(0px, 0px);    }
    40%      { transform: translate(-16px, 14px); }
    75%      { transform: translate(12px,-10px);  }
  }
  @keyframes lp-float-c {
    0%, 100% { transform: translate(0px, 0px);  }
    50%      { transform: translate(8px,-16px);  }
  }
  @keyframes lp-dot-pulse {
    0%, 100% { opacity: 0.45; transform: scale(1);    box-shadow: 0 0 0px rgba(56,189,248,0); }
    50%      { opacity: 1;    transform: scale(1.3);  box-shadow: 0 0 10px rgba(56,189,248,0.8); }
  }
  @keyframes lp-dot-pulse-light {
    0%, 100% { opacity: 0.5; transform: scale(1);   box-shadow: 0 0 0px rgba(14,165,233,0);   }
    50%      { opacity: 1;   transform: scale(1.3); box-shadow: 0 0 8px rgba(14,165,233,0.6); }
  }
  @keyframes lp-progress-glow {
    0%, 100% { box-shadow: 0 0 8px 0px rgba(56,189,248,0.4), 0 0 24px 0px rgba(56,189,248,0.12); }
    50%      { box-shadow: 0 0 16px 2px rgba(56,189,248,0.65), 0 0 40px 4px rgba(99,102,241,0.2); }
  }
  @keyframes lp-progress-glow-light {
    0%, 100% { box-shadow: 0 0 8px 0px rgba(14,165,233,0.3), 0 0 20px 0px rgba(14,165,233,0.08); }
    50%      { box-shadow: 0 0 14px 2px rgba(14,165,233,0.5), 0 0 32px 3px rgba(99,102,241,0.15); }
  }

  .lp-bar-shimmer      { animation: lp-shimmer 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .lp-spinner          { animation: lp-spin 1.1s linear infinite; }
  .lp-msg-in           { animation: lp-fade-slide 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .lp-orb-a            { animation: lp-float-a 7s ease-in-out infinite; }
  .lp-orb-b            { animation: lp-float-b 9s ease-in-out 1.2s infinite; }
  .lp-orb-c            { animation: lp-float-c 5.5s ease-in-out 0.4s infinite; }
  .lp-dot-active-dark  { animation: lp-dot-pulse 1.3s ease-in-out infinite; }
  .lp-dot-active-light { animation: lp-dot-pulse-light 1.3s ease-in-out infinite; }
  .lp-bar-glow-dark    { animation: lp-progress-glow 2s ease-in-out infinite; }
  .lp-bar-glow-light   { animation: lp-progress-glow-light 2s ease-in-out infinite; }
`;

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ progress, message }) => {
  const injected = useRef(false);

  // Detect theme reactively
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains('dark') ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const activeIdx = STEPS.reduce((acc, s, i) => (progress >= s.threshold ? i : acc), 0);

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const t = isDark ? {
    // Card
    cardBg:       'linear-gradient(145deg, rgba(8,16,36,0.82) 0%, rgba(12,20,44,0.78) 40%, rgba(8,16,36,0.82) 100%)',
    cardBorder:   'rgba(255,255,255,0.065)',   // ← subtle outer border (reduced)
    cardShadow:   '0 28px 72px rgba(0,0,0,0.6), 0 8px 28px rgba(0,0,0,0.4)',
    topBeam:      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 30%, rgba(56,189,248,0.6) 50%, rgba(255,255,255,0.45) 70%, transparent 100%)',
    sheen:        'linear-gradient(125deg, rgba(255,255,255,0.055) 0%, transparent 40%, rgba(99,102,241,0.045) 60%, rgba(56,189,248,0.055) 80%, transparent 100%)',
    bottomRefl:   'linear-gradient(to top, rgba(56,189,248,0.022), transparent)',
    // Text
    label:        'rgba(148,163,184,0.55)',
    msgColor:     '#e2e8f0',
    stepDone:     'rgba(125,211,252,0.5)',
    stepActive:   'rgba(125,211,252,0.9)',
    stepInactive: 'rgba(148,163,184,0.22)',
    // Spinner
    spinnerRing:  'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(99,102,241,0.1))',
    spinnerBorder:'rgba(56,189,248,0.16)',
    jewel:        'radial-gradient(circle at 35% 35%, #7dd3fc, #38bdf8 60%, #0ea5e9)',
    jewelShadow:  '0 0 8px rgba(56,189,248,0.8), 0 0 16px rgba(56,189,248,0.3)',
    // Orbs
    orb1:         'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 65%)',
    orb2:         'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)',
    orb3:         'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 65%)',
    // Badge
    badgeBg:      'linear-gradient(135deg, rgba(56,189,248,0.11), rgba(99,102,241,0.09))',
    badgeBorder:  'rgba(56,189,248,0.2)',
    badgeTextColor: '#7dd3fc',
    badgeBeam:    'rgba(255,255,255,0.35)',
    // Bar
    barTrack:     'linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
    barFill:      'linear-gradient(90deg, #0284c7, #38bdf8 50%, #818cf8)',
    barGlowClass: 'lp-bar-glow-dark',
    dotActiveClass: 'lp-dot-active-dark',
    dotDone:      'radial-gradient(circle at 35% 35%, #e0f2fe, #38bdf8 60%, #0ea5e9)',
    dotActive:    'radial-gradient(circle at 35% 35%, #ffffff, #7dd3fc 60%, #38bdf8)',
    dotBorderDone:'rgba(56,189,248,0.22)',
    dotBorderAct: 'rgba(56,189,248,0.55)',
    brandColor:   'rgba(125,211,252,0.65)',
    trackInner:   'rgba(255,255,255,0.055)',
    filterBlur:   'blur(40px) saturate(180%) brightness(1.05)',
  } : {
    // Card
    cardBg:       'linear-gradient(145deg, rgba(248,250,255,0.88) 0%, rgba(240,245,255,0.82) 40%, rgba(248,250,255,0.88) 100%)',
    cardBorder:   'rgba(14,165,233,0.1)',       // ← subtle for light too
    cardShadow:   '0 20px 60px rgba(14,100,180,0.12), 0 6px 24px rgba(14,100,180,0.08)',
    topBeam:      'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.5) 30%, rgba(99,102,241,0.4) 50%, rgba(14,165,233,0.5) 70%, transparent 100%)',
    sheen:        'linear-gradient(125deg, rgba(255,255,255,0.7) 0%, transparent 40%, rgba(99,102,241,0.06) 60%, rgba(14,165,233,0.08) 80%, transparent 100%)',
    bottomRefl:   'linear-gradient(to top, rgba(14,165,233,0.04), transparent)',
    // Text
    label:        'rgba(100,116,139,0.7)',
    msgColor:     '#1e293b',
    stepDone:     'rgba(14,165,233,0.65)',
    stepActive:   'rgba(2,132,199,0.9)',
    stepInactive: 'rgba(148,163,184,0.35)',
    // Spinner
    spinnerRing:  'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1))',
    spinnerBorder:'rgba(14,165,233,0.22)',
    jewel:        'radial-gradient(circle at 35% 35%, #bae6fd, #38bdf8 60%, #0ea5e9)',
    jewelShadow:  '0 0 8px rgba(14,165,233,0.5), 0 0 16px rgba(14,165,233,0.2)',
    // Orbs
    orb1:         'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 65%)',
    orb2:         'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
    orb3:         'radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 65%)',
    // Badge
    badgeBg:      'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.07))',
    badgeBorder:  'rgba(14,165,233,0.25)',
    badgeTextColor: '#0369a1',
    badgeBeam:    'rgba(255,255,255,0.7)',
    // Bar
    barTrack:     'linear-gradient(90deg, rgba(226,232,240,0.9), rgba(241,245,249,0.8))',
    barFill:      'linear-gradient(90deg, #0284c7, #38bdf8 50%, #818cf8)',
    barGlowClass: 'lp-bar-glow-light',
    dotActiveClass: 'lp-dot-active-light',
    dotDone:      'radial-gradient(circle at 35% 35%, #bae6fd, #38bdf8 60%, #0ea5e9)',
    dotActive:    'radial-gradient(circle at 35% 35%, #ffffff, #7dd3fc 60%, #38bdf8)',
    dotBorderDone:'rgba(14,165,233,0.3)',
    dotBorderAct: 'rgba(14,165,233,0.6)',
    brandColor:   'rgba(14,165,233,0.75)',
    trackInner:   'rgba(255,255,255,0.6)',
    filterBlur:   'blur(32px) saturate(160%) brightness(1.02)',
  };

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>

      {/* ── Ambient orbs ─────────────────────────────────────── */}
      <div className="lp-orb-a" style={{ position:'absolute', width:'480px', height:'480px', borderRadius:'50%', pointerEvents:'none', background:t.orb1, top:'35%', left:'40%', transform:'translate(-50%,-50%)' }}/>
      <div className="lp-orb-b" style={{ position:'absolute', width:'380px', height:'380px', borderRadius:'50%', pointerEvents:'none', background:t.orb2, top:'55%', left:'58%', transform:'translate(-50%,-50%)' }}/>
      <div className="lp-orb-c" style={{ position:'absolute', width:'220px', height:'220px', borderRadius:'50%', pointerEvents:'none', background:t.orb3, top:'42%', left:'30%', transform:'translate(-50%,-50%)' }}/>

      {/* ── Card — single border, reduced opacity ─────────────── */}
      <div style={{
        position:'relative',
        borderRadius:'22px',
        border:`1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        maxWidth:'400px',
        width:'100%',
        overflow:'hidden',
      }}>
        {/* Glass body */}
        <div style={{
          position:'relative',
          padding:'1.875rem 1.875rem 1.625rem',
          background: t.cardBg,
          backdropFilter: t.filterBlur,
          WebkitBackdropFilter: t.filterBlur,
          borderRadius:'21px',
        }}>
          {/* Noise grain */}
          <div style={{ position:'absolute', inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", opacity: isDark ? 0.024 : 0.018, pointerEvents:'none', borderRadius:'inherit' }}/>
          {/* Iridescent sheen */}
          <div style={{ position:'absolute', inset:0, background:t.sheen, pointerEvents:'none', borderRadius:'inherit' }}/>
          {/* Top beam */}
          <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:'1px', background:t.topBeam, filter:'blur(0.5px)', pointerEvents:'none' }}/>

          {/* ─ Header ─ */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.375rem', position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

              {/* Spinner */}
              <div style={{ position:'relative', width:'36px', height:'36px', flexShrink:0 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:t.spinnerRing, border:`1px solid ${t.spinnerBorder}`, backdropFilter:'blur(8px)' }}/>
                <svg className="lp-spinner" viewBox="0 0 36 36" fill="none" style={{ position:'absolute', inset:0, width:'36px', height:'36px' }}>
                  <circle cx="18" cy="18" r="15" stroke="rgba(56,189,248,0.08)" strokeWidth="2"/>
                  <path d="M18 3 A15 15 0 0 1 33 18" stroke="url(#lp-g1)" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M18 3 A15 15 0 0 0 3 18" stroke="url(#lp-g2)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.28"/>
                  <defs>
                    <linearGradient id="lp-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                    <linearGradient id="lp-g2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:t.jewel, boxShadow:t.jewelShadow }}/>
                </div>
              </div>

              {/* Text */}
              <div>
                <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:t.brandColor, lineHeight:1, marginBottom:'3px' }}>
                  MeteoSran
                </div>
                <div key={message} className="lp-msg-in" style={{ fontSize:'0.9rem', fontWeight:600, color:t.msgColor, lineHeight:1.25 }}>
                  {message}
                </div>
              </div>
            </div>

            {/* Badge */}
            <div style={{ position:'relative', overflow:'hidden', background:t.badgeBg, border:`1px solid ${t.badgeBorder}`, borderRadius:'10px', padding:'0.28rem 0.6rem', backdropFilter:'blur(12px)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg, transparent, ${t.badgeBeam}, transparent)` }}/>
              <span style={{ fontSize:'0.82rem', fontWeight:700, fontVariantNumeric:'tabular-nums', color:t.badgeTextColor }}>
                {progress}%
              </span>
            </div>
          </div>

          {/* ─ Progress bar ─ */}
          <div style={{ position:'relative', height:'6px', borderRadius:'999px', background:t.barTrack, border:`1px solid ${isDark ? 'rgba(148,163,184,0.07)' : 'rgba(148,163,184,0.2)'}`, marginBottom:'1.25rem', overflow:'hidden', boxShadow:`inset 0 1px 3px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(148,163,184,0.2)'}` }}>
            <div className={t.barGlowClass} style={{ position:'absolute', inset:'0 auto 0 0', width:`${Math.max(progress, 4)}%`, background:t.barFill, borderRadius:'999px', transition:'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <div className="lp-bar-shimmer" style={{ position:'absolute', top:0, left:0, bottom:0, width:'55%', background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}/>
              <div style={{ position:'absolute', right:'-2px', top:'50%', transform:'translateY(-50%)', width:'10px', height:'10px', borderRadius:'50%', background:'radial-gradient(circle, #fff 10%, #7dd3fc 55%, transparent 100%)', boxShadow:'0 0 8px rgba(125,211,252,0.9)', opacity: progress > 3 ? 1 : 0, transition:'opacity 0.3s' }}/>
            </div>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:t.trackInner, borderRadius:'999px' }}/>
          </div>

          {/* ─ Step indicators ─ */}
          <div style={{ display:'flex', alignItems:'center', position:'relative', zIndex:1 }}>
            {STEPS.slice(1).map((step, i) => {
              const idx    = i + 1;
              const done   = progress >= step.threshold;
              const active = activeIdx === idx;
              return (
                <div key={step.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
                  <div
                    className={active ? t.dotActiveClass : ''}
                    style={{ width: active ? '9px' : done ? '7px' : '5px', height: active ? '9px' : done ? '7px' : '5px', borderRadius:'50%', background: done ? (active ? t.dotActive : t.dotDone) : (isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.25)'), border:`1px solid ${active ? t.dotBorderAct : done ? t.dotBorderDone : (isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.2)')}`, transition:'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  />
                  <div style={{ fontSize:'0.51rem', fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color: active ? t.stepActive : done ? t.stepDone : t.stepInactive, transition:'color 0.3s ease', whiteSpace:'nowrap' }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom reflection */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'38%', background:t.bottomRefl, pointerEvents:'none', borderRadius:'0 0 21px 21px' }}/>
        </div>
      </div>
    </div>
  );
};