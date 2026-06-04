import React, { useState } from 'react';
import { useLanguage } from '../src/contexts/LanguageContext';

// ── Data Interfaces ──
export interface WeatherCardData {
  location: string;
  condition: string;
  icon: string;
  temperature: {
    current: number;
    high: number;
    low: number;
    unit: 'C' | 'F';
  };
  metrics: {
    humidity: number;
    windSpeed: number;
    windDirection: string;
    uvIndex: number;
    precipitationChance: number;
  };
  feelsLike?: number;
  isDayTime?: boolean;
  hourlyStrip?: Array<{
    time: string;
    temp: number;
    icon: string;
  }>;
}

interface WeatherCardProps {
  data: WeatherCardData;
}

// ── Animated SVG Weather Icons ──
const WeatherIcon: React.FC<{ icon: string; size?: number }> = ({ icon, size = 48 }) => {
  const s = size;

  switch (icon) {
    case 'sunny':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g style={{ animation: 'wc-rotate-rays 12s linear infinite', transformOrigin: '24px 24px' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line
                key={i}
                x1="24" y1="4" x2="24" y2="10"
                stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"
                transform={`rotate(${deg} 24 24)`}
              />
            ))}
          </g>
          <circle cx="24" cy="24" r="9" fill="#FBBF24" opacity="0.9" />
          <circle cx="24" cy="24" r="7" fill="#FCD34D" />
        </svg>
      );

    case 'clear-night':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path
            d="M30 10C22.268 10 16 16.268 16 24s6.268 14 14 14c2.59 0 5.02-.704 7.1-1.93A16 16 0 0120 24 16 16 0 0130.93 7.9 14.06 14.06 0 0030 10z"
            fill="#CBD5E1" opacity="0.85"
          />
          <circle cx="36" cy="12" r="1.2" fill="#E2E8F0" style={{ animation: 'wc-twinkle 2s ease-in-out infinite' }} />
          <circle cx="40" cy="20" r="0.8" fill="#E2E8F0" style={{ animation: 'wc-twinkle 2.5s ease-in-out infinite 0.5s' }} />
          <circle cx="38" cy="30" r="1" fill="#E2E8F0" style={{ animation: 'wc-twinkle 1.8s ease-in-out infinite 1s' }} />
          <circle cx="34" cy="8" r="0.6" fill="#E2E8F0" style={{ animation: 'wc-twinkle 3s ease-in-out infinite 0.3s' }} />
        </svg>
      );

    case 'partly-cloudy':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <circle cx="18" cy="18" r="7" fill="#FBBF24" opacity="0.8" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <line
              key={i}
              x1="18" y1="7" x2="18" y2="10"
              stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round"
              transform={`rotate(${deg} 18 18)`}
              opacity="0.6"
            />
          ))}
          <g style={{ animation: 'wc-drift 4s ease-in-out infinite' }}>
            <path d="M14 32a8 8 0 01.4-2.5 6 6 0 0111.2-1A5 5 0 0136 32H14z" fill="white" opacity="0.9" />
          </g>
        </svg>
      );

    case 'cloudy':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g style={{ animation: 'wc-float 5s ease-in-out infinite' }}>
            <path d="M12 30a6 6 0 01.3-1.9 5 5 0 019.4-.8A4 4 0 0130 30H12z" fill="white" opacity="0.5" />
          </g>
          <g style={{ animation: 'wc-drift 4s ease-in-out infinite' }}>
            <path d="M16 34a8 8 0 01.4-2.5 6 6 0 0111.2-1A5 5 0 0138 34H16z" fill="white" opacity="0.85" />
          </g>
        </svg>
      );

    case 'rain':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M12 24a8 8 0 01.4-2.5 6 6 0 0111.2-1A5 5 0 0134 24H12z" fill="white" opacity="0.8" />
          {[18, 24, 30].map((x, i) => (
            <line
              key={i}
              x1={x} y1="28" x2={x - 2} y2="36"
              stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"
              style={{ animation: `wc-drip 1.2s ease-in infinite ${i * 0.3}s` }}
            />
          ))}
        </svg>
      );

    case 'drizzle':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M14 24a7 7 0 01.35-2.2 5.5 5.5 0 0110.3-.9A4.5 4.5 0 0134 24H14z" fill="white" opacity="0.75" />
          {[19, 25, 31].map((x, i) => (
            <circle
              key={i}
              cx={x} cy={30 + i * 2} r="1"
              fill="#93C5FD"
              style={{ animation: `wc-drip 1.5s ease-in infinite ${i * 0.4}s` }}
            />
          ))}
        </svg>
      );

    case 'thunderstorms-rain':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M10 22a8 8 0 01.4-2.5 6 6 0 0111.2-1A5 5 0 0132 22H10z" fill="#94A3B8" opacity="0.85" />
          <polygon
            points="22,24 18,32 22,32 20,38 28,28 24,28 26,24"
            fill="#FBBF24"
            style={{ animation: 'wc-flash 3s ease-in-out infinite' }}
          />
          {[16, 28].map((x, i) => (
            <line
              key={i}
              x1={x} y1="26" x2={x - 1} y2="34"
              stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"
              style={{ animation: `wc-drip 1s ease-in infinite ${i * 0.5}s` }}
            />
          ))}
        </svg>
      );

    case 'snow':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M14 24a7 7 0 01.35-2.2 5.5 5.5 0 0110.3-.9A4.5 4.5 0 0134 24H14z" fill="white" opacity="0.8" />
          {[18, 24, 30].map((x, i) => (
            <g key={i} style={{ animation: `wc-snow-fall 2s ease-in infinite ${i * 0.5}s` }}>
              <text x={x} y={32} fill="white" fontSize="6" textAnchor="middle" opacity="0.9">{'\u2744'}</text>
            </g>
          ))}
        </svg>
      );

    case 'fog':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          {[18, 24, 30].map((y, i) => (
            <line
              key={i}
              x1="10" y1={y} x2="38" y2={y}
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              opacity={0.4 + i * 0.15}
              style={{ animation: `wc-fog-wave ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s` }}
            />
          ))}
        </svg>
      );

    case 'wind':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <path d="M8 20 Q18 16 28 20 T40 18" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"
            style={{ animation: 'wc-wind-wave 2s ease-in-out infinite' }} />
          <path d="M10 26 Q20 22 30 26 T42 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"
            style={{ animation: 'wc-wind-wave 2.5s ease-in-out infinite 0.3s' }} />
          <path d="M12 32 Q22 28 32 32 T44 30" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"
            style={{ animation: 'wc-wind-wave 3s ease-in-out infinite 0.6s' }} />
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <g style={{ animation: 'wc-drift 4s ease-in-out infinite' }}>
            <path d="M14 30a8 8 0 01.4-2.5 6 6 0 0111.2-1A5 5 0 0136 30H14z" fill="white" opacity="0.85" />
          </g>
        </svg>
      );
  }
};

