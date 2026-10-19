'use strict';
/* Executa a suíte de ponta a ponta. Uso: node scripts/e2e/todos.cjs */
const {execFileSync}=require('node:child_process'),path=require('node:path');
const D=__dirname,ROOT=path.join(D,'..','..');
const PASSOS=[
 ['funções comuns (salvas, apagar, retorno)',['funcoes.cjs']],
 ['drogaria: respostas no relatório',['drogaria-relatorio.cjs']],
 ['manipulação: respostas no relatório',['varredura.cjs','Medicamentos','farmacia-manipulacao','Farmácia com manipulação','',"document.querySelector('#cardGrid button, .ui-card-grid button')?.click();;document.querySelector('.man-item-card,[data-man-item]')?.click()"]],
 ['produtos: navegação padrão e relatório',['padrao.cjs','Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista']],
 ['alimentos: navegação padrão e relatório',['padrao.cjs','Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento']],
 ['odontologia: navegação padrão e relatório',['padrao.cjs','Odontologia','odontologia','Odontologia']],
 ['serviços assistenciais (ILPI): navegação padrão e relatório',['padrao.cjs','Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi']],
 ['academias e piscinas: navegação padrão e relatório',['padrao.cjs','Serviços','academia-piscina','Academias e piscinas']],
 ['academias e piscinas: perfil, infrações, foto, citação e Word',['academia.cjs']],
 ['estética (serviço de saúde): navegação padrão e relatório',['padrao.cjs','Serviços','estetica','Estética e beleza','p_tipo=saude']],
 ['estética (interesse à saúde): navegação padrão e relatório',['padrao.cjs','Serviços','estetica','Estética e beleza','p_tipo=interesse']],
 ['estética: roteiro do ROI, perfil, infrações com constatação e Word',['estetica.cjs']],
 ['vacinação (card único): navegação padrão e relatório',['padrao.cjs','Serviços','vacinacao','Vacinação']],
 ['EAC Serviço Tipo I: navegação padrão e relatório',['padrao.cjs','Serviços','eac-tipo1','EAC — Serviço Tipo I']],
 ['EAC Serviço Tipo II: navegação padrão e relatório',['padrao.cjs','Serviços','eac-tipo2','EAC — Serviço Tipo II']],
 ['EAC Serviço Tipo III: navegação padrão e relatório',['padrao.cjs','Serviços','eac-tipo3','EAC — Serviço Tipo III']],
 ['transporte de material biológico: navegação padrão e relatório',['padrao.cjs','Serviços','transporte-biologico','Transporte de material biológico']],
 ['radiologia convencional: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-convencional','Radiologia convencional']],
 ['mamografia: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-mamografia','Mamografia']],
 ['tomografia: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-tomografia','Tomografia computadorizada']],
 ['ressonância magnética: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-ressonancia','Ressonância magnética']],
 ['ultrassonografia: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-ultrassom','Ultrassonografia']],
 ['hemodinâmica: navegação padrão e relatório',['padrao.cjs','Serviços','imagem-hemodinamica','Hemodinâmica e radiologia intervencionista']],
 ['transporte e imagem: inventário de veículos, perfil, equipamentos e Lei 13.725',['transporte-imagem.cjs']],
 ['gases medicinais: navegação padrão e relatório',['padrao.cjs','Medicamentos','gases-medicinais','Atacadista de gases medicinais']],
 ['grupos: Serviços (vacinação, EAC) e Medicamentos igual ao site Medicamentos',['grupos.cjs']],
 ['checklist por ponto, anotação, inventário por ambiente e perfil (EAC)',['checklist.cjs']],
 ['checklist por ponto: odontologia, alimentos, produtos e assistenciais',['pontos.cjs']],
 ['Lei 13.725 em toda irregularidade e sem lista de normas (odontologia, alimentos, produtos, assistenciais)',['lei13725.cjs']],
 ['infração descrita pela constatação (produtos e assistenciais)',['constatacao.cjs']],
 ['prévia do relatório na aba Relatório e cores da Central de Consultas',['relatorio-aba.cjs']],
 ['“Para saber mais” com fonte e Lei 13.725 só onde não há norma específica, no roteiro',['saber-mais-roteiros.cjs']],
 ['saber mais e orientações não escondem perguntas (odontologia)',['saber-mais.cjs','Odontologia','odontologia','Odontologia']],
 ['teclado não cobre o campo no celular',['teclado.cjs']],
 ['saber mais e orientações não escondem perguntas (distribuidora)',['saber-mais.cjs','Medicamentos','distribuidoras-transportadoras','Atacadista de medicamentos']],
 ['distribuidora: respostas no relatório',['varredura.cjs','Medicamentos','distribuidoras-transportadoras','Atacadista de medicamentos'],{PERMITIDOS:'^Conformidade do conteúdo||^Descrição das não conformidades||^Categorização das não conformidades||^Classificação final adotada'}]
];
let falhas=0;for(const [nome,args,env] of PASSOS){process.stdout.write('\n▶ '+nome+'\n');try{const out=execFileSync('node',[path.join(D,args[0]),...args.slice(1)],{cwd:ROOT,env:{...process.env,...(env||{})},encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:1800000});process.stdout.write(out.split('\n').filter(l=>/FALHA|SEM EFEITO|SOME|\| perguntas|\| telas|controles|^ok/.test(l)).slice(-40).join('\n')+'\n')}catch(e){falhas++;process.stdout.write(String(e.stdout||'')+String(e.stderr||'').slice(-2000)+'\n✗ falhou\n')}}
console.log('\n'+(falhas?falhas+' passo(s) com falha':'SUÍTE OK'));process.exitCode=falhas?1:0;
