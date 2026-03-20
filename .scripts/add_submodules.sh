#!/bin/bash
set -e
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
echo "Repo root: $ROOT"

echo
# Check if a path is declared in .gitmodules
has_path_in_gitmodules() {
  path="$1"
  if [ -f .gitmodules ]; then
    git config --file .gitmodules --get-regexp '^submodule\..*\.path' 2>/dev/null | awk '{print $2}' | grep -xq "$path"
  else
    return 1
  fi
}

add_submodule() {
  url="$1"; path="$2"; branch="$3"
  echo "Processing $path"
  if has_path_in_gitmodules "$path"; then
    echo " - $path already in .gitmodules; skipping add"
  else
    if [ -e "$path" ]; then
      echo " - Path $path exists; moving to ${path}.bak"
      mv "$path" "${path}.bak" || true
    fi
    if [ -n "$branch" ]; then
      git submodule add -b "$branch" "$url" "$path"
    else
      git submodule add "$url" "$path"
    fi
  fi
}

# Add requested submodules
add_submodule "https://github.com/encarbassot/node_console_utils.git" "api/elioapi" "ElioApi"
add_submodule "https://github.com/encarbassot/elio-react-components.git" "frontend/src/elio-react-components" ""

echo
# Init/update
git submodule update --init --recursive

echo
# Show status
git submodule status --recursive

echo
# Stage and commit
git add .gitmodules api/elioapi frontend/src/elio-react-components || true
if ! git diff --cached --quiet; then
  git commit -m "chore: add submodules node_console_utils (api/elioapi) and elio-react-components (frontend/src/elio-react-components)" || echo "commit failed"
  git push || echo "push failed"
else
  echo "Nothing to commit"
fi

echo "Done." 
