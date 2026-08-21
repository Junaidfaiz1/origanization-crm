import { BusinessRuleError } from "@/lib/errors/app-error";

export const BID_REQUEST_STATUSES = [
  "DRAFT",
  "OPEN",
  "PAUSED",
  "CLOSED",
  "AWARDED",
  "CANCELLED",
] as const;

export const BID_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "SHORTLISTED",
  "NEGOTIATION",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const BID_REQUEST_TYPES = ["INTERNAL", "EXTERNAL"] as const;

export const ACTIVE_BID_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "SHORTLISTED",
  "NEGOTIATION",
] as const;

export type BidRequestState = {
  status: string;
  awardedBidId: string | null;
};

export type BidState = {
  id: string;
  bidRequestId: string;
  status: string;
  amount: number;
  estimatedDays: number;
};

export function canSubmitBid(request: BidRequestState): string | null {
  if (request.status !== "OPEN") {
    return "Closed bid requests cannot accept new bids";
  }
  if (request.awardedBidId) {
    return "This request already has a winning bid";
  }
  return null;
}

export function validateBidValues(amount: number, estimatedDays: number): string | null {
  if (!(amount > 0)) {
    return "Bid amount must be positive";
  }
  if (!(estimatedDays > 0)) {
    return "Estimated days must be positive";
  }
  return null;
}

export function canAcceptBid(
  request: BidRequestState,
  bid: BidState,
  requestId: string,
): string | null {
  if (request.status !== "OPEN" && request.status !== "PAUSED") {
    return "Bid request is not open for award";
  }
  if (request.awardedBidId) {
    return "A winning bid already exists";
  }
  if (bid.bidRequestId !== requestId) {
    return "Accepted bid must belong to the same bid request";
  }
  if (bid.status === "REJECTED") {
    return "A rejected bid cannot be accepted";
  }
  if (bid.status === "WITHDRAWN") {
    return "A withdrawn bid cannot be accepted";
  }
  if (bid.status === "DRAFT") {
    return "A draft bid cannot be accepted";
  }
  return null;
}

export function assertCanOpenBidRequest(request: BidRequestState): void {
  if (request.status !== "DRAFT" && request.status !== "PAUSED") {
    throw new BusinessRuleError("Only draft or paused requests can be opened");
  }
  if (request.awardedBidId) {
    throw new BusinessRuleError("An awarded request cannot be reopened");
  }
}

export function assertCanPauseBidRequest(request: BidRequestState): void {
  if (request.status !== "OPEN") {
    throw new BusinessRuleError("Only open requests can be paused");
  }
}

export function assertCanCloseBidRequest(request: BidRequestState): void {
  if (request.status !== "OPEN" && request.status !== "PAUSED") {
    throw new BusinessRuleError("Only open or paused requests can be closed");
  }
  if (request.awardedBidId) {
    throw new BusinessRuleError("An awarded request cannot be closed");
  }
}

export function assertCanCancelBidRequest(request: BidRequestState): void {
  if (request.status === "AWARDED") {
    throw new BusinessRuleError("An awarded request cannot be cancelled");
  }
  if (request.status === "CANCELLED") {
    throw new BusinessRuleError("This request is already cancelled");
  }
}

export function assertCanEditBidRequest(request: BidRequestState): void {
  if (request.status !== "DRAFT") {
    throw new BusinessRuleError("Only draft bid requests can be edited");
  }
}

export function assertCanWithdrawBid(bid: { status: string }): void {
  if (!ACTIVE_BID_STATUSES.includes(bid.status as (typeof ACTIVE_BID_STATUSES)[number])) {
    throw new BusinessRuleError("Only active bids can be withdrawn");
  }
}

export function assertCanShortlistBid(bid: { status: string }, request: BidRequestState): void {
  if (request.status !== "OPEN" && request.status !== "PAUSED") {
    throw new BusinessRuleError("Shortlist is only available on open or paused requests");
  }
  if (bid.status !== "SUBMITTED" && bid.status !== "NEGOTIATION") {
    throw new BusinessRuleError("Only submitted or negotiating bids can be shortlisted");
  }
}

export function assertCanRejectBid(bid: { status: string }, request: BidRequestState): void {
  if (request.awardedBidId) {
    throw new BusinessRuleError("Cannot reject bids after a winner is awarded");
  }
  if (bid.status === "ACCEPTED") {
    throw new BusinessRuleError("An accepted bid cannot be rejected");
  }
  if (bid.status === "REJECTED") {
    throw new BusinessRuleError("This bid is already rejected");
  }
  if (bid.status === "WITHDRAWN") {
    throw new BusinessRuleError("A withdrawn bid cannot be rejected");
  }
}

export function assertCanNegotiate(bid: { status: string }, request: BidRequestState): void {
  if (request.status !== "OPEN" && request.status !== "PAUSED") {
    throw new BusinessRuleError("Negotiation is only available on open or paused requests");
  }
  if (
    bid.status !== "SUBMITTED" &&
    bid.status !== "SHORTLISTED" &&
    bid.status !== "NEGOTIATION"
  ) {
    throw new BusinessRuleError("This bid cannot enter negotiation");
  }
}

export type ScoreWeights = {
  price: number;
  experience: number;
  rating: number;
  delivery: number;
};

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  price: 0.4,
  experience: 0.2,
  rating: 0.2,
  delivery: 0.2,
};

export type BidScoreInput = {
  amount: number;
  experienceYears: number;
  rating: number;
  estimatedDays: number;
  minAmount: number;
  maxAmount: number;
  minDays: number;
  maxDays: number;
  maxExperience: number;
};

export function scoreBid(
  input: BidScoreInput,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): { total: number; breakdown: Record<keyof ScoreWeights, number> } {
  const priceScore =
    input.maxAmount === input.minAmount
      ? 100
      : ((input.maxAmount - input.amount) / (input.maxAmount - input.minAmount)) *
        100;
  const experienceScore =
    input.maxExperience === 0
      ? 0
      : (input.experienceYears / input.maxExperience) * 100;
  const ratingScore = (input.rating / 5) * 100;
  const deliveryScore =
    input.maxDays === input.minDays
      ? 100
      : ((input.maxDays - input.estimatedDays) / (input.maxDays - input.minDays)) *
        100;

  const breakdown = {
    price: clampScore(priceScore),
    experience: clampScore(experienceScore),
    rating: clampScore(ratingScore),
    delivery: clampScore(deliveryScore),
  };

  const total =
    breakdown.price * weights.price +
    breakdown.experience * weights.experience +
    breakdown.rating * weights.rating +
    breakdown.delivery * weights.delivery;

  return { total: Math.round(total), breakdown };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