// ── Gradient Backdrops by Condition ──
const getContainerBg = (icon: string): string => {
  switch (icon) {
    case 'sunny': 
      // Sunlight blue sky (daytime clear sky)
      return 'bg-gradient-to-br from-sky-500/90 via-blue-600/85 to-amber-500/75';
    case 'clear-night': 
      // Celestial dark navy/slate
      return 'bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-indigo-950/95';
    case 'partly-cloudy': 
      // Blend of sky blue and light clouds
      return 'bg-gradient-to-br from-sky-600/85 via-blue-700/80 to-slate-600/85';
    case 'cloudy': 
      // Overcast grey sky
      return 'bg-gradient-to-br from-slate-500/85 via-slate-600/80 to-zinc-700/85';
    case 'rain':
    case 'drizzle': 
      // Dark slate/charcoal rain clouds
      return 'bg-gradient-to-br from-slate-700/90 via-slate-800/85 to-zinc-900/90';
    case 'thunderstorms-rain': 
      // Ominous stormy charcoal with violet tint
      return 'bg-gradient-to-br from-zinc-800/95 via-neutral-900/90 to-violet-950/90';
    case 'snow': 
      // Cold frosty sky blue/white
      return 'bg-gradient-to-br from-sky-300/75 via-blue-200/65 to-slate-100/70';
    case 'fog': 
      // Misty gray-green
      return 'bg-gradient-to-br from-neutral-600/80 via-stone-700/75 to-slate-800/80';
    case 'wind': 
      // Deep teal-slate
      return 'bg-gradient-to-br from-teal-800/85 via-slate-800/80 to-zinc-900/85';
    default: 
      return 'bg-gradient-to-br from-slate-700/90 to-zinc-800/90';
  }
};

