# PROCESS — Assignment 3

## 1. Intent and interaction loop

ORBIT explores a playful alternative to a crowded browser tab bar. Unfinished websites become small worlds orbiting a planet. The core loop is **point at a card → receive focus feedback → enter its world → return to orbit**. A second loop organizes cards through grouping, favorites and pins.

The intended setting is an Edge startup/new-tab page. This assignment delivers a working webpage with sample cards, testable without extension permissions. It does not claim to manage actual browser tabs.

## 2. Input → response → feedback

| Input | Response | Feedback |
| --- | --- | --- |
| Hover | Focus card; slow surrounding motion | White glow, enlargement, dimmed neighbors, synthesized brass |
| Wheel near planet | Collect into row / restore orbit | Smooth repositioning and layout caption |
| Wheel on card | Resize within 25%–180% | Smooth scaling and spring rebound at bounds |
| Drag onto card, dwell 500ms | Form or merge constellation | Progress ring, magnetic sound, circular group |
| Drag onto favorites, dwell 500ms | Store independent favorite | Flashing folder, progress ring, success message |
| Click | Enter destination / expand group | Zoom-through transition / group splitting |
| Search | Create independent card | Cell division and entry transition |
| Explicit close | Remove card or group | Cloud dissolve and recoverable Undo |
| Choose planet | Change scene and save preference | New surface, name, caption and Saturn rings |

## 3. Iteration record

### V1 — cinematic spatial browsing

Implemented Earth, projected HTML cards, hover focus, globe dragging, zoom-through entry/return, cloud closing, search and local persistence. Entry scattered cards away, then returned them on curved paths. Right-click initially closed cards.

Developer checks identified narrow-screen crowding, leading to smaller cards and a compressed vertical orbit. Clear return controls and explicit external links kept repeated prototype exploration possible.

### V2 — organization and sound

The author requested non-destructive right-click, a stationary row, circular groups, magnetic dwell, favorites, pins and unified management. These became persistent state relationships. Singleton groups dissolve without losing survivors; closing a page does not remove its independent favorite.

Entry temporarily changed to a fast-to-slow revolution in a line. Original procedural sound added velocity/radial Doppler motion, deeper entry, receding return, electromagnetic grouping and airy toggles. No game soundtrack was sampled.

### V3 — feedback and simplification, 2026-11-01

| Feedback received in the development conversation | Resulting change |
| --- | --- |
| Ordinary cards appeared repelled from the center | Removed permanent radial exclusion; retained short create/close pulses |
| Group UI obscured cards | Replaced opaque panel with compact, mostly pointer-transparent top toolbar |
| Zoom range too small | Added 25%–180% bounds, spring feedback and persistence |
| Right cards obscured left cards; pins overlapped | Allocate actual zoomed widths, fit complete row, reserve right-end pins; left unfocused cards stack above right ones |
| Drag floating cards into favorites | Added 500ms collection with flashing and progress; original remains open |
| Search click needs feedback | Added a brief light/border pulse |
| Mouse should draw constellations | Added sparsely sampled stars and segments |
| “星座太长” — constellation too long | Limited to 8 nodes, approximately 230px total path and 850ms lifetime |
| Restore the first entry animation | Restored V1 scatter-away / curved-return positions, opacity and tilt from its actual commit; the briefly tried rear-to-front line is not final |
| Directly openable webpage and repository source | Generated standalone root HTML with embedded assets; retained modules, tests, documentation and history |

## 4. Real user feedback and resulting change

**Evidence source:** the author relayed trial-participant feedback in this conversation on 2026-11-01. When asked about the trial, the author replied:

> “没有卡住，说可以自定义星球”

The reported result was no blockage, with a suggestion to customize the planet. Settings now offer Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. The choice persists. Original procedural surfaces distinguish the planets; Saturn includes three-dimensional rings.

This is **author-reported feedback**, not a trial directly observed or recorded by Codex. The participant's identity, exact tasks, duration, and whether explanations were withheld until after first use were not supplied. This document therefore does not invent a timed session, task-success rate or proof of the assignment's “try before explanation” condition. The author should confirm that condition before submission if it has not already been satisfied.

The author also supplied the concrete usability observations listed in V3. Those informed actual revisions; they are not presented as independent participant data.

## 5. AI use and design judgment

**Tool:** OpenAI Codex, including code editing, browser-based developer verification and Sites publishing. The author supplied the concept, intended motion/sound language, successive corrections and trial feedback.

AI-assisted work includes HTML/CSS/JavaScript, miniature website layouts, WebGL composition, procedural sound, state checks, standalone packaging and documentation. No generated-photo assets or copied implementation from researched tab managers were used.

**Suggestion kept:** combine a Three.js planet with projected DOM cards, retaining readable text, semantic controls and keyboard access while allowing spatial motion.

**Suggestions changed or rejected:**

