# ORBIT — 你的世界，正在轨道上

A browser-based interactive prototype for a spatial Edge new-tab experience. Website cards orbit a draggable Earth. Hover to focus; click to fly into a local page preview; right-click to dissolve a card; search to create and enter a new card.

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
- Hover a card: it grows and glows; other cards dim and slow down.
- Click or focus a card and press Enter: a zoom animation opens its local demo page. Use **打开真实网页** to open the website, or **返回轨道** / Escape to come back.
- Right-click a card, click its ×, or press Delete while it is focused: it dissolves into a cloud. Use Undo or Ctrl/Cmd+Z to restore the last closed card.
- Enter a search term or an HTTP(S) website address. A new card splits away from the search bar, enters orbit, and opens its demo page. The demo provides links to real search results.
- Replay the entrance, toggle sound, pause automatic rotation, or enable reduced motion using the controls. Restore the original 12 cards from settings.

## Scope and limitations

This is a **web prototype**, not a browser extension. The cards are handmade illustrative previews of sample sites; they are not screenshots of the user's tabs. The page cannot enumerate, focus, or close real browser tabs. Those operations require a future extension using the browser Tabs API. Local previews keep repeated exploration possible without leaving the prototype; external links open real websites when explicitly chosen.

Card state and preferences are stored in this browser's localStorage. All visual rendering and synthesized audio run locally. Initial entry is silent until audio can be enabled by a user gesture. On devices without WebGL a static Earth fallback keeps the card interactions usable. Reduced motion follows the OS preference by default and can be changed in settings. The current prototype limits the orbit to 36 cards.

## Credits

- Three.js 0.160.1 — MIT, https://github.com/mrdoob/three.js. The bundled license is in `dist/assets/THREE-LICENSE.txt`.
- Earth texture from the Three.js r160 example assets (`examples/textures/planets/earth_atmos_2048.jpg`); visual source associated with the Three.js Earth example / NASA Earth imagery. See `CREDITS.md`.
- Coastlines: Natural Earth, public domain, https://www.naturalearthdata.com/.
- Sample website names and visual references belong to their respective owners. All miniature layouts are original illustrative representations; no website screenshots were captured.
- Audio: procedurally generated filtered noise and stereo panning; no external recordings.

See `PROCESS.md` for the design and development notes. A user trial still needs to be carried out by a real participant.
