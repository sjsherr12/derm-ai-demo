export function lighten(hex, amount) {
    // Validate input
    if (!hex || typeof hex !== 'string') {
        console.warn('lighten: Invalid hex color provided:', hex);
        return '#E5E5E5'; // Return a default light gray
    }

    // Remove leading '#' if present
    let color = hex.replace(/^#/, '');

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(color) && !/^[0-9A-Fa-f]{3}$/.test(color)) {
        console.warn('lighten: Invalid hex format:', hex);
        return '#E5E5E5'; // Return a default light gray
    }

    // Expand shorthand hex (e.g., "03F" to "0033FF")
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    // Parse r,g,b values
    let num = parseInt(color, 16);
    let r = (num >> 16) & 0xFF;
    let g = (num >> 8) & 0xFF;
    let b = num & 0xFF;

    // Lighten each channel
    r = Math.max(0, Math.min(255, Math.floor(r + (255 - r) * amount)));
    g = Math.max(0, Math.min(255, Math.floor(g + (255 - g) * amount)));
    b = Math.max(0, Math.min(255, Math.floor(b + (255 - b) * amount)));

    // Convert back to hex and pad with zeros
    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');

    return `#${rr}${gg}${bb}`;
}