- Immediate real-site navigation would interrupt testing. Entry instead reaches a labeled local preview with an explicit external link.
- Destructive right-click became a management menu.
- Permanent center exclusion, long constellation trails and elaborate line-entry motion were removed or simplified after author feedback.
- The fixed Earth became configurable following the reported participant suggestion.

AI output was iterated against visible behavior; the first proposal was not treated as final.

## 6. Implementation and ordinary errors

- State logic is separate from rendering. Cards, groups and favorites have independent IDs; singleton groups reconcile safely.
- Empty search and unsupported URL schemes give feedback without navigation. Search terms are encoded.
- The 36-card limit explains why another card cannot be added.
- One-step Undo restores the last closed card or group. Collecting an existing favorite does not duplicate or delete it.
- Persistence failures are caught. Migration sanitizes URLs and bounds zoom values.
- Reduced motion follows the OS unless overridden. Sound respects browser autoplay restrictions. WebGL failure has a static fallback.
- All standalone runtime assets are embedded. The build uses Node built-ins and syntax-validates the assembled script; licenses remain in the repository.

## 7. Developer verification

These checks are separate from the reported user trial.

Earlier browser checks covered entry/return, blank and invalid search, undo, group creation/expansion/collapse, group close/undo, independent favorites, pins, settings, persistence and 390px layouts. V2 exposed a focused rename input being rebuilt, which was fixed to save without replacing it.

V3 checks include browser rendering of the standalone page and planet selector, successful drag-to-folder collection after half a second, non-overlapping pinned row bounds, and console inspection. Ten Node tests cover lossless grouping, singleton cleanup, favorites, safe migration/search, group pin/close, dense zoomed rows at 390/768/1280px, zoom persistence and planet preference validation.

The single-file bundle is syntax-checked during build. Its HTTP preview works. The testing browser blocks file: URLs, so actual double-click execution is **not claimed as a completed test**. Subjective headphone audio and wider device/browser coverage remain human review items.

## 8. Remaining scope

This is not yet an extension or an always-on-top desktop window. Actual tab discovery, screenshots, focus/close and startup integration need a separate extension implementation. Non-Earth planets are illustrative, not scientifically scaled or photographed. The assignment submission should link the GitHub repository containing source, screenshot and documents, not only the hosted prototype.


## 9. Default search engine — 2026-11-02

Added a default-search selector in Settings → Preferences, with Bing, Google, Baidu and DuckDuckGo. It shares the persisted engine preference with the existing search-bar shortcut. Both controls update each other and indicate the selected default; existing cards retain their original URLs. The generated standalone page is rebuilt from the same source.

Browser verification: changing Settings to Baidu updated the search bar and survived reload; changing the search-bar shortcut to DuckDuckGo updated Settings. Google settings screenshot saved in search-settings.png. All four providers produced the expected encoded destinations; browser console contained no errors.


## 10. Trial follow-up: ring control, realistic assets and search selection — 2026-11-02

The author clarified that the previously reported inability to change the default search engine was also **user-trial feedback**. Further reported observations were that Saturn's ring did not follow dragging and that non-Earth planets looked cartoon-like and lacked impact. These are author-relayed observations; no new participant identity, timing or trial recording has been invented.

Changes based on these observations:

- Saturn's surface, atmosphere and ring now share one axial-orientation group. The planet's own spin remains separate. Dragging changes pitch/yaw of the whole planet-ring system, including when the drag begins over the visible ring region.
- Replaced generated planet patterns and segmented rings with locally bundled Solar System Scope maps under CC BY 4.0. All seven non-Earth maps and the ring strip were checked for successful loading. Exact measured sizes and source hashes are in assets/planets/SOURCES.json; publisher filenames were not assumed to prove resolution.
- Replaced the native engine select with four directly clickable buttons. The selected button shows a checkmark and a current-default/saved status; both this control and the search-bar shortcut use the same persistent preference. Prior automated selectOption checks alone did not establish that a user could successfully operate the native dropdown on their device. The exact cause of the reported device-specific failure was not reproduced, so it is not claimed as proven.

Developer verification of this revision: clicked Baidu and Google buttons, confirmed highlight and search-bar updates, reloaded and confirmed Google persisted. Submitted a new Google query and a new Baidu query; their actual destination links used the selected provider with correctly encoded text. Loaded all seven image maps without console warnings/errors. A real pointer drag over Saturn's ring changed scene orientation from (0.3260, 0.2910, 0.3600) to (0.4706, 0.6291, 0.3600), with a visibly different ring plane. This is developer re-verification, not a claim that the participant has already retested the revised version.

The root standalone HTML is rebuilt with embedded high-resolution maps, increasing its size from about 3.4 MB to about 41 MB. The modular hosted version loads the selected planet on demand; disposed and superseded texture loads are guarded to prevent a slower earlier choice from overwriting a newer selection.

The rebuilt ~41 MB standalone HTTP preview also loaded its embedded 8K Mercury and Saturn maps successfully. The settings button flow worked there without a native select popup, with no console warnings/errors. GitHub Pages enters the modular build through an early redirect while the downloadable file stays self-contained for file-mode use.
