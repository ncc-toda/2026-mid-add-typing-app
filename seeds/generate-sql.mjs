#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(dir, "problems.json"), "utf8"));

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const errors = [];
const ids = new Set();
const counts = { beginner: 0, intermediate: 0, advanced: 0 };

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

for (const problem of problems) {
  if (typeof problem.id !== "number" || !Number.isInteger(problem.id)) {
    errors.push(`invalid id: ${problem.id}`);
    continue;
  }
  if (ids.has(problem.id)) {
    errors.push(`duplicate id ${problem.id}`);
  }
  ids.add(problem.id);

  if (!DIFFICULTIES.includes(problem.difficulty)) {
    errors.push(`id ${problem.id}: invalid difficulty ${problem.difficulty}`);
  } else {
    counts[problem.difficulty] += 1;
  }

  if (!Array.isArray(problem.reply_units) || problem.reply_units.length === 0) {
    errors.push(`id ${problem.id}: reply_units must be a non-empty array`);
    continue;
  }

  const text = problem.reply_units.map((unit) => unit.display).join("");
  const reading = problem.reply_units.map((unit) => unit.reading).join("");
  if (text !== problem.reply_text) {
    errors.push(
      `id ${problem.id}: reply_text mismatch\n  json:  ${JSON.stringify(problem.reply_text)}\n  units: ${JSON.stringify(text)}`,
    );
  }
  if (reading !== problem.reply_reading) {
    errors.push(
      `id ${problem.id}: reply_reading mismatch\n  json:  ${JSON.stringify(problem.reply_reading)}\n  units: ${JSON.stringify(reading)}`,
    );
  }

  const blob = `${problem.incoming_message}\n${problem.reply_text}`;
  if (/https?:\/\//i.test(blob)) {
    errors.push(`id ${problem.id}: contains a full URL`);
  }
}

for (const difficulty of DIFFICULTIES) {
  if (counts[difficulty] < 12) {
    errors.push(`${difficulty}: ${counts[difficulty]} problems (need 12+)`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const inserts = problems.map((problem) => {
  const unitsJson = JSON.stringify(problem.reply_units);
  return `INSERT OR IGNORE INTO problems (id, difficulty, channel, sender, incoming_message, reply_text, reply_reading, reply_units) VALUES (${problem.id}, ${sqlString(problem.difficulty)}, ${sqlString(problem.channel)}, ${sqlString(problem.sender)}, ${sqlString(problem.incoming_message)}, ${sqlString(problem.reply_text)}, ${sqlString(problem.reply_reading)}, ${sqlString(unitsJson)});`;
});

const sql = `-- Generated from seeds/problems.json. Do not edit by hand.\n${inserts.join("\n")}\n`;
writeFileSync(join(dir, "problems.sql"), sql);
console.log(`wrote seeds/problems.sql (${problems.length} rows: ${JSON.stringify(counts)})`);
