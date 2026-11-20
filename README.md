# Leonida Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/muliadiaz-hue/gta6-trophy-guide-v5/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/muliadiaz-hue/gta6-trophy-guide-v5/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline tracker and guide for all 55 Grand Theft Auto VI trophies — an entry for the [make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

A static web app (no framework, no build step, no network at runtime) that works entirely from its own files:

- **Checklist** of all 55 official trophies with their exact names, descriptions and grades, saved progress, search, kind / grade / status filters, and a spoiler mode that hides unearned story trophies.
- **Guide pane** for every trophy: a guide in our own words, a missable warning where one applies, a plain "method unconfirmed at launch" notice for the five trophies with no confirmed method, and a named **Sources** line per trophy.
- **Roadmap** to the platinum in seven stages, with per-stage earned counts and a **Next-up planner** pointing at your next unearned trophy.
- **Missables** page: the one confirmed missable risk (Positive Mental Attitude — Lucia's balcony meditation in Chapter 1) and the one time-sensitive strand (Race Against Yago, Chapter 3), plus the honest statement that everything else stays available after the credits.
- **Progress & settings**: per-grade and PSN progress counters, export / import of progress as JSON, reset, and the spoiler toggle.

The look is "Leonida dusk" — deep teal-navy with hot-pink neon — our own identity, not the house paper look. No Rockstar logo or official artwork is used anywhere.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` from any static file server. Progress lives only in your browser (local storage).

## Hand it in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app, out/screenshots and out/dossier.json
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library. It never removes the output directory itself — in the grader `/output` is a mount point, and removing a mount point fails — it only clears the directory's contents.

## Sources

Trophy names, descriptions and grades are quoted exactly as PlayStation publishes them, cross-checked against Exophase, PSNProfiles and Output Lag (all three agree on all 55). PSN progress counts come from PSNProfiles. Guides are written in our own words from the official descriptions and the cited sources; where a method is unconfirmed at launch, the guide says so plainly instead of inventing one. Grand Theft Auto VI released 19 November 2026; Rockstar, Sony and Microsoft have published no separate official trophy-list page.

## License

MIT — see [LICENSE](LICENSE). Unofficial fan guide, not affiliated with Rockstar Games, Sony or PlayStation.