const getGradientOverlay = (icon: string, isDayTime?: boolean): string => {
  switch (icon) {
    case 'sunny': return 'from-amber-400/25 via-orange-300/15 to-yellow-300/10';
    case 'clear-night': return 'from-indigo-950/45 via-slate-900/25 to-blue-950/15';
    case 'partly-cloudy':
      return isDayTime !== false
        ? 'from-sky-400/15 via-amber-300/10 to-slate-400/10'
        : 'from-slate-700/30 via-indigo-950/20 to-slate-900/10';
    case 'cloudy': return 'from-slate-500/15 via-slate-400/10 to-zinc-400/5';
    case 'rain':
    case 'drizzle': return 'from-slate-500/15 via-slate-800/15 to-blue-950/20';
    case 'thunderstorms-rain': return 'from-zinc-700/20 via-violet-950/30 to-purple-950/25';
    case 'snow': return 'from-sky-200/15 via-blue-100/10 to-white/5';
    case 'fog': return 'from-neutral-500/15 via-slate-600/10 to-stone-800/5';
    case 'wind': return 'from-teal-600/15 via-slate-700/10 to-zinc-800/15';
    default: return 'from-slate-600/15 via-slate-500/10 to-slate-400/5';
  }
};

// ── UV Color Helper ──
const getUvColor = (uv: number): string => {
  if (uv <= 2) return 'text-green-400';
  if (uv <= 5) return 'text-yellow-400';
  if (uv <= 7) return 'text-orange-400';
  return 'text-red-400';
};

