Short setup
-------------

1. Get a free API key from https://www.football-data.org and copy it.
2. In your GitHub repo, go to Settings → Secrets → Actions and add a secret named `FOOTBALL_API_KEY` with that value.
3. Commit the workflow and `update_data.js` files and push to the `main` branch.
4. Open the Actions tab in GitHub, select `Update live-data.json`, and click "Run workflow" to test it once.

What this provides
-------------------

- A GitHub Actions workflow at `.github/workflows/update-live-data.yml` that runs hourly and on manual dispatch.
- A script `update_data.js` which fetches matches, standings and scorers from football-data.org, attempts to normalise team names, and writes `live-data.json`.

Notes & troubleshooting
-----------------------

- The script expects Node 18+ (the workflow sets this up). Node 18+ has a built-in `fetch`. If you use an older Node version locally, install `node-fetch` or upgrade Node.
- The football-data.org competition code for the World Cup is `WC` by default. If that changes or you want a different competition, set `COMP_CODE` in the workflow environment or update the top of `update_data.js`.
- The workflow commits `live-data.json` back to `main` automatically when changes are detected. Ensure Actions have write permissions for the repo and that `FOOTBALL_API_KEY` is set.
- If you hit rate limits, the script includes retry/backoff logic. For persistent 429s you may need to reduce fetch frequency or request a higher rate limit from the API provider.

Optional local test
-------------------

Run locally (Node 18+):

```bash
export FOOTBALL_API_KEY="your_api_key_here"
node update_data.js
```

This will create/update `live-data.json` in the repo root.

If you want to change the competition code (e.g., a different tournament), edit `update_data.js` and set `COMP_CODE` accordingly.
