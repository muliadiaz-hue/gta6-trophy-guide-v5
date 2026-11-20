// Leonida Platinum — GTA 6 Trophy Guide & Tracker.
// Entry program for make.fun competition gta6-trophy-guide-01 (Node 22,
// standard library only). The guide itself is a static web app in app/:
// plain HTML, ES modules, one stylesheet and app/data/trophies.json. It
// loads nothing over the network and needs no build step.
//
// This program hands the guide in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json
// there with the vendored make.fun library (vendor/makefun-frontend.ts,
// the kit's copy, unchanged — the scorer requires the dossier to be byte
// for byte what that library writes).
//
// The output directory is /output in the grader, or $MAKEFUN_OUTPUT_DIR
// for a local run. /output is a mount point in the grader, so this program
// NEVER removes the output directory itself: deleting a mount point throws
// EBUSY ("Device or resource busy") and kills the run before anything is
// written. It only ever clears the directory's CONTENTS, one child at a
// time, and leaves the directory standing.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Prepare the output directory: create it if missing, then remove only
// what is inside it. The directory itself is never removed — see the
// header note: in the grader it is a mount point and removing it fails.
function clearOutputContents(dir) {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

clearOutputContents(outDir);

const appSource = join(repoRoot, 'app');
const shotsSource = join(repoRoot, 'screenshots');

// Fail loudly, before touching the output, if the guide folder is missing
// — a silent empty hand-in would be worse than a failed run.
if (!existsSync(appSource)) {
  throw new Error(`main.ts: app/ not found beside this file (${appSource})`);
}

cpSync(appSource, join(outDir, 'app'), { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (competition gate limits): text_max_bytes shapes
// the dossier bytes; the others refuse an entry the scorer would refuse
// (more than 4 screenshots, one over 256 KiB, more than 993 files and
// directories in app/, or more than 48 MiB of app files).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Platinum: wrote ${outDir}/dossier.json`);
