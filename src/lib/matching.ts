// =============================================================================
// SplitSend Matching Logic
// =============================================================================

import type { PublicRequest, BrowseFilters } from "@/types";
import { PAGE_SIZE } from "@/constants";

export interface ScoredRequest {
  request: PublicRequest;
  score: number;
  matchReasons: string[];
}

export function scoreRequest(candidate: PublicRequest, reference: PublicRequest): ScoredRequest {
  let score = 0;
  const matchReasons: string[] = [];

  if (
    candidate.city.toLowerCase().trim() === reference.city.toLowerCase().trim() &&
    candidate.state.toLowerCase().trim() === reference.state.toLowerCase().trim()
  ) {
    score += 50;
    matchReasons.push(`Same city (${candidate.city})`);
  } else if (candidate.state.toLowerCase().trim() === reference.state.toLowerCase().trim()) {
    score += 30;
    matchReasons.push(`Same state (${candidate.state})`);
  }

  if (candidate.request_category === reference.request_category) {
    score += 20;
    matchReasons.push(`Same type (${candidate.request_category.toUpperCase()})`);
  }

  const courierMatch =
    candidate.courier_preference === reference.courier_preference ||
    candidate.courier_preference === "any" ||
    reference.courier_preference === "any";
  if (courierMatch) {
    score += 15;
    matchReasons.push("Compatible courier");
  }

  if (candidate.destination_country.toLowerCase() === reference.destination_country.toLowerCase()) {
    score += 20;
    matchReasons.push(`Same destination (${candidate.destination_country})`);
  }

  const daysDiff = Math.abs(
    new Date(candidate.preferred_send_date).getTime() -
    new Date(reference.preferred_send_date).getTime()
  ) / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) { score += 10; matchReasons.push("Same send date"); }
  else if (daysDiff <= 3) { score += 8; matchReasons.push("Within 3 days"); }
  else if (daysDiff <= 7) { score += 5; matchReasons.push("Within a week"); }
  else if (daysDiff <= 14) score += 2;
  else if (daysDiff <= 30) score += 1;

  return { request: candidate, score, matchReasons };
}

export function rankRequests(
  candidates: PublicRequest[],
  reference: PublicRequest,
  excludeIds: string[] = []
): ScoredRequest[] {
  const excluded = new Set([reference.id, ...excludeIds]);
  return candidates
    .filter((c) => !excluded.has(c.id) && c.user_id !== reference.user_id && c.status === "active")
    .map((c) => scoreRequest(c, reference))
    .sort((a, b) => b.score - a.score);
}

export function getSmartSuggestions(
  allRequests: PublicRequest[],
  reference: PublicRequest,
  limit: number = PAGE_SIZE
): ScoredRequest[] {
  return rankRequests(allRequests, reference).slice(0, limit);
}

export function buildBrowseFilters(filters: BrowseFilters) {
  const conditions: { field: string; value: string | undefined }[] = [];
  if (filters.state) conditions.push({ field: "state", value: filters.state });
  if (filters.city) conditions.push({ field: "city", value: filters.city });
  if (filters.profession) conditions.push({ field: "profession", value: filters.profession });
  if (filters.request_category) conditions.push({ field: "request_category", value: filters.request_category });
  if (filters.courier_preference) conditions.push({ field: "courier_preference", value: filters.courier_preference });
  if (filters.destination_country) conditions.push({ field: "destination_country", value: filters.destination_country });
  return conditions;
}
