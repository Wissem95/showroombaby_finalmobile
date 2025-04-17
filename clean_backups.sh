#!/bin/bash

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Nettoyage des fichiers de sauvegarde ===${NC}"

# Recherche et suppression des fichiers .bak
echo -e "${YELLOW}Recherche des fichiers .bak...${NC}"

# Dans le backend
if [ -d "showroombabyBackend" ]; then
    find showroombabyBackend -name "*.bak" -type f -exec rm -f {} \;
fi

# Dans le frontend
if [ -d "showroombabyFrontend" ]; then
    find showroombabyFrontend -name "*.bak" -type f -exec rm -f {} \;
fi

echo -e "${GREEN}Nettoyage terminé${NC}" 