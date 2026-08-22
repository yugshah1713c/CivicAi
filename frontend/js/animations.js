/* ============================================================
   CIVIC AI — animations.js
   Signature element: the "Pulse Grid" living city skyline
   ============================================================ */

function buildHeroCity(){
  const mount = document.getElementById('heroCity');
  if(!mount) return;

  // Building heights (skyline silhouette)
  const heights = [58,92,44,120,70,150,60,100,80,132,50,96,66,110,42];
  const buildingWidth = 42;
  const gap = 8;
  const baseY = 260;
  const totalWidth = heights.length * (buildingWidth + gap);

  let buildingsSvg = '';
  let windowsSvg = '';
  heights.forEach((h, i) => {
    const x = i * (buildingWidth + gap);
    const y = baseY - h;
    buildingsSvg += `<rect x="${x}" y="${y}" width="${buildingWidth}" height="${h}" rx="3"
      fill="url(#bldGrad)" stroke="rgba(79,224,232,0.18)" stroke-width="1"/>`;
    // windows
    const rows = Math.floor(h / 16);
    for(let r=0; r<rows; r++){
      for(let c=0; c<2; c++){
        if(Math.random() > 0.4){
          const wx = x + 6 + c*18;
          const wy = y + 8 + r*16;
          const lit = Math.random() > 0.5;
          windowsSvg += `<rect x="${wx}" y="${wy}" width="7" height="7" rx="1"
            fill="${lit ? '#4fe0e8' : 'rgba(234,241,251,0.08)'}" opacity="${lit ? (Math.random()*0.5+0.4) : 0.5}">
            ${lit ? `<animate attributeName="opacity" values="${(Math.random()*0.4+0.4).toFixed(2)};0.15;${(Math.random()*0.4+0.4).toFixed(2)}" dur="${(Math.random()*4+3).toFixed(1)}s" repeatCount="indefinite"/>` : ''}
          </rect>`;
        }
      }
    }
  });

  // Infrastructure nodes sitting atop random buildings, connected by pulse lines
  const nodeIdx = [1,3,5,7,9,11,13];
  const nodes = nodeIdx.map(i => {
    const x = i * (buildingWidth + gap) + buildingWidth/2;
    const y = baseY - heights[i] - 14;
    return { x, y };
  });

  let linesSvg = '';
  for(let i=0;i<nodes.length-1;i++){
    const a = nodes[i], b = nodes[i+1];
    const midY = Math.min(a.y,b.y) - 30 - Math.random()*20;
    linesSvg += `<path d="M${a.x},${a.y} Q${(a.x+b.x)/2},${midY} ${b.x},${b.y}"
      fill="none" stroke="url(#lineGrad)" stroke-width="1.4" stroke-dasharray="6 10" opacity="0.55">
      <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="${(6+i).toFixed(1)}s" repeatCount="indefinite"/>
    </path>`;
  }

  let nodesSvg = nodes.map((n,i) => `
    <circle cx="${n.x}" cy="${n.y}" r="4.5" fill="#4fe0e8">
      <animate attributeName="r" values="4;6.5;4" dur="${(2.5+i*0.3).toFixed(1)}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;1;0.6" dur="${(2.5+i*0.3).toFixed(1)}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${n.x}" cy="${n.y}" r="10" fill="none" stroke="#4fe0e8" stroke-width="1" opacity="0.3"/>
  `).join('');

  // Ground infra icons
  const icons = [
    { emoji:'💧', x: 60 },
    { emoji:'💡', x: 220 },
    { emoji:'🗑️', x: 380 },
    { emoji:'🛣️', x: 540 },
  ];
  let iconsSvg = icons.map((ic,i) => `
    <text x="${ic.x}" y="${baseY+34}" font-size="20" text-anchor="middle" opacity="0.9">
      ${ic.emoji}
      <animate attributeName="y" values="${baseY+34};${baseY+28};${baseY+34}" dur="${(3+i*0.4).toFixed(1)}s" repeatCount="indefinite"/>
    </text>
  `).join('');

  const svg = `
  <svg viewBox="0 0 ${totalWidth} 340" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; overflow:visible;">
    <defs>
      <linearGradient id="bldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#182849"/>
        <stop offset="100%" stop-color="#0d1730"/>
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#3b6eff"/>
        <stop offset="100%" stop-color="#4fe0e8"/>
      </linearGradient>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(79,224,232,0.05)"/>
        <stop offset="50%" stop-color="rgba(79,224,232,0.25)"/>
        <stop offset="100%" stop-color="rgba(79,224,232,0.05)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${baseY+2}" width="${totalWidth}" height="16" fill="#0a1330"/>
    <line x1="0" y1="${baseY+10}" x2="${totalWidth}" y2="${baseY+10}" stroke="url(#roadGrad)" stroke-width="2" stroke-dasharray="16 12">
      <animate attributeName="stroke-dashoffset" from="0" to="-56" dur="2.4s" repeatCount="indefinite"/>
    </line>
    ${buildingsSvg}
    ${windowsSvg}
    ${linesSvg}
    ${nodesSvg}
    ${iconsSvg}
  </svg>`;

  mount.innerHTML = svg;
}

document.addEventListener('DOMContentLoaded', buildHeroCity);
