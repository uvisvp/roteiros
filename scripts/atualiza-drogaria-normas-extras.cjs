'use strict';
/* drogaria-normas-extras.js traz uma cópia da RDC 978/2025 do banco v12 (base-vigilancia). Quando a
   norma muda no banco (ex.: RDC 1.043/2026), este script troca a cópia e a assinatura das referências.
   A RDC 197/2017 e o resto do arquivo não mudam. Idempotente.
   Uso: node scripts/atualiza-drogaria-normas-extras.cjs */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), file = path.join(root, 'drogaria-normas-extras.js');
const BASE = path.resolve(process.env.BASE_VIGILANCIA || path.join(root, '..', 'base-vigilancia'));
const ARQ = 'legislacao_v12/normas/rdc-978-2025.json';
const novo = JSON.parse(fs.readFileSync(path.join(BASE, 'dados', ARQ), 'utf8'));
const src = fs.readFileSync(file, 'utf8'), MARCA = 'window.__drogNormasExtras=';
const k = src.indexOf(MARCA); if (k < 0) throw Error('marcador não encontrado');
const fim = src.lastIndexOf(';');
const X = JSON.parse(src.slice(k + MARCA.length, fim));
if (JSON.stringify(X) + ';' !== src.slice(k + MARCA.length, fim + 1).trim()) throw Error('formato inesperado do arquivo');
const antigo = X.docs[ARQ]; if (!antigo) throw Error(ARQ + ' ausente');
/* as referências citadas continuam existindo, com o mesmo texto ou com a redação nova conferida */
const ids = new Map(novo.nos.map(n => [n.id, n]));
for (const r of Object.values(X.refs)) if (r.arquivo === ARQ) { if (!ids.has(r.id)) throw Error('referência sem dispositivo: ' + r.id); r.sha256_texto = novo.sha256_texto; }
X.docs[ARQ] = novo;
const out = src.slice(0, k) + MARCA + JSON.stringify(X) + src.slice(fim);
if (out !== src) fs.writeFileSync(file, out);
console.log('drogaria-normas-extras.js: RDC 978/2025 com ' + novo.nos.length + ' nós (' + (out === src ? 'sem mudança' : 'atualizada') + ').');
