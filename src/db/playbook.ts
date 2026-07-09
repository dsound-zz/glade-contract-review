import type { ClauseTypeValue } from "./schema";

/**
 * The firm's codified standard positions for reviewing INBOUND vendor
 * agreements (SaaS subscriptions, DPAs, NDAs) from the customer's side.
 *
 * This is the reference a real in-house / legal-ops team would maintain. The
 * AI assessment step reasons strictly against these positions — the model does
 * not get to invent its own risk appetite, which is what keeps output
 * consistent, defensible, and non-generic.
 */
export type PlaybookSeed = {
  clauseType: ClauseTypeValue;
  title: string;
  standardPosition: string;
  fallbackPosition: string;
  walkAway: string;
  guidance: string;
  severity: "low" | "medium" | "high" | "critical";
  isRequired: boolean;
};

export const PLAYBOOK: PlaybookSeed[] = [
  {
    clauseType: "limitation_of_liability",
    title: "Limitation of Liability",
    standardPosition:
      "Liability cap of at least 12 months of fees. Data breach, IP indemnification, and breach of confidentiality must be carved out from the cap (uncapped or a super-cap of 2x fees).",
    fallbackPosition:
      "Cap equal to 12 months of fees, with a super-cap (2x fees) rather than uncapped liability for data-breach and IP carve-outs.",
    walkAway:
      "Cap below 12 months of fees; a cap that applies to data-breach or IP-infringement liability; or a full exclusion of the vendor's liability.",
    guidance:
      "Insist that security incidents and IP infringement sit outside the general cap. If the vendor won't go uncapped, a 2x super-cap is the standard compromise. Watch for caps measured against a single month's fees.",
    severity: "critical",
    isRequired: true,
  },
  {
    clauseType: "indemnification",
    title: "Indemnification",
    standardPosition:
      "Vendor indemnifies the customer against third-party claims for IP infringement by the service and for damages caused by the vendor's security breach, including defense and settlement.",
    fallbackPosition:
      "IP-infringement indemnity with defense and settlement control; customer controls settlements that admit customer liability.",
    walkAway:
      "No vendor indemnity, or a one-way indemnity requiring the customer to indemnify the vendor for ordinary use of the service.",
    guidance:
      "IP indemnity is non-negotiable for any software the customer embeds in its workflows. Reject broad customer-side indemnities for 'use of the service.'",
    severity: "high",
    isRequired: true,
  },
  {
    clauseType: "data_protection",
    title: "Data Protection & Privacy",
    standardPosition:
      "A DPA is incorporated. Vendor acts only as a processor on documented instructions, notifies the customer of a breach within 72 hours, deletes or returns data on termination, and maintains an approved subprocessor list.",
    fallbackPosition:
      "Breach notice 'without undue delay' instead of a fixed 72 hours, and subprocessor changes on notice rather than prior approval.",
    walkAway:
      "No breach-notification obligation; the vendor asserting ownership of customer data; or customer data used to train the vendor's models without explicit consent.",
    guidance:
      "The single most common red flag is a clause letting the vendor 'use data to improve its services' — clarify whether that includes model training and require anonymization. Confirm deletion timelines on exit.",
    severity: "critical",
    isRequired: true,
  },
  {
    clauseType: "confidentiality",
    title: "Confidentiality",
    standardPosition:
      "Mutual confidentiality obligations that survive at least 3 years post-termination (perpetual for trade secrets), with standard exclusions.",
    fallbackPosition:
      "A 2-year survival period, provided trade secrets remain protected for as long as they qualify as such.",
    walkAway:
      "One-way confidentiality favoring the vendor, or a survival period under 1 year.",
    guidance:
      "Confidentiality should be reciprocal. Flag any asymmetric obligations and short survival windows, which are common in vendor-drafted forms.",
    severity: "high",
    isRequired: true,
  },
  {
    clauseType: "term_and_termination",
    title: "Term & Termination",
    standardPosition:
      "Termination for convenience on 30 days' notice, termination for cause with a cure period, and either no auto-renewal or auto-renewal with an opt-out window of 30 days or less.",
    fallbackPosition:
      "Auto-renewal acceptable if the non-renewal notice window is 60 days or less and is clearly flagged for calendaring.",
    walkAway:
      "Auto-renewal requiring more than 90 days' notice to cancel, or no right to terminate for the vendor's uncured material breach.",
    guidance:
      "Auto-renewal traps are the top source of unwanted spend. Any renewal notice window must be captured as an obligation with a calendar reminder.",
    severity: "high",
    isRequired: true,
  },
  {
    clauseType: "ip_ownership",
    title: "Intellectual Property Ownership",
    standardPosition:
      "Customer retains ownership of its data and of any deliverables created for it. Vendor retains its pre-existing IP and platform.",
    fallbackPosition:
      "Vendor may retain a license to aggregated, de-identified usage data for analytics and benchmarking.",
    walkAway:
      "Vendor claims ownership of customer data or of content the customer creates in the product.",
    guidance:
      "Draw a bright line between the vendor's platform IP (theirs) and customer data/output (customer's). Reject any grant that assigns customer content to the vendor.",
    severity: "high",
    isRequired: true,
  },
  {
    clauseType: "payment_terms",
    title: "Payment Terms",
    standardPosition:
      "Net-30 payment terms, fees fixed for the initial term, and any renewal increase capped at 5% per year.",
    fallbackPosition:
      "Net-15 terms and a renewal increase capped at 7% or CPI, whichever is lower.",
    walkAway:
      "Payment due on receipt, or uncapped / unilateral price increases.",
    guidance:
      "Cap uplifts explicitly. 'Then-current list price' language is an uncapped increase in disguise — flag it and negotiate a ceiling.",
    severity: "medium",
    isRequired: true,
  },
  {
    clauseType: "governing_law",
    title: "Governing Law & Venue",
    standardPosition:
      "Governed by Delaware law or the customer's home state, with venue in the same jurisdiction.",
    fallbackPosition: "Any neutral U.S. state with courts of competent jurisdiction.",
    walkAway:
      "A foreign jurisdiction, or the vendor's exclusive home venue combined with a prevailing-party fee-shifting clause.",
    guidance:
      "Venue matters most when paired with fee-shifting or arbitration. A neutral U.S. state is an acceptable compromise; foreign law is not.",
    severity: "low",
    isRequired: false,
  },
  {
    clauseType: "warranty",
    title: "Warranties & SLA",
    standardPosition:
      "Vendor warrants the service will materially conform to its documentation, backed by an SLA with service credits.",
    fallbackPosition:
      "A 30-day conformance warranty with re-performance or refund as the remedy.",
    walkAway:
      "The service provided 'AS IS' with all warranties disclaimed and no SLA.",
    guidance:
      "A blanket 'AS IS' disclaimer with no SLA leaves the customer with no remedy for downtime. Require at minimum a conformance warranty.",
    severity: "medium",
    isRequired: false,
  },
  {
    clauseType: "insurance",
    title: "Insurance",
    standardPosition:
      "Vendor maintains cyber/tech E&O insurance of at least $5M and commercial general liability, naming the customer as additional insured on request.",
    fallbackPosition: "Cyber/tech E&O of at least $2M for lower-risk engagements.",
    walkAway:
      "No cyber insurance for a vendor that stores or processes customer data.",
    guidance:
      "Scale the required cyber limit to data sensitivity. Absence of any insurance clause for a data-processing vendor is itself a finding.",
    severity: "medium",
    isRequired: false,
  },
  {
    clauseType: "assignment",
    title: "Assignment",
    standardPosition:
      "Neither party may assign without the other's consent, except to a successor in a merger or sale of substantially all assets, on notice.",
    fallbackPosition:
      "Assignment to affiliates permitted on prior written notice.",
    walkAway:
      "Vendor may freely assign the agreement, including to a competitor of the customer, without notice or consent.",
    guidance:
      "Preserve a consent right so the customer isn't forced into a relationship with an acquirer it wouldn't have chosen — especially a competitor.",
    severity: "low",
    isRequired: false,
  },
  {
    clauseType: "publicity",
    title: "Publicity & Use of Name",
    standardPosition:
      "Neither party uses the other's name or logo without prior written consent.",
    fallbackPosition:
      "Vendor may list the customer's name/logo on a customer list, with an opt-out.",
    walkAway:
      "Vendor granted unrestricted rights to publicize the relationship, issue press releases, or use the customer's marks.",
    guidance:
      "Low stakes but easy to win. Convert any broad publicity grant into a mutual consent requirement.",
    severity: "low",
    isRequired: false,
  },
  {
    clauseType: "dispute_resolution",
    title: "Dispute Resolution",
    standardPosition:
      "Disputes resolved by litigation in the agreed venue, with optional good-faith mediation first and a carve-out allowing either party to seek injunctive relief.",
    fallbackPosition:
      "AAA arbitration with a carve-out for injunctive relief and each party bearing its own fees.",
    walkAway:
      "Mandatory binding arbitration in the vendor's home venue with a class-action waiver and prevailing-party fee-shifting against the customer.",
    guidance:
      "Arbitration itself is acceptable; the trap is venue + fee-shifting + no injunctive carve-out stacked together. Always preserve the ability to seek an injunction for IP/confidentiality breaches.",
    severity: "medium",
    isRequired: false,
  },
];
