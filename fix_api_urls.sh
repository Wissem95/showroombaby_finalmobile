#!/bin/bash

# Script pour corriger les URLs d'API dans tous les fichiers
# Créé par l'assistant IA

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Correction des URLs d'API dans le code source ===${NC}"

# Obtenir l'adresse IP actuelle
IP=$(grep "SERVER_IP" showroombabyFrontend/src/config/ip.ts | sed "s/export const SERVER_IP = '\(.*\)';/\1/")
echo -e "${GREEN}Adresse IP configurée: $IP${NC}"

# 1. Trouver tous les fichiers qui contiennent une URL d'API incorrecte
echo -e "${YELLOW}Recherche des fichiers avec URLs d'API incorrectes...${NC}"

# Pattern 1: http://IP:8000 sans /api à la fin
FILES1=$(grep -l "http://$IP:8000['\"]" --include="*.ts" --include="*.tsx" -r showroombabyFrontend/src/)

# Pattern 2: http://$IP:8000/api/api/ (double api)
FILES2=$(grep -l "http://$IP:8000/api/api/" --include="*.ts" --include="*.tsx" -r showroombabyFrontend/src/)

# Fusionner les listes de fichiers
FILES=$(echo "$FILES1 $FILES2" | tr ' ' '\n' | sort | uniq)

# 2. Corriger les URLs d'API
echo -e "${BLUE}Correction des URLs d'API dans les fichiers...${NC}"

for file in $FILES; do
  echo -e "${YELLOW}Traitement du fichier: $file${NC}"
  
  # Correction pattern 1: http://IP:8000 => http://IP:8000/api
  sed -i.bak "s|http://$IP:8000'|http://$IP:8000/api'|g" "$file"
  sed -i.bak "s|http://$IP:8000\"|http://$IP:8000/api\"|g" "$file"
  
  # Correction pattern 1 avec variable template: `http://${SERVER_IP}:8000` => `http://${SERVER_IP}:8000/api`
  sed -i.bak "s|\`http://\${SERVER_IP}:8000\`|\`http://\${SERVER_IP}:8000/api\`|g" "$file"
  
  # Correction pattern 2: API_URL}/api/api/ => API_URL}/api/
  sed -i.bak "s|\${API_URL}/api/|\${API_URL}/|g" "$file"
  
  # Suppression des fichiers .bak
  rm -f "$file.bak"
  
  echo -e "${GREEN}Fichier corrigé: $file${NC}"
done

# 3. Correction des URL avec double /api/
echo -e "${YELLOW}Recherche des appels API avec double /api...${NC}"
FILES3=$(grep -l "\${API_URL}/api/" --include="*.ts" --include="*.tsx" -r showroombabyFrontend/src/)

for file in $FILES3; do
  echo -e "${YELLOW}Correction du fichier: $file${NC}"
  
  # Remplacer ${API_URL}/api/ par ${API_URL}/
  sed -i.bak "s|\${API_URL}/api/|\${API_URL}/|g" "$file"
  
  # Suppression des fichiers .bak
  rm -f "$file.bak"
  
  echo -e "${GREEN}Fichier corrigé: $file${NC}"
done

echo -e "${GREEN}=== Correction des URLs d'API terminée ===${NC}"
echo -e "${YELLOW}Note: Redémarrez l'application pour appliquer les changements.${NC}"

# 4. Nettoyage du cache
echo -e "${YELLOW}Nettoyage des caches...${NC}"

# Backend
cd showroombabyBackend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
cd ..

echo -e "${GREEN}Caches nettoyés.${NC}" 