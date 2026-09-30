#!/usr/bin/env bash
# Run inside the server checkout: bash update.sh
# Overrides: PM2_APP=custom-name bash update.sh
#            SYSTEMD_SERVICE=medi-book.service bash update.sh
set -Eeuo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
trap 'printf "\nUpdate failed at line %s. Review the output above before retrying.\n" "$LINENO" >&2' ERR
fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }

for executable in git node npm; do
  command -v "$executable" >/dev/null 2>&1 || fail "$executable is not available."
done
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)' || fail 'Node.js 20.9 or newer is required.'
[[ "$(git branch --show-current)" == 'main' ]] || fail 'Switch to main before updating.'
[[ -z "$(git status --porcelain)" ]] || fail 'The checkout has local changes. Commit or move them before updating.'
[[ -z "${PM2_APP:-}" || -z "${SYSTEMD_SERVICE:-}" ]] || fail 'Set only PM2_APP or SYSTEMD_SERVICE, not both.'

# Check the restart target BEFORE changing dependencies or the build.
if [[ -n "${SYSTEMD_SERVICE:-}" ]]; then
  command -v systemctl >/dev/null 2>&1 || fail 'systemctl is not available.'
  systemctl cat "$SYSTEMD_SERVICE" >/dev/null || fail 'The specified systemd service does not exist.'
  if [[ "$EUID" -ne 0 ]]; then
    command -v sudo >/dev/null 2>&1 || fail 'sudo is required to restart the systemd service.'
    sudo -v
  fi
else
  command -v pm2 >/dev/null 2>&1 || fail 'PM2 was not found. For systemd, use SYSTEMD_SERVICE=your-service bash update.sh.'
  PM2_APP="${PM2_APP:-medibook}"
  pm2 describe "$PM2_APP" >/dev/null || fail 'The specified PM2 app does not exist.'
fi

printf '\n[1/5] Pulling latest main...\n'
git pull --ff-only origin main
printf '\n[2/5] Installing locked dependencies...\n'
npm ci --include=dev
printf '\n[3/5] Generating Prisma client (no database changes)...\n'
./node_modules/.bin/prisma generate
printf '\n[4/5] Building production app...\n'
npm run build
printf '\n[5/5] Restarting application...\n'
if [[ -n "${SYSTEMD_SERVICE:-}" ]]; then
  if [[ "$EUID" -eq 0 ]]; then
    systemctl restart "$SYSTEMD_SERVICE"
  else
    sudo systemctl restart "$SYSTEMD_SERVICE"
  fi
  systemctl is-active --quiet "$SYSTEMD_SERVICE"
else
  pm2 restart "$PM2_APP" --update-env
  pm2 describe "$PM2_APP"
fi
printf '\nUpdated to commit %s. Check the site in your browser.\n' "$(git rev-parse --short HEAD)"
