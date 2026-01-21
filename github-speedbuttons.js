// ==UserScript==
// @name         GitHub PR Speed Buttons
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add quick copy buttons for filenames and line references in GitHub PR review comments
// @author       You
// @match        https://github.com/*/pull/*/
// @match        https://github.com/*/pull/*
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // SVG icons for the buttons
    const COPY_FILE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
    </svg>`;

    const COPY_LINE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>`;

    // CSS styles for the buttons
    const styles = `
        .gh-speed-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            padding: 4px;
            margin-left: 4px;
            border: 1px solid var(--borderColor-default, rgba(125, 125, 125, 0.3));
            border-radius: 6px;
            background-color: var(--bgColor-default, transparent);
            color: var(--fgColor-muted, #8b949e);
            cursor: pointer;
            transition: all 0.15s ease;
            vertical-align: middle;
        }
        .gh-speed-btn:hover {
            background-color: var(--bgColor-accent-muted, rgba(56, 139, 253, 0.15));
            border-color: var(--borderColor-accent-emphasis, #388bfd);
            color: var(--fgColor-accent, #58a6ff);
        }
        .gh-speed-btn:active {
            transform: scale(0.95);
        }
        .gh-speed-btn.copied {
            background-color: var(--bgColor-success-muted, rgba(46, 160, 67, 0.15));
            border-color: var(--borderColor-success-emphasis, #2ea043);
            color: var(--fgColor-success, #3fb950);
        }
        .gh-speed-btn svg {
            width: 14px;
            height: 14px;
        }
        .gh-speed-btn-container {
            display: inline-flex;
            align-items: center;
            margin-left: 8px;
            margin-right: 8px;
        }
    `;

    // Add styles to page
    function addStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Copy text to clipboard
    function copyToClipboard(text, button) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(text);
        } else {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Failed to copy:', err);
            });
        }

        // Visual feedback
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1000);
    }

    // Extract line numbers from a review thread
    function getLineNumbers(threadElement) {
        const lineNumbers = [];
        const lineCells = threadElement.querySelectorAll('td[data-line-number]');

        lineCells.forEach(cell => {
            const lineNum = parseInt(cell.getAttribute('data-line-number'), 10);
            if (!isNaN(lineNum)) {
                lineNumbers.push(lineNum);
            }
        });

        if (lineNumbers.length === 0) return null;

        const minLine = Math.min(...lineNumbers);
        const maxLine = Math.max(...lineNumbers);

        if (minLine === maxLine) {
            return { single: minLine };
        } else {
            return { start: minLine, end: maxLine };
        }
    }

    // Format line reference string
    function formatLineReference(lineInfo, filename) {
        if (!lineInfo) return null;

        if (lineInfo.single) {
            return `line ${lineInfo.single} in file ${filename}`;
        } else {
            return `lines ${lineInfo.start}-${lineInfo.end} in file ${filename}`;
        }
    }

    // Create a button element
    function createButton(icon, tooltip, onClick) {
        const button = document.createElement('button');
        button.className = 'gh-speed-btn';
        button.innerHTML = icon;
        button.title = tooltip;
        button.type = 'button';
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(button);
        });
        return button;
    }

    // Process a single review thread
    function processThread(threadElement) {
        // Skip if already processed
        if (threadElement.querySelector('.gh-speed-btn-container')) return;

        // Find the filename link in the summary
        const summary = threadElement.querySelector('summary');
        if (!summary) return;

        const filenameLink = summary.querySelector('a.text-mono.text-small.Link--primary');
        if (!filenameLink) return;

        const filename = filenameLink.textContent.trim();
        if (!filename) return;

        // Get line numbers
        const lineInfo = getLineNumbers(threadElement);

        // Create button container
        const container = document.createElement('span');
        container.className = 'gh-speed-btn-container';

        // Copy filename button
        const copyFileBtn = createButton(
            COPY_FILE_ICON,
            `Copy filename: ${filename}`,
            (btn) => copyToClipboard(filename, btn)
        );
        container.appendChild(copyFileBtn);

        // Copy line reference button (only if we have line info)
        if (lineInfo) {
            const lineRef = formatLineReference(lineInfo, filename);
            const copyLineBtn = createButton(
                COPY_LINE_ICON,
                `Copy: ${lineRef}`,
                (btn) => copyToClipboard(lineRef, btn)
            );
            container.appendChild(copyLineBtn);
        }

        // Insert after the filename link
        filenameLink.parentNode.insertBefore(container, filenameLink.nextSibling);
    }

    // Process all review threads on the page
    function processAllThreads() {
        const threads = document.querySelectorAll('.review-thread-component');
        threads.forEach(processThread);
    }

    // Initialize the script
    function init() {
        addStyles();
        processAllThreads();

        // Watch for dynamically loaded content
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldProcess = true;
                    break;
                }
            }
            if (shouldProcess) {
                // Debounce the processing
                clearTimeout(window._ghSpeedBtnTimeout);
                window._ghSpeedBtnTimeout = setTimeout(processAllThreads, 250);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
