import React from 'react';

const STARS = [
  { x: 4,  y: 4,  r: 1.0, dur: 2.8, delay: 0.0 },
  { x: 11, y: 8,  r: 0.7, dur: 3.5, delay: 0.6 },
  { x: 19, y: 3,  r: 1.2, dur: 2.3, delay: 1.1 },
  { x: 27, y: 10, r: 0.8, dur: 4.0, delay: 0.3 },
  { x: 35, y: 5,  r: 0.6, dur: 3.2, delay: 0.9 },
  { x: 43, y: 2,  r: 1.0, dur: 2.6, delay: 1.4 },
  { x: 51, y: 8,  r: 0.8, dur: 3.8, delay: 0.2 },
  { x: 59, y: 4,  r: 1.1, dur: 2.9, delay: 0.7 },
  { x: 67, y: 9,  r: 0.7, dur: 3.5, delay: 1.2 },
  { x: 75, y: 3,  r: 0.9, dur: 2.4, delay: 0.5 },
  { x: 83, y: 7,  r: 1.0, dur: 4.1, delay: 0.8 },
  { x: 91, y: 5,  r: 0.8, dur: 3.0, delay: 1.6 },
  { x: 97, y: 10, r: 0.6, dur: 2.7, delay: 0.4 },
  { x: 8,  y: 16, r: 0.7, dur: 3.6, delay: 0.5 },
  { x: 22, y: 19, r: 0.9, dur: 2.5, delay: 1.0 },
  { x: 38, y: 14, r: 0.6, dur: 3.9, delay: 0.1 },
  { x: 55, y: 18, r: 0.8, dur: 2.7, delay: 1.3 },
  { x: 70, y: 13, r: 1.0, dur: 3.3, delay: 0.6 },
  { x: 86, y: 17, r: 0.7, dur: 4.2, delay: 0.9 },
  { x: 94, y: 20, r: 0.5, dur: 3.1, delay: 1.7 },
];

/* Blue/white window lights for Nairobi buildings */
const WINDOWS_BLUE = [
  [172,260],[176,260],[172,268],[176,268],
  [230,220],[235,220],[230,228],[235,228],
  [302,185],[307,185],[312,185],[302,193],[307,193],
  /* KICC windows (circular shaft) */
  [373,200],[373,210],[373,220],[373,230],
  /* Times Tower windows */
  [470,115],[475,115],[480,115],[470,125],[475,125],[480,125],
  [470,135],[475,135],[480,135],[470,145],[475,145],[480,145],
  [470,155],[475,155],[470,165],[475,165],[480,165],
  /* right-side buildings */
  [560,185],[565,185],[560,195],[565,195],
  [620,215],[625,215],[620,223],[625,223],
  [690,195],[695,195],[690,203],[695,203],
  [760,175],[765,175],[760,183],[765,183],
  [830,200],[835,200],[830,208],[835,208],
  [910,215],[915,215],[910,223],[915,223],
  [985,225],[990,225],[985,233],[990,233],
  [1060,235],[1065,235],[1060,243],[1065,243],
  [1140,220],[1145,220],[1140,228],[1145,228],
  [1220,240],[1225,240],[1220,248],[1225,248],
];

const WINDOWS_CYAN = [
  [174,264],[232,224],[304,189],[309,189],
  [375,205],[375,215],[375,225],[375,235],
  [472,119],[477,119],[482,119],[472,129],[477,129],
  [472,139],[477,139],[472,149],[477,149],
  [472,159],[477,159],[482,159],
  [562,189],[567,189],[622,219],[692,199],
  [762,179],[767,179],[832,204],[912,219],
  [987,229],[992,229],[1062,239],[1142,224],[1222,244],
];

