// Runs after every build (npm postbuild): the lazy 3D chunk (three.js + the scene) may not grow unnoticed.
import { readdirSync, statSync } from 'node:fs';

const BUDGET = 960 * 1024; // bytes, uncompressed; 938,555 on 2026-11-08
const dir = 'dist/_astro';
const chunks = readdirSync(dir).filter((f) => /^earth\..*\.js$/.test(f));
if (chunks.length !== 1) throw new Error(`expected one earth chunk in ${dir}, found ${chunks.length}`);
const size = statSync(`${dir}/${chunks[0]}`).size;
if (size > BUDGET) {
  console.error(`${chunks[0]}: ${size} bytes, over the ${BUDGET} budget (raise it in scripts/check-budget.mjs only on purpose)`);
  process.exit(1);
}
console.log(`earth chunk ${size} / ${BUDGET} bytes`);
