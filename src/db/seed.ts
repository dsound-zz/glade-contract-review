import { config } from "dotenv";
config({ path: ".env.local" });

// Dynamic imports so dotenv populates process.env *before* db/index.ts reads it
// (static imports are hoisted above the config() call).
async function main() {
  const { db } = await import("./index");
  const { playbookRules } = await import("./schema");
  const { PLAYBOOK } = await import("./playbook");

  console.log("Seeding playbook rules...");

  // Idempotent: clear and re-insert so the playbook always matches source.
  await db.delete(playbookRules);
  await db.insert(playbookRules).values(PLAYBOOK);

  console.log(`Seeded ${PLAYBOOK.length} playbook rules.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
