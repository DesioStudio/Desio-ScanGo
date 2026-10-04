# Contributing

[简体中文](CONTRIBUTING.md) | English

Thanks for taking the time to improve Desio ScanGo.

## Local Development

```bash
npm install
npm run dev:cert   # required for iPhone testing; generates the HTTPS certificate
npm run dev
```

`npm run dev` starts both the phone page (5173) and the desktop app (Electron). The scan server inside the desktop app binds to a random port, so it differs on every launch.

If you are only working on the desktop UI and do not need a real phone camera, you can skip `npm run dev:cert` — the project falls back to HTTP automatically.

## Pull Requests

- One PR, one change — keep it focused
- Update `README.md`, `README.en.md` and `CHANGELOG.md` when behaviour changes
- Run `npm run lint` and `npm run build` before submitting
- For anything touching the phone camera, verify on real devices (at least one iOS and one Android) before opening the PR

## Code Style

- Keep modules small with a clear single responsibility
- Keep the desktop server logic, keyboard simulation and UI code separate; do not mix them
- Never commit build output (`dist/`, `release/` and `certs/` are already gitignored)
- UI copy is Chinese by default; English copy lives in `translations` and must mirror the Chinese strings one-to-one

## Reporting Issues

Please include:

- OS version and Node.js version
- Phone model and browser (iPhone Safari / Android Chrome)
- Whether you ran from source or from a packaged installer
- The service address shown in the desktop window (feel free to mask the IP)
