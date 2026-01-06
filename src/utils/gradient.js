function hexToHsl(hex) {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // gray
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * color).toString(16).padStart(2, "0");
    };

    return `#${f(0)}${f(8)}${f(4)}`;
}

export default function gradient(baseColor, brightnessFactor) {
    if (brightnessFactor < 0 || brightnessFactor > 1) {
        throw new Error("brightnessFactor must be between 0 and 1");
    }

    const hsl = hexToHsl(baseColor);

    // Shift brightness in opposite directions for gradient start/end
    const startLightness = Math.min(100, hsl.l + brightnessFactor * 30);
    const endLightness = Math.max(0, hsl.l - (1 - brightnessFactor) * 30);

    const startColor = hslToHex(hsl.h, hsl.s, startLightness);
    const endColor = hslToHex(hsl.h, hsl.s, endLightness);

    return [startColor, endColor];
}

export function createHorizontalGradient(startColor, endColor) {
    return {
        colors: [startColor, endColor],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 }
    };
}