import confetti from 'canvas-confetti';

// Dynamic color themes for national flags of participating countries
const COUNTRY_THEMES: { [key: string]: string[] } = {
    ci: ['#FF8200', '#FFFFFF', '#009E49'], // Ivory Coast: Orange, White, Green
    ar: ['#75AADB', '#FFFFFF', '#FCBF49'], // Argentina: Light Blue, White, Sun Gold
    fr: ['#002395', '#FFFFFF', '#ED2939'], // France: Blue, White, Red
    sn: ['#00853F', '#FDEF42', '#E31B23'], // Senegal: Green, Yellow, Red
    dz: ['#006233', '#FFFFFF', '#D21034'], // Algeria: Green, White, Red
    br: ['#009739', '#FEDF00', '#002776'], // Brazil: Green, Yellow, Blue
    de: ['#000000', '#DD0000', '#FFCC00'], // Germany: Black, Red, Gold
    es: ['#C60B1E', '#FFC400', '#FFFFFF'], // Spain: Red, Gold, White
    gb: ['#FFFFFF', '#CE1126', '#00247D'], // Great Britain / England: White, Red, Blue
    pt: ['#006600', '#FF0000', '#FFCC00'], // Portugal: Green, Red, Gold
    it: ['#008C45', '#F4F5F0', '#CD212A'], // Italy: Green, White, Red
    ma: ['#C1272D', '#006233', '#FCE300'], // Morocco: Red, Green, Gold Star
    us: ['#B22234', '#FFFFFF', '#3C3B6E'], // USA: Red, White, Blue
    ca: ['#FF0000', '#FFFFFF'],           // Canada: Red, White
    mx: ['#006847', '#FFFFFF', '#CE1126'], // Mexico: Green, White, Red
    nl: ['#FF4F00', '#FFFFFF', '#21468B'], // Netherlands: Orange, White, Blue
    be: ['#000000', '#FFE300', '#ED2939'], // Belgium: Black, Yellow, Red
    hr: ['#FF0000', '#FFFFFF', '#171796'], // Croatia: Red, White, Blue
    jp: ['#FFFFFF', '#BC002D'],           // Japan: White, Red
    co: ['#FCD116', '#003893', '#CE1126'], // Colombia: Yellow, Blue, Red
    uy: ['#0081C6', '#FFFFFF', '#FCD116'], // Uruguay: Light Blue, White, Gold
    eng: ['#FFFFFF', '#CE1126'],          // England fallback
};

// Default premium celebration palette if country theme is not defined
const DEFAULT_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

export function getConfettiColors(countryCode: string): string[] {
    const code = countryCode.toLowerCase().trim();
    return COUNTRY_THEMES[code] || DEFAULT_COLORS;
}

// Side Cannons animation: shoots confetti from bottom-left and bottom-right corners
export function triggerSideCannons(colors: string[]) {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
        if (Date.now() > end) return;

        // Left Cannon
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 55,
            origin: { x: 0, y: 0.8 },
            colors: colors,
            zIndex: 9999,
        });

        // Right Cannon
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 55,
            origin: { x: 1, y: 0.8 },
            colors: colors,
            zIndex: 9999,
        });

        requestAnimationFrame(frame);
    };

    frame();
}

// Fireworks animation: shoots random explosions of confetti from left/right sides
export function triggerFireworks(colors: string[]) {
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire left fireworks
        confetti({
            ...defaults,
            particleCount,
            colors,
            origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
        });
        // Fire right fireworks
        confetti({
            ...defaults,
            particleCount,
            colors,
            origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
        });
    }, 250);
}

// Triggers a random celebration style or a combination of both
export function triggerCelebration(countryCode: string) {
    const colors = getConfettiColors(countryCode);
    const rand = Math.random();

    if (rand < 0.33) {
        // Mode 1: Side Cannons only
        triggerSideCannons(colors);
    } else if (rand < 0.66) {
        // Mode 2: Fireworks only
        triggerFireworks(colors);
    } else {
        // Mode 3: Epic combo (both side cannons & fireworks)
        triggerSideCannons(colors);
        triggerFireworks(colors);
    }
}
