export default function opaque(hex, alpha) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand hex (#000 → #000000)
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}