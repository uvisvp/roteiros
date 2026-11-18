'use strict';
/* Leitor do texto atualizado ("norma atualizada") da Legislação Informatizada da Câmara dos Deputados
   (www2.camara.leg.br/legin/.../...-normaatualizada-pl.html). Esse texto traz só a redação vigente de
   cada dispositivo, com a nota da alteração ao lado — ao contrário do texto compilado do Planalto, que
   traz a redação antiga riscada antes da nova.

   Devolve os dispositivos no formato do banco de legislação: [id, texto, meta?].
     Art. 8º      -> a8        Art. 8º-A -> a8b      Art. 18-B -> a18bb
     § 2º         -> a8p2      § 1º-A    -> a8p1b    Parágrafo único -> a8pu
     inciso IV    -> a8-iv     inciso I-A -> a8-ib
     alínea "c"   -> a8-iv-c   (dentro do inciso; sem inciso, a8-c)
   O sufixo b marca SÓ a letra do dispositivo (A = b, B = bb...). Quando o rótulo não sai do id pelas
   regras do motor (letra, alínea dentro de inciso), meta.r traz o rótulo certo.
   Dispositivo revogado: meta.s = 'revogado'. */
const ROM = /^(M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3}))$/;

function linhas(html) {
  const out = [];
  const re = /<(p|h\d)\b[^>]*>([\s\S]*?)<\/\1>/gi; let m;
  while ((m = re.exec(html))) {
    const t = m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (x, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (x, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/[\s\u00a0]+/g, ' ')
      /* espaços deixados pela retirada das marcas (“<i>Caput</i>”, "2013</a> ,") */
      .replace(/“\s+/g, '“').replace(/\s+”/g, '”').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+,/g, ',').replace(/"\s*Caput\s*"/g, '"Caput"')
      .trim();
    if (t) out.push(t);
  }
  return out;
}
const letra = L => L ? 'b'.repeat(L.charCodeAt(0) - 64) : '';

function le(html) {
  const L = linhas(html);
  const nos = [];               // {id, x, r?}
  let art = null, par = null, inc = null, ultimo = null, fim = false, aspas = false;
  const novo = (id, x, r) => {
    let dup = 0;
    /* numeração repetida no próprio texto oficial (ex.: ECA, art. 260-E, dois incisos II) */
    while (nos.some(n => n.id === id + (dup ? '_' + (dup + 1) : ''))) dup++;
    if (dup) { id += '_' + (dup + 1); r = (r || rotAtual) + ' (' + (dup + 1) + 'º com essa numeração no texto oficial)'; }
    ultimo = {id, x, r, dup: !!dup}; nos.push(ultimo); return ultimo;
  };
  let rotAtual = '';
  for (const t of L) {
    if (fim) break;
    let m;
    /* texto de outra norma citado entre aspas (artigo que altera outra lei): faz parte do dispositivo
       que o cita, até fechar as aspas */
    if (aspas || (art && /^["“]/.test(t))) {
      if (ultimo) ultimo.x = (ultimo.x + ' ' + t).trim();
      aspas = !/["”]\s*(?:\((?:NR|AC)\))?\s*[.;]?\s*(?:\([^()]*\))?\s*$/.test(t) || (/^["“]/.test(t) && t.length < 3);
      continue;
    }
    if ((m = /^Art\.\s*(\d+)\s*(?:º|°|o\b)?\s*(?:-\s*([A-Z])\b)?\s*\.?\s*([\s\S]*)$/.exec(t))) {
      const n = +m[1], id = 'a' + n + letra(m[2]);
      art = {id, n, L: m[2] || ''}; par = null; inc = null; rotAtual = rotArt(art);
      novo(id, m[3].trim(), m[2] ? 'Art. ' + n + '-' + m[2] : null);
      continue;
    }
    if (!art) continue;
    if ((m = /^§\s*\.?\s*(\d+)\s*(?:º|°|o\b)?\s*(?:-\s*([A-Z])\b)?\s*\.?\s*([\s\S]*)$/.exec(t))) {
      const n = +m[1], id = art.id + 'p' + n + letra(m[2]);
      par = {id, rot: '§ ' + n + (n < 10 ? 'º' : '') + (m[2] ? '-' + m[2] : '')}; inc = null; rotAtual = rotPai(art, par);
      novo(id, m[3].trim(), (art.L || m[2]) ? rotArt(art) + ', ' + par.rot : null);
      continue;
    }
    if ((m = /^Parágrafo\s+único\s*[.:-]?\s*([\s\S]*)$/i.exec(t))) {
      const id = art.id + 'pu';
      par = {id, rot: 'parágrafo único'}; inc = null; rotAtual = rotPai(art, par);
      novo(id, m[1].trim(), art.L ? rotArt(art) + ', parágrafo único' : null);
      continue;
    }
    if ((m = /^([IVXLCDM]+)\s*(?:-\s*([A-Z])\b)?\s*[-–—]\s*([\s\S]*)$/.exec(t)) && ROM.test(m[1])) {
      const pai = par || art, id = pai.id + '-' + m[1].toLowerCase() + letra(m[2]);
      inc = {id, rot: m[1] + (m[2] ? '-' + m[2] : '')}; rotAtual = rotPai(art, par) + ', ' + inc.rot;
      novo(id, m[3].trim(), (art.L || m[2] || (par && /b$/.test(par.id))) ? rotPai(art, par) + ', ' + inc.rot : null);
      continue;
    }
    if ((m = /^([a-z])\s*(?:-\s*([A-Z])\b)?\s*\)\s*([\s\S]*)$/.exec(t))) {
      const pai = inc || par || art, id = pai.id + '-' + m[1] + letra(m[2]);
      const rot = '“' + m[1] + (m[2] ? '-' + m[2] : '') + '”';
      rotAtual = rotPai(art, par) + (inc ? ', ' + inc.rot : '') + ', alínea ' + rot;
      novo(id, m[3].trim(), (inc || art.L || m[2] || (par && /b$/.test(par.id))) ? rotPai(art, par) + (inc ? ', ' + inc.rot : '') + ', alínea ' + rot : null);
      continue;
    }
    /* títulos, capítulos e seções: fecham o dispositivo, não entram no texto */
    if (/^(TÍTULO|CAPÍTULO|Seção|SEÇÃO|Subseção|SUBSEÇÃO|LIVRO|Livro|PARTE)\b/.test(t) || (/^[^a-z]+$/.test(t) && !/^\(/.test(t) && t.length > 3)) {
      ultimo = null; continue;
    }
    if (/^Brasília,|^Rio de Janeiro,|^Este texto não substitui/.test(t)) { fim = true; continue; }
    /* continuação (nota de alteração, "Pena - ...", parágrafo de texto) */
    if (ultimo) ultimo.x = (ultimo.x + ' ' + t).trim();
  }
  return nos.map(n => {
    const x = n.x.replace(/\s+/g, ' ').trim(), meta = {};
    if (n.r) meta.r = n.r;
    if (n.dup) meta.obs = 'Numeração repetida no texto oficial.';
    if (/^\(?\s*(Revogad[oa]|Revogado)\b/i.test(x)) meta.s = 'revogado';
    return Object.keys(meta).length ? [n.id, x, meta] : [n.id, x];
  });
  function rotArt(a) { return 'Art. ' + a.n + (a.L ? '-' + a.L : ''); }
  function rotPai(a, p) { return rotArt(a) + (p ? ', ' + p.rot : ''); }
}

module.exports = {le, linhas};
