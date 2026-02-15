# Wrestling Journal (Electron)

Desktop app for logging wrestling matches period-by-period and exporting analytics to spreadsheets.

## Features

- Create and manage matches (date, wrestler, opponent, weight class, event, result, notes)
- Log events by period:
  - takedown us (successful or not)
  - takedown them
  - nearfall us / nearfall them points
  - cautions, stalling, penalties
  - escapes and reversals
- View per-match analytics in the app:
  - takedown scored vs takedown against
  - nearfall points us/them
  - penalty/caution/stalling points
- View global analytics across matches
- Export two CSV files for spreadsheet analysis:
  - `match_summary.csv`
  - `event_log.csv`

## Run

1. Install dependencies:

```bash
npm install
```

2. Start the desktop app:

```bash
npm start
```

## Data Storage

Match data is saved locally in Electron's `userData` path as `journal-data.json`.
