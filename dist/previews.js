export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const defaults = [
  {id:'github',title:'GitHub',subtitle:'Build something wonderful.',url:'https://github.com/',domain:'github.com',symbol:'⌘',color:'#d6dfeb',description:'每一个想法，都值得一次 commit。继续你的项目，探索下一个值得创造的东西。'},
  {id:'figma',title:'Figma',subtitle:'Ideas take shape here.',url:'https://www.figma.com/',domain:'figma.com',symbol:'F',color:'#bca4f4',description:'让想法有形状，让灵感有去处。你的下一次设计，正等待一个新的开始。'},
  {id:'nasa',title:'NASA',subtitle:'There is more out there.',url:'https://www.nasa.gov/',domain:'nasa.gov',symbol:'N',color:'#96baf1',description:'抬起头，世界比想象更辽阔。探索正在发生的太空任务，以及那些遥远却真实的世界。'},
  {id:'notion',title:'Notion',subtitle:'A little room for your mind.',url:'https://www.notion.so/',domain:'notion.so',symbol:'N',color:'#ecebe4',description:'把暂时放不下的想法，轻轻放在这里。一页笔记，一个计划，一点慢慢生长的秩序。'},
  {id:'youtube',title:'YouTube',subtitle:'One more perspective.',url:'https://www.youtube.com/',domain:'youtube.com',symbol:'▶',color:'#ef8f8f',description:'听听另一种声音，看看另一种生活。那些尚未看完的故事，依然在这里等你。'},
  {id:'spotify',title:'Spotify',subtitle:'Give your orbit a soundtrack.',url:'https://open.spotify.com/',domain:'open.spotify.com',symbol:'≋',color:'#9ad8a5',description:'为今天的轨道选一段配乐。让节奏慢下来，让注意力重新回到自己身上。'},
  {id:'arena',title:'Are.na',subtitle:'Follow a thread of curiosity.',url:'https://www.are.na/',domain:'are.na',symbol:'✳',color:'#d7c6a3',description:'连接图像、文字与偶然的发现。循着好奇心，一直走到意料之外的地方。'},
  {id:'mdn',title:'MDN Web Docs',subtitle:'Understand the web.',url:'https://developer.mozilla.org/',domain:'developer.mozilla.org',symbol:'M',color:'#a4ccef',description:'理解一行代码，也就多理解一点这个世界。查阅文档，继续你刚才的探索。'},
  {id:'canvas',title:'Assignment 3',subtitle:'Make something that responds.',url:'https://canvas.polyu.edu.hk/',domain:'canvas.polyu.edu.hk',symbol:'C',color:'#dca5aa',description:'一次输入，一次回应，一次清晰的反馈。把小小的想法，变成别人可以亲手体验的作品。'},
  {id:'wiki',title:'Wikipedia',subtitle:'Stay wonderfully curious.',url:'https://en.wikipedia.org/wiki/Earth',domain:'wikipedia.org',symbol:'W',color:'#e1ded7',description:'我们生活的这颗蓝色星球，依然藏着数不清的故事。从一个问题，抵达另一个发现。'},
  {id:'pinterest',title:'Pinterest',subtitle:'Collect what moves you.',url:'https://www.pinterest.com/',domain:'pinterest.com',symbol:'P',color:'#e1a69d',description:'色彩、光线、材料与形状。把让你停留片刻的灵感，收进自己的小小宇宙。'},
  {id:'linear',title:'Linear',subtitle:'A small step, then another.',url:'https://linear.app/',domain:'linear.app',symbol:'◒',color:'#b5b0ec',description:'把大想法拆成可以完成的小事。下一步不必很大，只需要清楚。'},
];

