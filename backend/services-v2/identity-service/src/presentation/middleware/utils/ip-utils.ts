/**
 * IP utilities shared across middleware
 * Provides normalization and CIDR-aware matching utilities.
 */

import ipaddr from 'ipaddr.js';

/**
 * Normalize an incoming IP string.
 */
export function normalizeIp(ip?: string | string[] | null): string | null {
  if (!ip) {
    return null;
  }

  const raw = Array.isArray(ip) ? ip[0] : ip;
  if (!raw) {
    return null;
  }

  // Take first IP if X-Forwarded-For style list arrives.
  const first = raw.split(',')[0]?.trim();
  if (!first) {
    return null;
  }

  // Handle IPv4 mapped IPv6 addresses (::ffff:x.x.x.x)
  return first.startsWith('::ffff:') ? first.substring(7) : first;
}

/**
 * Determine whether the given client IP is inside the allow list.
 */
export function isIpAllowed(
  clientIp: string | null,
  allowList: string[] = []
): boolean {
  if (!clientIp || allowList.length === 0) {
    return false;
  }

  let parsedClient: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsedClient = normalizeParsedIp(ipaddr.parse(clientIp));
  } catch {
    return false;
  }

  for (const candidate of allowList) {
    try {
      if (candidate.includes('/')) {
        const [range, prefix] = ipaddr.parseCIDR(candidate);
        const normalizedRange = normalizeParsedIp(range);
        if (parsedClient.kind() !== normalizedRange.kind()) {
          continue;
        }
        if (parsedClient.match([normalizedRange, prefix])) {
          return true;
        }
      } else {
        const parsedCandidate = normalizeParsedIp(ipaddr.parse(candidate));
        if (
          parsedClient.kind() === parsedCandidate.kind() &&
          parsedClient.toNormalizedString() === parsedCandidate.toNormalizedString()
        ) {
          return true;
        }
      }
    } catch {
      // Ignore malformed entries and continue checking.
      continue;
    }
  }

  return false;
}

function normalizeParsedIp(ip: ipaddr.IPv4 | ipaddr.IPv6): ipaddr.IPv4 | ipaddr.IPv6 {
  if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
    return (ip as ipaddr.IPv6).toIPv4Address();
  }
  return ip;
}

