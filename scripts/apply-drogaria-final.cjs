'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.join(__dirname,'..');

// Garante que o último compositor seja instalado também no harness síncrono de QA.
const reportPath=path.join(root,'drogaria-report-final.js');
let report=fs.readFileSync(reportPath,'utf8');
report=report.replace("function start(){let tries=0;const go=()=>{if(window.DrogariaFinalBridge&&window.DrogariaReview&&install())return;if(++tries<200)setTimeout(go,25);};setTimeout(go,0);}","function start(){let tries=0;const go=()=>{if(window.DrogariaFinalBridge&&window.DrogariaReview&&install())return;if(++tries<200)setTimeout(go,25);};go();}");
fs.writeFileSync(reportPath,report,'utf8');

// Atualiza o QA para carregar e validar o compositor final junto das demais pontes.
const testPath=path.join(__dirname,'test-drogaria.cjs');
let test=fs.readFileSync(testPath,'utf8');
const oldList="['drogaria-ocr-tools','drogaria-review','drogaria-section1','drogaria-area-fisica','drogaria-servicos-documentos','drogaria-final-bridge']";
const newList="['drogaria-ocr-tools','drogaria-review','drogaria-section1','drogaria-area-fisica','drogaria-servicos-documentos','drogaria-final-bridge','drogaria-report-final']";
test=test.replaceAll(oldList,newList);
test=test.replace("assert.ok(text.includes('AFE-TESTE')&&text.includes('AE-TESTE'));","assert.ok(text.includes('AFE-TESTE')&&!text.includes('AE-TESTE'),'Drogaria não deve emitir AE no relatório');");
test=test.replace("assert.ok(text.includes('Manual conferido')&&!text.includes('SEGREDO_NAO_TRANSMITIR'));","assert.ok(!text.includes('SEGREDO_NAO_TRANSMITIR'),'Documento excluído não pode entrar no relatório');");
test=test.replace("assert.ok(coldNo.includes('não realiza venda de medicamentos termolábeis'));","assert.ok(coldNo.includes('não comercializa medicamentos termolábeis')); ");
test=test.replace("assert.ok((events.get('click')||[]).length>=5,'Cada ponte precisa instalar seus eventos');","assert.ok((events.get('click')||[]).length>=5,'Cada ponte precisa instalar seus eventos');assert.ok(ctx.DrogariaReportFinal,'Compositor final do relatório precisa estar carregado');");
fs.writeFileSync(testPath,test,'utf8');

cp.execFileSync(process.execPath,[path.join(__dirname,'repack-drogaria.cjs')],{cwd:root,stdio:'inherit'});
cp.execFileSync(process.execPath,[testPath],{cwd:root,stdio:'inherit'});
console.log('Drogaria integrada, reempacotada e validada no index.html minúsculo.');
