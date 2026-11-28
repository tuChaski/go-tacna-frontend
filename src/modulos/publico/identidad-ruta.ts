const COLORES = ['#2563eb', '#0e7490', '#7c3aed', '#b45309', '#be185d', '#15803d'];
/** Convención visual estable; no representa colores oficiales del operador. */
export function colorRuta(id: number): string { return COLORES[Math.abs(id) % COLORES.length]; }
