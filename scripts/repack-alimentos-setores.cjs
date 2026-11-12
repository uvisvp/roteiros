'use strict';
/* Inspeção de alimentos por setor (11/11/2026). Idempotente.
   1. configuração do roteiro (<script id="roteiro-sa-config">): setores no lugar dos tipos
      (alimentos/setores.cjs), sem a “forma de operação”, identificação com o licenciamento sanitário
      (Portaria SMS nº 266/2025), condições por setor nas verificações gerais, a3–a6 fora das
      perguntas (vão só para o checklist de documentos), e um módulo de verificações por setor;
   2. tela padrão (alimentos-padrao.inc.js) entre /*SA-PU-INICIO*\/ e /*SA-PU-FIM*\/;
   3. relatório: “Setores:” no cabeçalho e o setor antes da irregularidade dos módulos.
   A configuração é regravada no mesmo formato (json.dumps do Python), de que dependem os
   scripts que procuram trechos dela (repack-alimentos-cnpj.cjs).
   Uso: node scripts/repack-alimentos-setores.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const S = require('../alimentos/setores.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--servicos-alimentacao-roteiro';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');

const troca = (de, para, rot) => { if (app.includes(para)) return; const n = app.split(de).length - 1; if (n !== 1) throw Error('Trecho ' + rot + ' encontrado ' + n + ' vezes'); app = app.replace(de, () => para); };
const py = v => Array.isArray(v) ? '[' + v.map(py).join(', ') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).map(k => JSON.stringify(k) + ': ' + py(v[k])).join(', ') + '}' : JSON.stringify(v);

/* 1 — configuração */
const A = '<script type="application/json" id="roteiro-sa-config">';
const i0 = app.indexOf(A); if (i0 < 0 || app.indexOf(A, i0 + 1) >= 0) throw Error('configuração do roteiro (1 ocorrência esperada)');
const i1 = app.indexOf('</script>', i0);
const cfg = JSON.parse(app.slice(i0 + A.length, i1));
const p = cfg.profile;
p.typeLabel = 'Setores do estabelecimento';
p.typePrompt = 'Marque os setores existentes no local';
p.typeHelp = 'Um hipermercado marca açougue, padaria, frios…; uma lanchonete, cozinha e salão.';
p.types = S.SETORES.map(s => ({id: s.id, label: s.label, description: s.description, grupo: s.grupo, flags: s.flags, cnae: s.cnae}));
p.groups = S.GRUPOS;
p.presets = S.PRESETS;
p.regimes = S.REGIMES;
p.selectors = [];
p.fields = S.CAMPOS;
const vistos = new Set();
cfg.sections = cfg.sections.filter(s => !s.setor);
for (const s of cfg.sections) {
  if (S.WHEN.section[s.id]) s.when = S.WHEN.section[s.id];
  s.items = s.items.filter(it => !S.REMOVER.includes(it.id));
  for (const it of s.items) {
    vistos.add(it.id);
    if (S.WHEN.item[it.id]) it.when = S.WHEN.item[it.id];
    if (S.TEXTO[it.id]) Object.assign(it, S.TEXTO[it.id]);
  }
  for (const novo of S.NOVOS[s.id] || []) if (!s.items.some(x => x.id === novo.id)) {
    /* depois do último item de mesmo prefixo (a8 depois de a7; e8 antes de e7 não importa: fica no fim) */
    s.items.push(novo); vistos.add(novo.id);
  }
}
for (const [k] of Object.entries(S.WHEN.item)) if (!vistos.has(k)) throw Error('condição para item inexistente: ' + k);
/* módulos antes do transporte: mesma ordem da navegação (e do relatório) */
const antes = Math.max(0, cfg.sections.findIndex(s => s.id === 'transport'));
const mods = [];
for (const mod of S.MODULOS) {
  const rot = mod.title;
  mods.push({id: mod.id, title: rot, setor: mod.setor, when: {types: [mod.setor]},
    items: mod.items.map(it => { if (vistos.has(it.id)) throw Error('id repetido: ' + it.id); vistos.add(it.id); return Object.assign({}, it, {prefixo: rot}); })});
}
cfg.sections.splice(antes, 0, ...mods);
/* ids dos setores: nenhuma condição pode apontar setor inexistente */
const ids = new Set(S.SETORES.map(s => s.id));
(function confere(w) { if (!w) return; (w.types || []).forEach(t => { if (!ids.has(t)) throw Error('setor inexistente na condição: ' + t); }); (w.any || []).concat(w.all || []).forEach(confere); })({any: cfg.sections.flatMap(s => [s.when].concat(s.items.map(i => i.when))).filter(Boolean)});
for (const pr of S.PRESETS) pr.setores.forEach(t => { if (!ids.has(t)) throw Error('atalho com setor inexistente: ' + t); });
app = app.slice(0, i0 + A.length) + py(cfg) + app.slice(i1);

/* 2 — tela padrão */
const frag = fs.readFileSync(path.join(root, 'alimentos-padrao.inc.js'), 'utf8');
const INI = '/*SA-PU-INICIO*/', FIM = '/*SA-PU-FIM*/';
const k0 = app.indexOf(INI), k1 = app.indexOf(FIM);
if (k0 < 0 || k1 < k0) throw Error('marcadores da tela padrão não localizados');
app = app.slice(0, k0) + INI + '\n' + frag + '\n' + app.slice(k1);

/* 3 — relatório */
troca("(tiposSel.length > 1 ? 'Atividades: ' : 'Tipo de serviço: ')", "(tiposSel.length > 1 ? 'Setores: ' : 'Setor: ')", 'cabeçalho dos setores');
troca("if (irr.length) irr.forEach(function (i, k) { L.push((k + 1) + '. ' + frase(i) +",
  "if (irr.length) irr.forEach(function (i, k) { L.push((k + 1) + '. ' + (i.prefixo ? i.prefixo + ': ' : '') + frase(i) +", 'setor na irregularidade');

const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Alimentos: ' + S.SETORES.length + ' setores, ' + S.MODULOS.length + ' módulos (' + S.MODULOS.reduce((n, x) => n + x.items.length, 0) + ' verificações), perfil filtra o roteiro.');
