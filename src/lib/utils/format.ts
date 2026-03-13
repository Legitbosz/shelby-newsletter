/**
 * Format an Aptos wallet address for display
 * 0xabcdef...123456
 */
export function truncateAddress(address: string, chars = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

/**
 * Convert Octas to APT (1 APT = 1e8 Octas)
 */
export function octasToApt(octas: number): number {
  return octas / 1e8;
}

/**
 * Convert APT to Octas
 */
export function aptToOctas(apt: number): number {
  return Math.round(apt * 1e8);
}

/**
 * Format APT amount for display
 */
export function formatApt(octas: number): string {
  const apt = octasToApt(octas);
  return `${apt.toFixed(apt < 1 ? 3 : 2)} APT`;
}

/**
 * Format unix timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format unix timestamp to relative time (e.g. "3 days ago")
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}
