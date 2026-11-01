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

## Planet customization

The seven non-Earth maps in `dist/planets.js` are original procedural Canvas illustrations. Saturn rings are generated geometry. They are not external photographs or scientific maps; sizes are normalized for the interface. The short constellation trail is generated locally.

The standalone root `index.html` embeds the same library and assets. The Three.js copyright header is retained; the full MIT license is in `dist/assets/THREE-LICENSE.txt`.
