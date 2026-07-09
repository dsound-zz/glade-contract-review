import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

// The lifecycle of a contract as it moves through the pipeline. Explicit states
// make the async extraction observable in the UI and recoverable on failure.
export const contractStatus = pgEnum("contract_status", [
  "uploaded",
  "extracting",
  "extracted",
  "in_review",
  "completed",
  "failed",
]);

// The universe of clause types the playbook reasons about. Keeping this as an
// enum (rather than free text) is what lets us join clauses <-> playbook rules
// and detect *missing* required clauses.
export const clauseType = pgEnum("clause_type", [
  "limitation_of_liability",
  "indemnification",
  "confidentiality",
  "term_and_termination",
  "governing_law",
  "ip_ownership",
  "payment_terms",
  "warranty",
  "data_protection",
  "assignment",
  "insurance",
  "dispute_resolution",
  "non_solicitation",
  "publicity",
  "force_majeure",
  "other",
]);

// AI/human assessment of a clause against the playbook. `missing` is a finding
// with no clause attached — a required position the contract never took.
export const verdict = pgEnum("verdict", [
  "acceptable",
  "attention",
  "unacceptable",
  "missing",
]);

export const severity = pgEnum("severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const obligationType = pgEnum("obligation_type", [
  "payment",
  "renewal",
  "termination_notice",
  "deliverable",
  "reporting",
  "audit",
  "data_deletion",
  "insurance",
  "other",
]);

/* -------------------------------------------------------------------------- */
/*  Playbook — the firm's codified standard positions                         */
/* -------------------------------------------------------------------------- */

// This is the product's spine. Each row is a position the firm takes on a class
// of clause: what we want, what we'll settle for, and what kills the deal.
export const playbookRules = pgTable("playbook_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clauseType: clauseType("clause_type").notNull(),
  title: text("title").notNull(),
  // What we ideally require.
  standardPosition: text("standard_position").notNull(),
  // The compromise we'll accept without escalation.
  fallbackPosition: text("fallback_position").notNull(),
  // The deal-breaker — presence of this is `unacceptable`.
  walkAway: text("walk_away").notNull(),
  // Negotiation guidance / suggested redline language the reviewer can lift.
  guidance: text("guidance").notNull(),
  severity: severity("severity").notNull().default("medium"),
  // When true, a contract that omits this clause type is flagged `missing`.
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Contracts                                                                  */
/* -------------------------------------------------------------------------- */

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  counterparty: text("counterparty"),
  contractType: text("contract_type"),
  status: contractStatus("status").notNull().default("uploaded"),
  rawText: text("raw_text").notNull(),
  sourceFilename: text("source_filename"),
  wordCount: integer("word_count").notNull().default(0),
  // Rollup risk score (0-100), computed from assessments after review.
  riskScore: integer("risk_score"),
  // Populated when status = 'failed'.
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Clauses — extracted spans, grounded back to the source text               */
/* -------------------------------------------------------------------------- */

export const clauses = pgTable(
  "clauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    clauseType: clauseType("clause_type").notNull().default("other"),
    heading: text("heading"),
    // The exact text the model pulled out — used verbatim for highlighting.
    extractedText: text("extracted_text").notNull(),
    // Character offsets into contracts.rawText. Enables the source highlight and
    // is the anchor for our anti-hallucination grounding check.
    spanStart: integer("span_start"),
    spanEnd: integer("span_end"),
    // True only if extractedText was verified to actually occur in rawText.
    grounded: boolean("grounded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("clauses_contract_idx").on(t.contractId)],
);

/* -------------------------------------------------------------------------- */
/*  Assessments — AI verdict + human override, one per finding                 */
/* -------------------------------------------------------------------------- */

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    // Null when the finding is a MISSING required clause.
    clauseId: uuid("clause_id").references(() => clauses.id, {
      onDelete: "cascade",
    }),
    ruleId: uuid("rule_id").references(() => playbookRules.id, {
      onDelete: "set null",
    }),
    // Denormalized so missing-clause findings and grouping don't need a join.
    clauseType: clauseType("clause_type").notNull(),
    aiVerdict: verdict("ai_verdict").notNull(),
    aiRationale: text("ai_rationale").notNull(),
    // Suggested redline / fallback language lifted from (or informed by) the rule.
    aiSuggestion: text("ai_suggestion"),
    confidence: real("confidence").notNull().default(0.5),
    // Human-in-the-loop override. Null until a reviewer acts.
    humanVerdict: verdict("human_verdict"),
    humanNote: text("human_note"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("assessments_contract_idx").on(t.contractId)],
);

/* -------------------------------------------------------------------------- */
/*  Obligations — the post-signing timeline                                    */
/* -------------------------------------------------------------------------- */

export const obligations = pgTable(
  "obligations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    obligationType: obligationType("obligation_type").notNull().default("other"),
    // Who owes the obligation: 'us', the counterparty name, or 'both'.
    responsibleParty: text("responsible_party"),
    // Absolute date when the model could resolve one.
    dueDate: date("due_date"),
    // Relative timing when no absolute date exists, e.g. "30 days before renewal".
    trigger: text("trigger"),
    recurrence: text("recurrence"),
    extractedText: text("extracted_text"),
    spanStart: integer("span_start"),
    spanEnd: integer("span_end"),
    grounded: boolean("grounded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("obligations_contract_idx").on(t.contractId)],
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const contractsRelations = relations(contracts, ({ many }) => ({
  clauses: many(clauses),
  assessments: many(assessments),
  obligations: many(obligations),
}));

export const clausesRelations = relations(clauses, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [clauses.contractId],
    references: [contracts.id],
  }),
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  contract: one(contracts, {
    fields: [assessments.contractId],
    references: [contracts.id],
  }),
  clause: one(clauses, {
    fields: [assessments.clauseId],
    references: [clauses.id],
  }),
  rule: one(playbookRules, {
    fields: [assessments.ruleId],
    references: [playbookRules.id],
  }),
}));

export const obligationsRelations = relations(obligations, ({ one }) => ({
  contract: one(contracts, {
    fields: [obligations.contractId],
    references: [contracts.id],
  }),
}));

// Handy inferred types for the app layer.
export type Contract = typeof contracts.$inferSelect;
export type Clause = typeof clauses.$inferSelect;
export type PlaybookRule = typeof playbookRules.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Obligation = typeof obligations.$inferSelect;
export type Verdict = (typeof verdict.enumValues)[number];
export type ClauseTypeValue = (typeof clauseType.enumValues)[number];
