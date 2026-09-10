'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const defaultFile = path.join(__dirname, '..', 'index.html');
function unpack(file = defaultFile) {
  return unpackText(fs.readFileSync(file, 'utf8'));
}
function unpackText(html) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(html.match(/<script id="lz-core">([\s\S]*?)<\/script>/)[1], ctx);
  const blocks = new Map();
  for (const m of html.matchAll(/<script type="text\/plain" id="([^"]+)">([\s\S]*?)<\/script>/g)) {
    blocks.set(m[1], ctx.LZString.decompressFromBase64(m[2].trim()));
  }
  return {html, blocks, lz:ctx.LZString};
}
function scripts(source) {
  return [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(m=>({attrs:m[1],source:m[2]}));
}
function visaLocal(app) {
  const source = scripts(app)[1].source, start = source.indexOf('{');
  let depth = 0, quoted = false, escaped = false;
  for (let at = start; at < source.length; at++) {
    const c = source[at];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(source.slice(start, at + 1));
  }
  throw Error('VISA_LOCAL não localizado no bloco vigente');
}
module.exports = {unpack, unpackText, scripts, visaLocal};
if (require.main === module) {
  const {blocks} = unpack();
  const id = process.argv[2];
  if (!id) console.log([...blocks].map(([key,source])=>({id:key,length:source?.length})));
  else if (process.argv[3] === 'scripts') console.log(scripts(blocks.get(id)).map((s,i)=>({i,attrs:s.attrs,length:s.source.length,start:s.source.slice(0,100)})));
  else if (process.argv[3]) {
    const source = blocks.get(id); const term = process.argv[3]; const count = Number(process.argv[4] || 2500);
    let at = -1; while ((at = source.indexOf(term, at+1)) >= 0) console.log(source.slice(Math.max(0,at-150),at+count));
  } else process.stdout.write(blocks.get(id) || '');
}
