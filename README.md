# GitHub PR Speed Buttons

A Tampermonkey userscript that adds quick copy buttons to GitHub pull request review comments.

## Features

Adds two buttons next to filenames in PR review comment threads:

1. **Copy filename** - Copies the relative file path (e.g., `src/components/Button.tsx`)
2. **Copy line reference** - Copies filename with line number (e.g., `line 42 in file src/components/Button.tsx` or `lines 10-15 in file ...`)

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Create a new script in Tampermonkey
3. Copy the contents of `github-speedbuttons.js` into the editor
4. Save

## Usage

Navigate to any GitHub pull request with review comments. The buttons appear automatically next to each filename in the review threads.

Click a button to copy to clipboard - it briefly turns green to confirm the copy.
