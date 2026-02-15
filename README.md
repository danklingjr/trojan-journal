# Trojan Journal (Electron)

Desktop app for tracking wrestling matches by wrestler, logging period-by-period events, and exporting structured CSV data for deeper analysis.

## App Overview

Trojan Journal is built for match review workflows where you need both quick in-app insight and clean export data.

- Manage a roster of wrestlers and switch between them from a sidebar
- Create matches with date, opponent, weight class, event name, and result
- Log events by period (regulation plus overtime) with side, points, and notes
- Track period choice (top/bottom/neutral) where applicable
- Edit or delete wrestlers, matches, and individual events
- Add a markdown-enabled match summary for qualitative review notes
- View analytics for:
  - selected match
  - selected wrestler across all of their matches
- Export the selected match as a period-ordered CSV file
- Use a resizable split layout and theme toggle (system theme with optional forced dark mode)

## Event Types

Supported event types in the match event log:

- Shot Attempt
- Takedown
- Nearfall
- Escape
- Reversal
- Caution
- Stalling
- Penalty

## Analytics Tracked

The app calculates key metrics from logged events, including:

- Takedown attempts, takedown successes, and takedown percentage
- Takedowns given up
- Escape counts and escape percentage context
- Reversal counts
- Nearfall points (us/them and total)
- Penalty-related counts and points
- Wrestler record (wins/losses)

## Export

Export runs from the selected match and writes a CSV file to a folder you choose.

- Output file pattern: `selected_match_period_events_<date>_<opponent>.csv`
- Includes period, period choice, event sequence in period, type, side, points, note, timestamp, and match summary

## Run Locally

```bash
npm install
npm start
```

## Tech Stack

- Electron (main, preload, renderer)
- Vanilla JavaScript, HTML, and CSS
- IPC bridge for load/save/export operations

## Data Storage

Data is stored locally in Electron `userData` as `journal-data.json`.

Saved data includes:

- wrestlers
- matches
- events
- period choices
- summaries

Older saved data is automatically backfilled at startup for newer required fields where possible.
