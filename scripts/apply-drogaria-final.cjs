'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..');

// Pequenos ajustes finais no compositor antes do empacotamento definitivo.
const reportPath=path.join(root,'drogaria-report-final.js');
let report=fs.readFileSync(reportPath,'utf8');
report=report.replace("function start(){let tries=0;const go=()=>{if(window.DrogariaFinalBridge&&window.DrogariaReview&&install())return;if(++tries<200)setTimeout(go,25);};setTimeout(go,0);}","function start(){let tries=0;const go=()=>{if(window.DrogariaFinalBridge&&window.DrogariaReview&&install())return;if(++tries<200)setTimeout(go,25);};go();}");
report=report.replace("    const tr=sec(s,'documentos_rastreabilidade');","    const ql=sec(s,'documentos_qualidade');\n    if(no(ql.answers.treinamentos))addIssue(out,'final_q_treinamentos',6,'8.1 Documentos de qualidade','Não foram apresentados registros adequados dos treinamentos de pessoal.');\n    if(no(ql.answers.pop_aquisicao))addIssue(out,'final_q_pop_aquisicao',6,'8.1 Documentos de qualidade','Não foi apresentado POP de aquisição.');\n    if(no(ql.answers.pop_vencimento))addIssue(out,'final_q_pop_vencimento',6,'8.1 Documentos de qualidade','Não foi apresentado POP para produtos próximos ao vencimento.');\n    const tr=sec(s,'documentos_rastreabilidade');");
report=report.replace("if(yes(a.identificacao)||b.fields?.identificacao)t.push('as lixeiras estão identificadas quanto ao tipo de resíduo');else if(no(a.identificacao))t.push('há lixeiras sem identificação quanto ao tipo de resíduo');","if(yes(a.identificacao)||yes(a.lixeiras_identificadas)||b.fields?.identificacao)t.push('as lixeiras estão identificadas quanto ao tipo de resíduo');else if(no(a.identificacao)||no(a.lixeiras_identificadas))t.push('há lixeiras sem identificação quanto ao tipo de resíduo');");
fs.writeFileSync(reportPath,report,'utf8');

cp.execFileSync(process.execPath,[path.join(__dirname,'repack-drogaria.cjs')],{cwd:root,stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(__dirname,'test-drogaria.cjs')],{cwd:root,stdio:'inherit'});
console.log('Drogaria integrada, reempacotada e validada no index.html minúsculo.');
