const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num < 1000) return Math.floor(num).toLocaleString();
  
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (tier >= SUFFIXES.length) {
    return num.toExponential(2);
  }
  
  const scaled = num / Math.pow(1000, tier);
  const suffix = SUFFIXES[tier];
  
  return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + suffix;
}

export function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  const match = str.match(/^([\d.]+)([KMBTQaQiSxSpOc]?)$/i);
  if (!match) return parseFloat(str) || 0;
  
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  const multiplier = SUFFIXES.indexOf(suffix);
  
  return num * Math.pow(1000, multiplier);
}