export function previewHTML(card, engine = 'Bing') {
  const kind = card.kind || card.id;
  const nav = (brand, right='') => `<div class="mini-nav"><b>${brand}</b><span>${right}</span></div>`;
  const lines = '<div class="mini-lines"><i></i><i></i><i></i></div>';
  switch (kind) {
    case 'github': return `<div class="card-preview preview-github">${nav('⌘ GitHub','Product　Solutions　Open Source')}<div class="github-inner"><div class="github-repo">your-universe / a-new-beginning <span class="mini-pill">Public</span></div><div class="github-chart">${'<i></i>'.repeat(100)}</div><div class="github-footer">Make a little progress. Every day.</div></div></div>`;
    case 'figma': return '<div class="card-preview preview-figma"><div class="figma-board"><div class="figma-sidebar"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="figma-art"><div class="shape1"></div><div class="shape2">✳</div><div class="shape3"></div><div class="figma-cursor">↖ You</div></div></div></div>';
    case 'nasa': return `<div class="card-preview preview-nasa">${nav('NASA','EXPLORE THE UNIVERSE')}<div class="nasa-title">Beyond<br>the known.<span>DARE TO EXPLORE</span></div><div class="nasa-planet"></div></div>`;
    case 'notion': return '<div class="card-preview preview-notion"><div class="notion-page"><span>✺</span><b>A space to begin.</b><div class="notion-task"><i></i> Make something meaningful</div><div class="notion-task"><i></i> Collect a little inspiration</div><div class="notion-task"><i></i> Leave room for the unexpected</div></div></div>';
    case 'youtube': return `<div class="card-preview preview-youtube">${nav('▶ YouTube','Explore　Watch later')}<div class="youtube-layout"><div class="youtube-feature"><div class="youtube-mountain"></div><i class="play-icon"></i></div><div class="youtube-side"><i></i><i></i></div></div><div class="youtube-caption">A quieter place, a different perspective.</div></div>`;
    case 'spotify': return '<div class="card-preview preview-spotify"><div class="spotify-top"><div class="album-art">slow</div><div class="album-info">PLAYLIST<strong>Quiet orbit</strong>For the world inside your head.</div></div><div class="spotify-track"><span>▶　01　Weightless</span><span>5:12</span></div></div>';
    case 'arena': return `<div class="card-preview preview-arena">${nav('Are.na','a collection of small discoveries')}<div class="arena-grid"><i></i><i></i><i></i><i></i></div></div>`;
    case 'mdn': return `<div class="card-preview preview-mdn">${nav('mdn_','References　Guides')}<div class="mdn-page"><b>Build a better web.</b><p>Everything you need to create something new.</p><div class="mdn-code">const world = new Universe();<br>world.begin({ curiosity: true });</div></div></div>`;
    case 'canvas': return '<div class="card-preview preview-canvas"><div class="canvas-layout"><div class="canvas-sidebar"><span>◉</span><span>▦</span><span>▤</span><span>◷</span></div><div class="canvas-main"><small>SD5913 / ASSIGNMENTS</small><b>Assignment 3</b><div class="canvas-assignment">An interactive experience<br>Input → Response → Feedback<br>Make it small. Make it work.</div></div></div></div>';
    case 'wiki': return '<div class="card-preview preview-wiki"><div class="wiki-page"><b>Earth</b><p>From Wikipedia, the free encyclopedia</p><p>Earth is the third planet from the Sun and the only astronomical object known to harbor life.</p><div class="mini-lines"><i></i><i></i><i></i></div></div></div>';
    case 'pinterest': return '<div class="card-preview preview-pinterest"><div class="pin-grid"><div class="pin-col"><i></i><i></i></div><div class="pin-col"><i></i><i></i></div><div class="pin-col"><i></i><i></i></div></div></div>';
    case 'linear': return '<div class="card-preview preview-linear"><div class="linear-page"><b>Build with intention.</b><div class="linear-columns"><div><i></i><i></i><i></i></div><div><i></i><i></i></div><div><i></i><i></i><i></i></div></div></div></div>';
    default: return `<div class="card-preview preview-search"><div class="search-preview-content"><small>${escapeHTML(card.kind === 'web' ? card.domain : `${engine.toUpperCase()} · A NEW DISCOVERY`)}</small><b>${escapeHTML(card.title)}</b></div></div>`;
  }
}
