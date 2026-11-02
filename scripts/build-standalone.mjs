import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const read=p=>fs.readFileSync(path.join(dist,p),'utf8');
const data=(p,mime)=>`data:${mime};base64,${fs.readFileSync(path.join(dist,p)).toString('base64')}`;
const earth=data('assets/earth.jpg','image/jpeg');
const coast=read('assets/land.geojson');
const planetAssets=fs.readdirSync(path.join(dist,'assets/planets')).filter(p=>/\.(jpg|png)$/.test(p)).map(p=>['./assets/planets/'+p,data('assets/planets/'+p,p.endsWith('.png')?'image/png':'image/jpeg')]);
const modules=new Map();
// This deliberately small packer supports the static named imports/exports in
// this checked-in project. Unsupported syntax fails instead of silently shipping.
function bundle(id){
  if(modules.has(id))return;
  let source=read(id),exports=[];
  source=source.replace(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?\r?$/gm,(_,binding,relative)=>{
    if(!relative.startsWith('.'))throw Error(`External dependency: ${relative}`);
    const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(id),relative.split('?')[0]));bundle(dependency);
    const value=`modules[${JSON.stringify(dependency)}]`;
    if(binding.startsWith('* as '))return `const ${binding.slice(5)}=${value};`;
    if(binding.startsWith('{'))return `const ${binding.replace(/\bas\b/g,':')}=${value};`;
    throw Error(`Unsupported import in ${id}`);
  });
  source=source.replace(/^export\s+(const|let|function|class)\s+(\w+)/gm,(_,kind,name)=>{exports.push(name);return `${kind} ${name}`;});
  source=source.replace(/^export\s*\{([^}]+)\};?\r?$/gm,(_,names)=>{exports.push(...names.split(',').map(s=>{const parts=s.trim().split(/\s+as\s+/);return parts.length===2?`${parts[1]}:${parts[0]}`:parts[0];}));return '';});
  if(/^\s*(?:import|export)\s/m.test(source))throw Error(`Unresolved module syntax in ${id}`);
  source=source.replace("fetch('./assets/land.geojson').then(r=>r.json())",`Promise.resolve(${coast.trim()})`).replaceAll('./assets/earth.jpg',earth);
  for(const [file,url] of planetAssets)source=source.replaceAll(file,url);
  modules.set(id,`modules[${JSON.stringify(id)}]=(()=>{\n${source}\nreturn {${exports.join(',')}};\n})();`);
}
bundle('orbit.js');
const js=`(()=>{'use strict';const modules={};\n${[...modules.values()].join('\n')}\n})();`;
new vm.Script(js,{filename:'standalone-bundle.js'});
let html=read('index.html').replace('<link rel="icon" type="image/svg+xml" href="./assets/orbit.svg">',`<link rel="icon" type="image/svg+xml" href="${data('assets/orbit.svg','image/svg+xml')}">`);
// Keep the downloadable file self-contained; the public Pages entry uses the
// modular build so only the selected HD planet is fetched.
html=html.replace('<head>','<head>\n<script>if(location.protocol==="https:"&&location.hostname==="lirenji2025.github.io")location.replace(new URL("dist/index.html?v=ring-arcball-2",location.href).href);</script>');
for(const name of ['style.css','v2.css'])html=html.replace(new RegExp('<link rel="stylesheet" href="\\./'+name+'(?:\\?[^\"]*)?">'),`<style>\n${read(name).replaceAll('./assets/earth.jpg',earth)}\n</style>`);
html=html.replace(/<script type="module" src="\.\/orbit\.js(?:\?[^\"]*)?"><\/script>/,()=>`<!-- Three.js: MIT; see dist/assets/THREE-LICENSE.txt and CREDITS.md. -->\n<script>\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
html=html.replace('href="./" aria-label="ORBIT 首页"','href="./index.html" aria-label="ORBIT 首页"');
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(`Standalone index.html generated (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB); scripts, styles, imagery and coastlines embedded.`);
