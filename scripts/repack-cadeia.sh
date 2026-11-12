#!/usr/bin/env bash
# Remonta o index.html na ordem em que os scripts de empacotamento dependem uns dos outros.
# Idempotente: rodar duas vezes deve dar o mesmo md5. Não rodar durante a suíte de ponta a ponta.
# Uso: bash scripts/repack-cadeia.sh
set -e
cd "$(dirname "$0")/.."
node scripts/repack-drogaria-recursos.cjs >/dev/null
node scripts/repack-padrao-rolagem.cjs >/dev/null
for s in academia vacina eac medicamentos estetica campo medicamentos-auditoria transporte imagem alimentos-cnpj central pontos redacao sem-alertas ifa-irregulares produtos-citacoes produtos-relatorio atacadista-citacoes atacadista-relatorio projeto-fisico padronizacao legis-resolvedor atacadista-modelos assistenciais-repeticao respostas-simnao alimentos-setores produtos-sugestoes; do
  node scripts/repack-$s.cjs >/dev/null
done
md5sum index.html
