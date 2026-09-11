from pathlib import Path
import json

path=Path('index.html')
source=path.read_text(encoding='utf-8')
start=source.index('    /* Complemento de segurança da Central:')
end=source.index('    /* Ajustes textuais específicos da Drogaria.', start)
bridge=r'''    /* Complemento de segurança da Central: cosméticos, saneantes e medicamentos
       podem ser consultados diretamente pelo processo quando o índice normal não
       trouxer cadastro. Saneantes e medicamentos usam visões completas por processo,
       que incluem também produtos sem número de registro. */
    if(app==='central-consultas'){
      var ponte=['<scr','ipt>',String.raw`(function(){
        var RAIZ='https://uvisvp.github.io/base-vigilancia/dados/';
        var FONTES=[
          {p:'cosmeticos',l:'Cosméticos',f:'Cosmético'},
          {p:'saneantes_processos',l:'Saneantes',f:'Saneante'},
          {p:'medicamentos_processos',l:'Medicamentos',f:'Medicamento'}
        ];
        function dig(v){return String(v||'').replace(/\D/g,'');}
        function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
        function processoAtivo(){var b=document.querySelector('.mode.on');return !!(b&&b.getAttribute('data-mode')==='processo');}
        function situacao(v){v=String(v||'').trim();return v==='S'?'ATIVO':v==='N'?'INATIVO':v;}
        function regularizacao(x){
          if(String(x&&x.registrado)==='0')return 'Notificado / sem número de registro';
          if(x&&x.registro)return x.registro;
          return (x&&(x.tipo||x.categoria))||'Não informada';
        }
        function artigo(x,fonte){return '<article class="result" data-uvis-processo-complementar="'+esc(fonte.p)+'"><h4>'+esc(x.produto||fonte.f)+'</h4><div class="kv"><b>Processo</b><span>'+esc(x.processo)+'</span><b>Registro / regularização</b><span>'+esc(regularizacao(x))+'</span><b>CNPJ</b><span>'+esc(x.cnpj)+'</span><b>Detentor</b><span>'+esc(x.detentor)+'</span><b>Situação</b><span>'+esc(situacao(x.situacao))+'</span><b>Categoria / tipo</b><span>'+esc(x.categoria||x.tipo||x.tipo_peticao)+'</span></div></article>';}
        function inserir(pacotes,processo){setTimeout(function(){
          var atual=dig(document.getElementById('q')&&document.getElementById('q').value);
          var host=document.getElementById('results');
          if(atual!==processo||!host||host.querySelector('.result,[data-uvis-processo-complementar]'))return;
          var grupos=[];
          pacotes.forEach(function(p){var itens=(Array.isArray(p.d)?p.d:[]).filter(function(x){return dig(x&&x.processo)===processo;});if(itens.length)grupos.push({f:p.f,itens:itens});});
          if(!grupos.length)return;
          var total=grupos.reduce(function(n,g){return n+g.itens.length;},0);
          var html='<div class="summary"><div class="sum"><b>'+total+'</b><span>cadastros e autorizações</span></div><div class="sum"><b>0</b><span>alertas relacionados</span></div><div class="sum"><b>0</b><span>medidas fiscais relacionadas</span></div></div><div class="group"><div class="grouphead"><h3>Cadastro regulatório e autorizações</h3><span>'+total+' resultado(s)</span></div>'+grupos.map(function(g){return '<details class="sub-base" open><summary>'+esc(g.f.l)+' <span class="tag">'+g.itens.length+'</span></summary><div class="sub-body">'+g.itens.map(function(x){return artigo(x,g.f);}).join('')+'</div></details>';}).join('')+'</div>';
          host.className='';host.innerHTML=html;
          var st=document.getElementById('status');if(st){st.className='status ok';st.textContent='Consulta concluída. Cadastro regulatório localizado pelo processo Anvisa.';}
        },900);}
        function complementar(){
          if(!processoAtivo())return;
          var processo=dig(document.getElementById('q')&&document.getElementById('q').value);
          if(processo.length<13)return;
          var fragmento=processo.slice(5,8);if(!fragmento)return;
          Promise.all(FONTES.map(function(f){return fetch(RAIZ+f.p+'/'+fragmento+'.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}).then(function(d){return {f:f,d:d};});})).then(function(p){inserir(p,processo);});
        }
        document.addEventListener('click',function(e){if(e.target.closest('#search'))complementar();},true);
        document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.id==='q')complementar();},true);
      })();`,'</scr','ipt>'].join('');
      s=s.replace(/<\/body>/i,ponte+'</body>');
    }
'''
source=source[:start]+bridge+source[end:]
old='20260910-27'; new='20260911-28'
assert old in source, 'versao antiga nao encontrada no index'
source=source.replace(old,new)
path.write_text(source,encoding='utf-8')

sw=Path('sw.js')
txt=sw.read_text(encoding='utf-8')
assert "const VERSAO = '20260910-27';" in txt
sw.write_text(txt.replace("const VERSAO = '20260910-27';","const VERSAO = '20260911-28';"),encoding='utf-8')

vp=Path('versao.json')
data=json.loads(vp.read_text(encoding='utf-8'))
data.update({'versao':'20260911-28','banco':'12.0','correcoes':3,'notas':'Central de Consultas: consulta por processo ampliada para saneantes e medicamentos, incluindo produtos sem número de registro; cosméticos preservados.'})
vp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
