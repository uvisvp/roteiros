'use strict';
/* Executa a suíte de ponta a ponta. Uso: node scripts/e2e/todos.cjs */
const {execFileSync}=require('node:child_process'),path=require('node:path');
const D=__dirname,ROOT=path.join(D,'..','..');
const PASSOS=[
 ['funções comuns (salvas, apagar, retorno)',['funcoes.cjs']],
 ['drogaria: respostas no relatório',['drogaria-relatorio.cjs']],
 ['manipulação: respostas no relatório',['varredura.cjs','Medicamentos','farmacia-manipulacao','Farmácia com Manipulação','',"document.querySelector('#cardGrid button, .ui-card-grid button')?.click();;document.querySelector('.man-item-card,[data-man-item]')?.click()"]],
 ['produtos: navegação padrão e relatório',['padrao.cjs','Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista']],
 ['alimentos: navegação padrão e relatório',['padrao.cjs','Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento']],
 ['odontologia: navegação padrão e relatório',['padrao.cjs','Odontologia','odontologia','Odontologia']],
 ['serviços assistenciais (ILPI): navegação padrão e relatório',['padrao.cjs','Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi']],
 ['distribuidora: respostas no relatório',['varredura.cjs','Medicamentos','distribuidoras-transportadoras','Distribuidora / transportadora'],{PERMITIDOS:'^Conformidade do conteúdo||^Descrição das não conformidades||^Categorização das não conformidades||^Classificação final adotada'}]
];
let falhas=0;for(const [nome,args,env] of PASSOS){process.stdout.write('\n▶ '+nome+'\n');try{const out=execFileSync('node',[path.join(D,args[0]),...args.slice(1)],{cwd:ROOT,env:{...process.env,...(env||{})},encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:1800000});process.stdout.write(out.split('\n').filter(l=>/FALHA|SEM EFEITO|\| perguntas|controles|^ok/.test(l)).slice(-40).join('\n')+'\n')}catch(e){falhas++;process.stdout.write(String(e.stdout||'')+String(e.stderr||'').slice(-2000)+'\n✗ falhou\n')}}
console.log('\n'+(falhas?falhas+' passo(s) com falha':'SUÍTE OK'));process.exitCode=falhas?1:0;
