// Public data layer — no guard needed (returns only published content)

/**
 * Get published announcements — stub returning empty array.
 * Full implementation in Phase 2.
 */
export async function getPublishedAnnouncements() {
  return [] as { id: string; title: string; slug: string; createdAt: Date }[];
}