export default function CityBackground() {
  return (
    <div className="city-bg" aria-hidden>
      {/* Twinkling stars */}
      <div className="city-stars" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.r * 2}px`,
              height: `${s.r * 2}px`,
              borderRadius: '50%',
              background: 'white',
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
              animationName: 'twinkle',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div style={{
        position: 'absolute', top: '6%', right: '8%',
        width: 52, height: 52, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, #E0F2FE, #BAE6FD 50%, #7DD3FC)',
        boxShadow: '0 0 30px rgba(147,197,253,0.5), 0 0 60px rgba(2,132,199,0.2)',
      }} />

      {/* Nairobi CBD Skyline SVG */}
      <svg
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%' }}
      >
        <defs>
          <linearGradient id="bldMain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1428" />
            <stop offset="100%" stopColor="#050A12" />
          </linearGradient>
          <linearGradient id="bldBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C1A30" />
            <stop offset="100%" stopColor="#070F1E" />
          </linearGradient>
          {/* Blue horizon glow */}
          <linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(2,132,199,0.25)" />
            <stop offset="100%" stopColor="rgba(2,132,199,0)" />
          </linearGradient>
        </defs>

        {/* Horizon atmosphere glow */}
        <rect x="0" y="300" width="1440" height="120" fill="url(#horizonGlow)" opacity="0.6" />

        {/* ── BACK LAYER (distant buildings, lighter) ─────── */}
        <path
          d="M0,420 L0,310 L40,310 L40,280 L80,280 L80,260 L120,260 L120,280
             L160,280 L160,300 L200,300 L200,255 L240,255 L240,230 L280,230 L280,255
             L320,255 L320,270 L360,270 L360,240 L400,240 L400,210 L440,210 L440,240
             L480,240 L480,260 L520,260 L520,230 L560,230 L560,200 L600,200 L600,230
             L640,230 L640,250 L680,250 L680,215 L720,215 L720,190 L760,190 L760,215
             L800,215 L800,240 L840,240 L840,210 L880,210 L880,185 L920,185 L920,210
             L960,210 L960,230 L1000,230 L1000,200 L1040,200 L1040,175 L1080,175 L1080,200
             L1120,200 L1120,220 L1160,220 L1160,195 L1200,195 L1200,220 L1240,220
             L1240,240 L1280,240 L1280,260 L1320,260 L1320,285 L1360,285 L1360,305 L1440,305 L1440,420 Z"
          fill="url(#bldBack)"
          opacity="0.55"
        />

        {/* ── FRONT LAYER — Nairobi CBD silhouette ────────── */}

        {/* Far-left: smaller buildings */}
        <rect x="0"   y="330" width="35"  height="90"  fill="url(#bldMain)" />
        <rect x="38"  y="305" width="28"  height="115" fill="url(#bldMain)" />
        <rect x="68"  y="318" width="22"  height="102" fill="url(#bldMain)" />
        <rect x="92"  y="290" width="32"  height="130" fill="url(#bldMain)" />

        {/* UAP Old Mutual Tower — distinctive angular shape */}
        <rect x="127" y="260" width="15"  height="160" fill="url(#bldMain)" />
        <rect x="144" y="245" width="38"  height="175" fill="url(#bldMain)" />
        <rect x="184" y="275" width="12"  height="145" fill="url(#bldMain)" />
        {/* UAP angled top */}
        <polygon points="144,245 163,228 182,245" fill="url(#bldMain)" />

        {/* Medium cluster */}
        <rect x="200" y="295" width="25"  height="125" fill="url(#bldMain)" />
        <rect x="228" y="268" width="30"  height="152" fill="url(#bldMain)" />
        <rect x="261" y="285" width="22"  height="135" fill="url(#bldMain)" />

        {/* Britam Tower — tall, modern, slight taper */}
        <rect x="287" y="188" width="12"  height="232" fill="url(#bldMain)" />
        <rect x="300" y="172" width="46"  height="248" fill="url(#bldMain)" />
        <rect x="347" y="198" width="12"  height="222" fill="url(#bldMain)" />
        {/* Britam rooftop antenna */}
        <rect x="320" y="155" width="4"   height="18"  fill="url(#bldMain)" />

        {/* ── KICC — cylindrical tower with iconic disc crown ── */}
        {/* Main shaft (narrow cylinder approximation) */}
        <rect x="375" y="195" width="36"  height="225" fill="url(#bldMain)" />
        {/* Disc / saucer cap — wider than shaft, flat ellipse shape */}
        <path d="M356,200 L360,192 L368,186 L387,182 L395,182 L411,186 L419,192 L423,200 L411,205 L395,207 L375,207 L360,205 Z"
              fill="url(#bldMain)" />
        {/* Upper disc detail */}
        <path d="M363,195 L375,190 L395,188 L412,190 L416,195 L412,199 L395,200 L375,200 L363,199 Z"
              fill="#0C1E38" />
        {/* KICC antenna */}
        <rect x="391" y="160" width="3"   height="24"  fill="url(#bldMain)" />
        <polygon points="391,160 392.5,148 394,160" fill="url(#bldMain)" />

        {/* Buildings between KICC and Times Tower */}
        <rect x="425" y="252" width="28"  height="168" fill="url(#bldMain)" />
        <rect x="456" y="232" width="22"  height="188" fill="url(#bldMain)" />

        {/* ── TIMES TOWER — Kenya's tallest, stepped glass box ── */}
        {/* Base (widest) */}
        <rect x="485" y="255" width="8"   height="165" fill="url(#bldMain)" />
        {/* Main body */}
        <rect x="494" y="88"  width="62"  height="332" fill="url(#bldMain)" />
        <rect x="557" y="255" width="8"   height="165" fill="url(#bldMain)" />
        {/* Stepped top sections */}
        <rect x="498" y="72"  width="54"  height="18"  fill="url(#bldMain)" />
        <rect x="502" y="58"  width="46"  height="16"  fill="url(#bldMain)" />
        <rect x="507" y="46"  width="36"  height="14"  fill="url(#bldMain)" />
        {/* Antenna / spire */}
        <rect x="523" y="22"  width="4"   height="26"  fill="url(#bldMain)" />
        <polygon points="523,22 525,8 527,22" fill="url(#bldMain)" />

        {/* Right of Times Tower */}
        <rect x="570" y="245" width="30"  height="175" fill="url(#bldMain)" />
        <rect x="603" y="222" width="38"  height="198" fill="url(#bldMain)" />
        <rect x="644" y="238" width="24"  height="182" fill="url(#bldMain)" />

        {/* Nation Centre — mid-height rectangular */}
        <rect x="672" y="205" width="50"  height="215" fill="url(#bldMain)" />
        <rect x="674" y="198" width="46"  height="9"   fill="url(#bldMain)" />

        {/* Anniversary Towers — twin towers connected */}
        <rect x="728" y="218" width="22"  height="202" fill="url(#bldMain)" />
        <rect x="752" y="208" width="4"   height="212" fill="url(#bldMain)" />
        <rect x="758" y="218" width="22"  height="202" fill="url(#bldMain)" />
        {/* Bridge between twin towers */}
        <rect x="730" y="265" width="48"  height="8"   fill="#0C1E38" />

        {/* Medium buildings */}
        <rect x="784" y="232" width="32"  height="188" fill="url(#bldMain)" />
        <rect x="819" y="218" width="26"  height="202" fill="url(#bldMain)" />

        {/* Lonrho / mid-rise */}
        <rect x="848" y="242" width="40"  height="178" fill="url(#bldMain)" />
        <rect x="891" y="258" width="22"  height="162" fill="url(#bldMain)" />

        {/* Teleposta Towers — three connected towers */}
        <rect x="916" y="228" width="22"  height="192" fill="url(#bldMain)" />
        <rect x="940" y="215" width="8"   height="205" fill="url(#bldMain)" />
        <rect x="949" y="218" width="22"  height="202" fill="url(#bldMain)" />
        <rect x="973" y="225" width="8"   height="195" fill="url(#bldMain)" />
        <rect x="982" y="228" width="22"  height="192" fill="url(#bldMain)" />
        {/* Teleposta top antenna clusters */}
        <rect x="925" y="210" width="3"   height="20"  fill="url(#bldMain)" />
        <rect x="958" y="200" width="3"   height="20"  fill="url(#bldMain)" />
        <rect x="990" y="210" width="3"   height="20"  fill="url(#bldMain)" />

        {/* Right-side cluster */}
        <rect x="1008" y="248" width="35"  height="172" fill="url(#bldMain)" />
        <rect x="1046" y="232" width="28"  height="188" fill="url(#bldMain)" />
        <rect x="1077" y="252" width="32"  height="168" fill="url(#bldMain)" />

        {/* Corner house / Jogoo House */}
        <rect x="1112" y="238" width="44"  height="182" fill="url(#bldMain)" />
        <rect x="1114" y="230" width="40"  height="10"  fill="url(#bldMain)" />

        {/* Right-far buildings */}
        <rect x="1160" y="258" width="30"  height="162" fill="url(#bldMain)" />
        <rect x="1193" y="272" width="25"  height="148" fill="url(#bldMain)" />
        <rect x="1221" y="255" width="36"  height="165" fill="url(#bldMain)" />
        <rect x="1260" y="268" width="28"  height="152" fill="url(#bldMain)" />
        <rect x="1291" y="282" width="35"  height="138" fill="url(#bldMain)" />
        <rect x="1329" y="295" width="30"  height="125" fill="url(#bldMain)" />
        <rect x="1362" y="308" width="38"  height="112" fill="url(#bldMain)" />
        <rect x="1404" y="320" width="36"  height="100" fill="url(#bldMain)" />

        {/* ── Window lights — white ────────────────────────── */}
        {WINDOWS_BLUE.map(([cx, cy], i) => (
          <rect key={i} x={cx} y={cy} width={4} height={4} rx={0.5}
                fill="rgba(255,255,255,0.75)" />
        ))}

        {/* Window lights — cyan (logo accent) */}
        {WINDOWS_CYAN.map(([cx, cy], i) => (
          <rect key={`c${i}`} x={cx} y={cy} width={3} height={3} rx={0.5}
                fill="rgba(6,182,212,0.8)" />
        ))}

        {/* Times Tower windows (bright blue) */}
        {[115,125,135,145,155,165,175,185,195,205,215,225,235].map((y, i) => (
          <React.Fragment key={`tw${i}`}>
            <rect x={498} y={y} width={8} height={5} rx={0.5} fill="rgba(186,230,253,0.6)" />
            <rect x={510} y={y} width={8} height={5} rx={0.5} fill="rgba(186,230,253,0.6)" />
            <rect x={522} y={y} width={8} height={5} rx={0.5} fill="rgba(186,230,253,0.6)" />
            <rect x={534} y={y} width={8} height={5} rx={0.5} fill="rgba(186,230,253,0.6)" />
            <rect x={546} y={y} width={5} height={5} rx={0.5} fill="rgba(186,230,253,0.5)" />
          </React.Fragment>
        ))}

        {/* Road / foreground */}
        <rect x="0" y="400" width="1440" height="20" fill="#040810" />

        {/* Street lights */}
        {[80, 240, 420, 580, 720, 880, 1040, 1200, 1360].map((x, i) => (
          <React.Fragment key={`sl${i}`}>
            <rect x={x} y={380} width={2} height={22} fill="#0C1E38" />
            <circle cx={x + 1} cy={378} r={5} fill="rgba(186,230,253,0.5)" />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}
