const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export function checkRateLimit(key: string, limit = 5, windowSeconds = 60) {
  const now = Date.now();
  let record = rateLimitMap.get(key);
  
  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + windowSeconds * 1000 };
    rateLimitMap.set(key, record);
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}
