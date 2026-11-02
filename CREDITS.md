# Assets and references

## Third-party library

- Three.js 0.160.1, MIT. Downloaded from the pinned npm CDN distribution: https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js
- Project and license: https://github.com/mrdoob/three.js

## Earth imagery and map data

- Earth texture: https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_atmos_2048.jpg
- Three.js Earth example reference: https://github.com/mrdoob/three.js/blob/r160/examples/webgl_shaders_earth.html
- Land geometry: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
- Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/

## Original work

Layout, 3D scene composition, card mock previews, procedural audio, transition design and icon SVGs were created for this prototype with Codex assistance. Named services are visual references only and do not sponsor or endorse this project. No source from NebulaDashboard, Tab Sphere, Orbit Station or TabFlow was copied into this prototype.

## HD planet maps and Saturn rings (updated 2026-11-02)

Author: **Solar System Scope / INOVE**. Source: https://www.solarsystemscope.com/textures/

License: **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/ . These assets may be shared and adapted with attribution. The source describes NASA elevation/imagery data and spacecraft/Hubble color references, with some fictional gap filling and saturation adjustments. They are data-derived maps, not unaltered photographs of every surface point.

The original image files are retained in dist/assets/planets/. SOURCES.json records the exact download URLs, measured pixel dimensions, byte counts, retrieval date and SHA-256 hashes. Asset files were not resized or painted. Runtime sphere/ring mapping, color-space handling and lighting affect their displayed appearance.

| File | Measured pixels |
| --- | --- |
| 8k_mercury.jpg | 8192 × 4096 |
| 4k_venus_atmosphere.jpg | 4096 × 2048 |
| 8k_mars.jpg | 8192 × 4096 |
| 8k_jupiter.jpg | 4096 × 2048 |
| 8k_saturn.jpg | 4096 × 2048 |
| 8k_saturn_ring_alpha.png | 8192 × 500 |
| 2k_uranus.jpg | 2048 × 1024 |
| 2k_neptune.jpg | 2048 × 1024 |

The filenames are those supplied by the publisher. Some filenames marked 8k contain a 4K image; the table reports actual dimensions. The earlier procedurally drawn planet surfaces and segmented ring appearance have been replaced. Earth retains the earlier Three.js example texture and Natural Earth coastlines credited above.

The standalone root index.html embeds these same assets. The Three.js copyright header is retained; the full MIT license is in dist/assets/THREE-LICENSE.txt. In-app settings also display attribution.
