#!/bin/bash

# Build script para MobiMap STEM Web App
# Constrói o frontend e copia para /srv/mobimap-stem no servidor Docker

set -e

echo "📦 Buildando MobiMap STEM Web App..."

# Instalar dependências
npm install

# Build Vite
npm run build

# Criar diretório de destino se não existir
OUTPUT_DIR="dist"

if [ -d "$OUTPUT_DIR" ]; then
    echo "✅ Build concluído em: $OUTPUT_DIR"
    echo ""
    echo "📋 Para servir no Docker:"
    echo "  1. Copie o conteúdo de 'dist/' para '/srv/mobimap-stem/' no servidor"
    echo "  2. Ou execute: cp -r dist/* ../site/mobimap-stem/"
else
    echo "❌ Erro: Diretório dist/ não foi criado"
    exit 1
fi
