# ORBIT — 你的世界，正在轨道上

A browser-based interactive prototype for a spatial Edge new-tab experience. Website cards orbit a draggable Earth. Hover to focus; use the wheel to arrange or resize; magnetically connect cards into circular constellations; manage favorites and pinned pages from a right-click menu.

![ORBIT prototype](screenshot.png)

## Run

Requires Node.js 18 or later. There are no dependencies to install; Three.js and visual assets are bundled locally.

```powershell
cd C:\Users\17893\Desktop\programming\assignment3\orbit-earth
node server.mjs
```

Open http://127.0.0.1:4173 in Edge or another modern desktop browser. The page uses modules and asset loading, so serve it over HTTP rather than opening index.html directly. `npm run dev` is equivalent.

## Try it

- Drag the empty space near Earth to rotate the planet and the cards.
- Scroll up over the globe or nearby empty space: the cards collect into a stationary horizontal row. Scroll down to restore orbit. Pinned entities occupy complete slots at the right end.
- Hover a card: it grows and glows; other cards dim and slow down. Wheel up/down over the highlighted card makes a small size adjustment instead of changing the whole layout.
- Drag one card onto another card or a circular constellation. Stay over the target for half a second to magnetically group them. Releasing over a target can complete the remaining dwell while the pointer stays there; moving away cancels it.
- Click a circular constellation to split it into its member cards. Click empty space, use the collapse button, or press Escape to return.
- Click or focus a card and press Enter: a zoom animation opens its local demo page. Use **打开真实网页** to open the website, or **返回轨道** / Escape to come back.
- Right-click opens a management menu; it never immediately deletes a card. The menu supports grouping, favorites, pinning, detaching from a group, and explicit close. × and Delete are alternate close actions. Use Undo or Ctrl/Cmd+Z to restore the most recently closed card or group.
- Hover or focus the folder next to the search icon to see favorites. Opening a favorite births an independent new card; closing the original never deletes the favorite.
- Enter a search term or an HTTP(S) website address. A new card splits away from the search bar, enters orbit, and opens its demo page. The demo provides links to real search results.
- Entry collects the cards into a line, carries the line once around Earth with a fast-to-slow revolution, then releases the cards into orbit. A skip button is available during entry.
- The single gear opens sound / motion settings, instructions, group management (rename / expand / dissolve), favorite management, and pin management. Restoring the 12 sample pages preserves favorites.
- Audio is synthesized locally: velocity-dependent low-frequency flight noise with radial Doppler pitch and stereo motion, a deeper entrance, a receding return, electromagnetic attraction, a quiet open-fifth brass hover pad, and an airy sound-toggle cue. No game soundtrack or sampled sound effects are included.

## Scope and limitations

This is a **web prototype**, not a browser extension. The cards are handmade illustrative previews of sample sites; they are not screenshots of the user's tabs. The page cannot enumerate, focus, or close real browser tabs. Those operations require a future extension using the browser Tabs API. Local previews keep repeated exploration possible without leaving the prototype; external links open real websites when explicitly chosen.

Cards, groups, favorites, pins and preferences are stored in this browser's localStorage. Previous prototype data migrates automatically. All visual rendering and synthesized audio run locally. Browser autoplay restrictions can keep initial entry silent until a click or key press. On devices without WebGL a static Earth fallback keeps the card interactions usable. Reduced motion follows the OS preference by default and can be changed in settings. The current prototype limits the orbit to 36 cards.

## Verification

`npm test` runs the state-model checks for grouping / merging, singleton cleanup, favorite independence, pin placement, state migration and safe search URLs. `npm run check` validates the main module's syntax. Browser verification is documented in `PROCESS.md`.

## Credits

- Three.js 0.160.1 — MIT, https://github.com/mrdoob/three.js. The bundled license is in `dist/assets/THREE-LICENSE.txt`.
- Earth texture from the Three.js r160 example assets (`examples/textures/planets/earth_atmos_2048.jpg`); visual source associated with the Three.js Earth example / NASA Earth imagery. See `CREDITS.md`.
- Coastlines: Natural Earth, public domain, https://www.naturalearthdata.com/.
- Sample website names and visual references belong to their respective owners. All miniature layouts are original illustrative representations; no website screenshots were captured.
- Audio: procedurally generated filtered noise and stereo panning; no external recordings.

See `PROCESS.md` for the design and development notes. A user trial still needs to be carried out by a real participant.
