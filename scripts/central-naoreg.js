/* Produtos não regularizados como dispositivos médicos (lista da Anvisa, base-vigilancia/dados/
   produtos_nao_regulados/lista.json). Busca por nome ou trecho: todas as palavras digitadas
   precisam aparecer no item (sem acento e sem diferença de maiúsculas). A exceção do item
   (“exceto…”) fica no texto e ganha um aviso: se o produto se enquadra nela, é dispositivo médico. */
const semAcento=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
async function naoRegulados(raw){
  const d=await json('produtos_nao_regulados/lista.json');
  if(!d||!Array.isArray(d.categorias))throw Error('Lista de produtos não regularizados indisponível agora.');
  const pal=semAcento(raw).split(/[^a-z0-9]+/).filter(p=>p.length>=2);
  if(semAcento(raw).replace(/[^a-z0-9]/g,'').length<3||!pal.length)throw Error('Digite o nome do produto (ao menos 3 letras).');
  const tem=t=>{const n=semAcento(t);return pal.every(p=>n.includes(p))};
  const frase=t=>t.charAt(0)+t.slice(1).toLowerCase();
  const out=[];
  d.categorias.forEach(c=>{
    const cat='Categoria '+c.numero+' — '+frase(c.titulo);
    if(!c.itens.length&&tem(c.titulo))out.push({_base:'produtos_nao_regulados',produto:frase(c.titulo),categoria:cat,observacao:'A categoria inteira consta da lista, sem itens individuais.',atualizacao_fonte:d.atualizado_na_fonte});
    c.itens.forEach(i=>{
      const sub=(i.sub||[]).join(' · ');
      if(!tem(i.texto+' '+sub))return;
      out.push({_base:'produtos_nao_regulados',produto:i.texto,categoria:cat+', item '+i.n,subitens:sub,
        observacao:/\bexceto\b/i.test(i.texto+' '+sub)?'Leia a exceção: se o produto se enquadra nela (ex.: uso em diagnóstico clínico, IVD), é dispositivo médico e exige notificação ou registro.':'',
        atualizacao_fonte:d.atualizado_na_fonte});
    });
  });
  return out;
}
