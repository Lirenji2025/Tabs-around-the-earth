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

## Development verification

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
