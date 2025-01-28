#!/bin/bash

# Criar o diretório de logs, caso não exista
mkdir -p logs
mkdir -p data

rm data/*
rm logs/*

# Loop para executar 5 processos
for i in {1..5}
do
    # Executa o comando com nohup, redirecionando a saída para logs/{i}.log
    nohup npx tsx index.ts $i > logs/$i.log 2>&1 &
    echo "Processo $i iniciado."
done

echo "Todos os processos foram disparados."
