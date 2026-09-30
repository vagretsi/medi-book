#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
medibook_test_dir=$(mktemp -d "${TMPDIR:-/tmp}/medibook-tests.XXXXXX")
trap 'rm -rf -- "$medibook_test_dir"' EXIT
./node_modules/.bin/tsc tests/*.test.ts --outDir "$medibook_test_dir" --module commonjs --target es2020 --esModuleInterop --skipLibCheck
node --test "$medibook_test_dir"/tests/*.test.js
