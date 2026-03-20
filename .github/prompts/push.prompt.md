---
name: push
description: Handles the full push workflow. The developer should never push directly — instead, invoke this prompt so the AI handles version bumping, commit message formatting, and pushing to the correct branch.
---

# Push Workflow

The developer does **not** run `git push` manually. Instead, they ask the AI to push.
This ensures every push includes an auto-incremented version and a clean, consistent commit message.

While working, the developer keeps **`progress.md`** at the project root up to date with brief notes about what they've done. This file is the source of truth for commit messages and changelog entries.

---

## progress.md — developer log

The developer maintains `progress.md` in parallel with their work. Format:

```md
## In progress

- fix: workspace member insert missing id field
- feat: BubbleWrapper expands from anchor size on open
- feat: ElioField.uuid() type with auto-generation
```

Entries are informal, in any language. The AI will normalize them into a clean commit message when pushing.

**Rules for the developer:**
- Add a line for every meaningful change
- Prefix with `fix:`, `feat:`, `refactor:`, `style:`, `chore:` when possible (but not required)
- Don't worry about formatting — the AI handles it

**The AI resets `progress.md` after every push** (clears the `## In progress` section and appends a `## Pushed` archive entry).

---

## Steps

### 1. Detect the current branch

```bash
git branch --show-current
```

Only `main` and `dev` are valid push targets.
If the current branch is neither, **stop and ask** the developer what to do.

### 2. Check working tree status

```bash
git status --porcelain
```

- If there are **unstaged or staged changes**, list them to the developer and ask if they should be included in this push or stashed.
- If there's **nothing to commit and nothing to push**, inform the developer and stop.

### 3. Read progress.md

Read **`progress.md`** from the project root. Use the `## In progress` section as the primary source for the commit message body.

If `progress.md` is empty or has no entries, fall back to inspecting the staged diff.

### 4. Bump the version

The version lives in **`frontend/scripts/version.js`**:

```js
export default "v0.4.0"
```

Format: `v{major}.{minor}.{patch}`

**Rules:**
- On push to `dev` → increment **patch** (`v0.4.0` → `v0.4.1`)
- On push to `main` → increment **minor** and reset patch (`v0.4.1` → `v0.5.0`)
- Never touch **major** unless the developer explicitly asks

Read the current version, compute the new one, and write it back to the file.

### 5. Stage version bump

```bash
git add frontend/scripts/version.js
```

### 6. Build the commit message

Using the entries from `progress.md` (and any extra description the developer provided), build:

**Commit message format:**

```
[{branch}] {version} — {short summary}

{bullet list of changes from progress.md, max 7 lines}
```

Examples:
```
[dev] v0.4.1 — fix workspace creation and add BubbleWrapper animation

- fix: missing id on workspace_member insert
- feat: BubbleWrapper expands from anchor size
- feat: add ElioField.uuid() type
```

```
[main] v0.5.0 — release workspace management + time tracking MVP
```

**Rules:**
- Summary line: max 72 chars, lowercase, no period
- Imperative mood in English always (translate if needed)
- Derive the summary from the most impactful entry in `progress.md`

### 7. Commit

```bash
git commit -m "{message}"
```

### 8. Push

```bash
git push origin {branch}
```

### 9. Reset progress.md

After a successful push, reset `progress.md`:
- Move the `## In progress` entries into a `## Pushed` archive section with the version and date
- Clear `## In progress` back to empty

Example result:

```md
## In progress


---

## Pushed

### [dev] v0.4.1 — 2026-03-14
- fix: missing id on workspace_member insert
- feat: BubbleWrapper expands from anchor size
- feat: add ElioField.uuid() type

### [dev] v0.4.0 — 2026-03-10
- feat: initial workspace CRUD
```

### 10. Confirm

Report back to the developer:
- Branch pushed
- New version number
- Commit message used

---

## Example interaction

**Developer:** "push"

**AI:**
1. Detects branch: `dev`
2. Checks status: 3 modified files
3. Reads `progress.md`: 3 entries
4. Bumps version: `v0.4.0` → `v0.4.1`
5. Commits: `[dev] v0.4.1 — fix workspace creation and add BubbleWrapper animation`
6. Pushes to `origin/dev`
7. Resets `progress.md` (archives the 3 entries)
8. Reports success
