# Process

## Starting idea

Create a new-tab experience in which unfinished websites feel like little worlds orbiting Earth. The intended user wants a spatial, playful way to return to open pages. The key loop is **choose a card → enter its world → return to orbit**. A second loop is **close a card → watch it dissolve → undo if needed**.

The requested motion language includes a disassembly and return flight, a rotating globe, pale card edges, hover focus with slower surrounding motion, a zoom-through transition, cloud dissolution, and a search field that births a new orbiting card.

## Implementation decisions

- Build a self-contained webpage prototype before connecting real browser-tab APIs. Use explicit sample-tab labeling and local destination previews to keep the prototype understandable and repeatable.
- Use WebGL / Three.js for Earth, atmosphere, coastlines, stars and orbit lines; use projected DOM cards for readable text, ordinary buttons, and keyboard interaction.
- Keep hover emphasis and overall orbital speed separate so a selected card can brighten while the rest of the scene slows smoothly.
- Retain a visible return path and an optional real-site link after the zoom animation.
- Add an alternative close button, keyboard close, and one-step Undo. Right-click alone would be difficult to discover and unavailable on many touch devices.
- Follow reduced-motion preferences, provide a sound switch, and avoid relying on autoplay for initial audio.
- Handle empty search input, invalid or unsupported URL schemes, a full orbit, unavailable local storage, missing globe assets and WebGL failure.

## AI use

Codex was used to implement the webpage, create original miniature website layouts, write the animation logic, synthesize sound, and prepare documentation. The user's detailed concept guided the design.

Suggestion retained: combine a rendered globe with accessible HTML cards, preserving crisp text and usable controls.

Suggestion changed: navigating away immediately after the zoom would interrupt a prototype review. The implementation instead arrives at a labeled local preview and offers an explicit link to the actual website.

## User trial — pending

No independent participant has been observed yet. Browser checks by the developer are not a substitute for the required user trial.

Ask at least one person to try the prototype without explanation. Record what they try, where they pause, whether they discover hover / close / return / search, and one design decision based on the observation. Do not invent participant feedback.

## Version 1 development verification

The developer checked the rendered prototype in the in-app Chromium browser at desktop and narrow layouts. Verified:

- The globe renders without WebGL or asset-loading errors in the tested browser.
- Dragging near the globe changes the orbit's projected card positions.
- Focusing a card enlarges / highlights it and dims the others.
- Clicking Figma completes the fly-in transition and shows its local destination; Return restores the orbit.
- Right-click close decreases the count from 12 to 11; Undo returns it to 12.
- Empty search and unsupported `javascript:` URLs produce feedback without navigation.
- Searching for `深空探索` creates card 13 and opens a local results preview with correctly encoded external links.
- Reload preserves the 13-card state; Restore returns to 12 sample cards.
- Sound, reduced-motion, automatic-orbit, and help controls respond.
- At a 390px viewport, the search field stays within the viewport and the document has no horizontal overflow.
- The checked browser console reported no errors or warnings.

Visual QA led to smaller cards on narrow screens, a compressed vertical orbit to reserve the search area, and separate stacking for interface controls. These are developer checks, not an independent user trial. The synthesized sound's subjective quality and behavior across other browsers still need human review.

## Version 2: spatial organization and sound

The user's revision replaces destructive right-click with an explicit menu, introduces a stationary horizontal row via the wheel, and adds groups, favorites and pins. A horizontal line was chosen because the user also specified a fully visible rightmost position for pinned pages.

Groups are persistent relationships between cards; favorites are independent copies of page metadata. Closing a source page therefore does not remove its favorite. Groups with a single remaining card dissolve without losing that card. A pinned member makes its collapsed constellation occupy a pinned slot.

The globe is larger. Entry is a coherent line that completes one decelerating revolution before unfolding. Opening and closing cards produces a center-directed transition with an outward repulsion pulse on neighboring cards. The search bar gains a hover glow.

All audio is original procedural synthesis: an open-fifth, low-pass brass pad with reverb for hover; a short descending electromagnetic snap for grouping; deep sub-bass / filtered-noise entrance and receding return; and airy paired tones for sound toggling. Flight uses measured source velocity and radial relative velocity for a bounded Doppler ratio, plus distance-dependent gain and stereo panning. Autoplay restrictions remain respected.

The pure state model has seven Node tests covering lossless group merges, singleton cleanup, pinned row bounds, independent favorites, migration sanitization, group pin / close, and search URL handling. All seven passed.

Version 2 browser checks:

- Right-click opened the menu and kept the tab count at 10; favorite and pin actions were applied without closing the page.
- Scrolling up on the globe changed the layout to a stationary row. The pinned Figma card occupied the right end, with its complete bounding box inside a 1280px viewport. Wheel input on a highlighted card changed its scale without leaving row mode. Scrolling down on the globe restored orbit.
- The context-menu group picker combined Figma and GitHub into a two-member circular constellation without changing the total page count.
- Dragging YouTube onto the constellation and staying over the target completed a half-second magnetic join: the group grew from two to three members, and the dragging state cleared. The remaining dwell may finish after release if the pointer stays on the target; leaving the target cancels it.
- Clicking the circle expanded the three members. Clicking empty space collapsed the constellation. Visual QA moved the expanded cards away from the title panel.
- Closing YouTube from the expanded group reduced the total count from 11 to 10 and the group from three to two. Undo restored 11 pages and three group members.
- Favorite launch increased the total page count from 10 to 11, showed the local Figma destination, and returned successfully. Removing a favorite in management left the opened cards intact.
- Group renaming was changed to save on input, without rebuilding the focused input. The displayed group name updated to `创作星群` immediately.
- Sound can be turned off and on from unified settings. Hover, enter, return, grouping and flight use distinct synthesis paths. Audio quality still needs listening on the user's headphones; automated UI checks do not assess subjective sound similarity.
- No browser console errors or warnings were observed during these interactions.
- Reload restored the renamed three-member constellation, its pin and the favorite count. At a 390px viewport the unified settings panel and search field both stayed inside the viewport with no horizontal document overflow.

These remain developer checks. An independent user trial has not been fabricated or substituted.