// ── Main Component ──
export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const { t } = useLanguage();
  const [useFahrenheit, setUseFahrenheit] = useState(false);

  const toF = (c: number) => Math.round(c * 9 / 5 + 32);
  const displayTemp = (c: number) => useFahrenheit ? toF(c) : Math.round(c);
  const unitLabel = useFahrenheit ? '\u00b0F' : '\u00b0C';

  return (
    <>
      {/* Scoped keyframes */}
      <style>{`
        @keyframes wc-rotate-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wc-drift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(5px); } }
        @keyframes wc-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes wc-drip { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(14px); opacity: 0; } }
        @keyframes wc-flash { 0%,100% { opacity: 0; } 8%,10% { opacity: 1; } 12% { opacity: 0; } 50%,52% { opacity: 0.7; } 54% { opacity: 0; } }
        @keyframes wc-twinkle { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes wc-fog-wave { 0%,100% { opacity: 0.35; transform: translateX(-4px); } 50% { opacity: 0.75; transform: translateX(4px); } }
        @keyframes wc-wind-wave { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
        @keyframes wc-snow-fall { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(16px); opacity: 0; } }
        @keyframes wc-card-enter { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .wc-scrollbar-none::-webkit-scrollbar { display: none; }
        .wc-scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className={`relative max-w-md w-full rounded-3xl overflow-hidden backdrop-blur-xl border border-white/15 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.5),0_15px_35px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_90px_-12px_rgba(0,0,0,0.75),0_20px_45px_-15px_rgba(0,0,0,0.55)] ${getContainerBg(data.icon)}`}
        style={{ animation: 'wc-card-enter 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        {/* Ambient gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradientOverlay(data.icon, data.isDayTime)} pointer-events-none`} />

        {/* Noise texture for depth */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10 p-5">
          {/* ── Hero Block ── */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white/85 truncate">{data.location}</h3>
              <p className="text-xs text-white/55 mt-0.5 capitalize">{data.condition}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <WeatherIcon icon={data.icon} size={48} />
              <button
                onClick={() => setUseFahrenheit(f => !f)}
                className="text-right cursor-pointer group/temp transition-transform hover:scale-[1.02] active:scale-95"
                title={`Switch to ${useFahrenheit ? '\u00b0C' : '\u00b0F'}`}
              >
                <span className="text-5xl md:text-6xl font-extralight text-white tracking-tighter leading-none">
                  {displayTemp(data.temperature.current)}
                  <span className="text-2xl md:text-3xl font-light text-white/60">{unitLabel}</span>
                </span>
                <div className="text-[11px] text-white/45 mt-1 text-right">
                  H:{displayTemp(data.temperature.high)}{'\u00b0'} L:{displayTemp(data.temperature.low)}{'\u00b0'}
                </div>
              </button>
            </div>
          </div>

          {/* ── Data Grid ── */}
          <div className="grid grid-cols-4 gap-2 md:gap-2.5 mt-5">
            {/* Feels Like */}
            <div className="bg-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm border border-white/5">
              <svg className="w-4 h-4 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9V3m0 0L9.5 5.5M12 3l2.5 2.5M12 9a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <p className="text-sm font-semibold text-white mt-1">{displayTemp(data.feelsLike ?? data.temperature.current)}{'\u00b0'}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/45 mt-0.5">{t('weatherCard.feelsLike')}</p>
            </div>

            {/* Humidity */}
            <div className="bg-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm border border-white/5">
              <svg className="w-4 h-4 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21.5c-3.6 0-6.5-2.9-6.5-6.5 0-4.5 6.5-12.5 6.5-12.5s6.5 8 6.5 12.5c0 3.6-2.9 6.5-6.5 6.5z" />
              </svg>
              <p className="text-sm font-semibold text-white mt-1">{data.metrics.humidity}%</p>
              <p className="text-[9px] uppercase tracking-wider text-white/45 mt-0.5">{t('weatherCard.humidity')}</p>
            </div>

            {/* Wind */}
            <div className="bg-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm border border-white/5">
              <svg className="w-4 h-4 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.5 12h13a2.5 2.5 0 000-5M3.5 17h9a2.5 2.5 0 010 5M3.5 7h7a2.5 2.5 0 000-5" />
              </svg>
              <p className="text-sm font-semibold text-white mt-1">{Math.round(data.metrics.windSpeed)}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/45 mt-0.5">{data.metrics.windDirection}</p>
            </div>

            {/* UV Index */}
            <div className="bg-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm border border-white/5">
              <svg className="w-4 h-4 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0l-1.41-1.41M8.34 8.34L6.93 6.93" />
              </svg>
              <p className={`text-sm font-semibold mt-1 ${getUvColor(data.metrics.uvIndex)}`}>{data.metrics.uvIndex}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/45 mt-0.5">{t('weatherCard.uvIndex')}</p>
            </div>
          </div>

          {/* ── Rain chance bar ── */}
          {data.metrics.precipitationChance > 0 && (
            <div className="mt-3 flex items-center gap-2 px-1">
              <svg className="w-3.5 h-3.5 text-blue-300/70 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2s-6 7.5-6 12a6 6 0 0012 0c0-4.5-6-12-6-12z" />
              </svg>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-700"
                  style={{ width: `${Math.min(data.metrics.precipitationChance, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-white/50">{data.metrics.precipitationChance}%</span>
            </div>
          )}

          {/* ── Hourly Strip ── */}
          {data.hourlyStrip && data.hourlyStrip.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 wc-scrollbar-none">
                {data.hourlyStrip.map((hour, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[44px] flex-shrink-0">
                    <span className="text-[10px] text-white/45 font-medium">{hour.time}</span>
                    <WeatherIcon icon={hour.icon} size={22} />
                    <span className="text-xs font-semibold text-white/85">{displayTemp(hour.temp)}{'\u00b0'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Loading Shimmer Component ──
export const WeatherCardLoading: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <style>{`
        @keyframes wc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes wc-card-enter { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div
        className="relative max-w-md w-full rounded-3xl overflow-hidden backdrop-blur-xl border border-white/10 bg-gradient-to-br from-slate-700/60 to-gray-800/55 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.5),0_15px_35px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_90px_-12px_rgba(0,0,0,0.75),0_20px_45px_-15px_rgba(0,0,0,0.55)]"
        style={{ animation: 'wc-card-enter 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        <div className="p-5 space-y-4">
          {/* Hero shimmer */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded-lg" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 75%)', backgroundSize: '200% 100%', animation: 'wc-shimmer 1.5s infinite' }} />
              <div className="h-3 w-20 rounded-lg" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)', backgroundSize: '200% 100%', animation: 'wc-shimmer 1.5s infinite 0.2s' }} />
            </div>
            <div className="h-14 w-24 rounded-xl" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 75%)', backgroundSize: '200% 100%', animation: 'wc-shimmer 1.5s infinite 0.4s' }} />
          </div>

          {/* Grid shimmer */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)', backgroundSize: '200% 100%', animation: `wc-shimmer 1.5s infinite ${i * 0.15}s` }} />
            ))}
          </div>

          {/* Loading text */}
          <p className="text-center text-xs text-white/40 font-medium">{t('weatherCard.loading')}</p>
        </div>
      </div>
    </>
  );
};
