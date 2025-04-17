#!/bin/bash

# Script pour mettre à jour toutes les références d'adresse IP dans le code source
# Créé par l'assistant IA

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mise à jour des références d'adresse IP dans le code source ===${NC}"

# 1. Récupérer l'adresse IP locale
echo -e "${YELLOW}Récupération de l'adresse IP locale...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  LOCAL_IP=$(ipconfig getifaddr en0)
  if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en1)
  fi
else
  # Linux
  LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
  echo -e "${RED}Impossible de déterminer l'adresse IP locale. Utilisation de 127.0.0.1${NC}"
  LOCAL_IP="127.0.0.1"
else
  echo -e "${GREEN}Adresse IP locale détectée: $LOCAL_IP${NC}"
fi

# Sauvegarde de l'ancienne adresse IP pour remplacements
OLD_IP="172.20.10.2"
echo -e "${BLUE}L'ancienne adresse IP qui sera remplacée: $OLD_IP${NC}"

# 2. Mettre à jour la configuration
echo -e "${YELLOW}Mise à jour des fichiers de configuration...${NC}"

# Fichier .env du frontend
if [ -f "showroombabyFrontend/.env" ]; then
  sed -i.bak "s|API_URL=http://.*:8000|API_URL=http://$LOCAL_IP:8000|" showroombabyFrontend/.env
  rm -f showroombabyFrontend/.env.bak
  echo -e "${GREEN}Fichier .env du frontend mis à jour.${NC}"
fi

# Fichier config.ts du frontend
if [ -f "showroombabyFrontend/config.ts" ]; then
  sed -i.bak "s|export const API_URL = 'http://.*:8000'|export const API_URL = 'http://$LOCAL_IP:8000'|" showroombabyFrontend/config.ts
  rm -f showroombabyFrontend/config.ts.bak
  echo -e "${GREEN}Fichier config.ts du frontend mis à jour.${NC}"
fi

# Fichier ip.ts 
if [ -f "showroombabyFrontend/src/config/ip.ts" ]; then
  sed -i.bak "s|export const SERVER_IP = '.*'|export const SERVER_IP = '$LOCAL_IP'|" showroombabyFrontend/src/config/ip.ts
  rm -f showroombabyFrontend/src/config/ip.ts.bak
  echo -e "${GREEN}Fichier ip.ts mis à jour.${NC}"
fi

# Fichier app.json
if [ -f "showroombabyFrontend/app.json" ]; then
  sed -i.bak "s|\"apiUrl\": \"http://.*:8000\"|\"apiUrl\": \"http://$LOCAL_IP:8000\"|" showroombabyFrontend/app.json
  sed -i.bak "s|\"hostUri\": \".*:8081\"|\"hostUri\": \"$LOCAL_IP:8081\"|" showroombabyFrontend/app.json
  rm -f showroombabyFrontend/app.json.bak
  echo -e "${GREEN}Fichier app.json mis à jour.${NC}"
fi

# Fichier .env du backend
if [ -f "showroombabyBackend/.env" ]; then
  sed -i.bak "s|APP_URL=http://.*:8000|APP_URL=http://$LOCAL_IP:8000|" showroombabyBackend/.env
  rm -f showroombabyBackend/.env.bak
  echo -e "${GREEN}Fichier .env du backend mis à jour.${NC}"
fi

# 3. Mettre à jour les références dans le code source
echo -e "${YELLOW}Mise à jour des références dans le code source...${NC}"

# Rechercher toutes les occurrences d'adresses IP codées en dur dans les fichiers .ts et .tsx
files_to_update=$(grep -l "http://$OLD_IP:8000" --include="*.ts" --include="*.tsx" -r showroombabyFrontend/src/)

# Compter le nombre de fichiers à mettre à jour
file_count=$(echo "$files_to_update" | wc -l)
echo -e "${BLUE}Nombre de fichiers à mettre à jour: $file_count${NC}"

# Mettre à jour les fichiers
for file in $files_to_update; do
  echo -e "${YELLOW}Mise à jour du fichier: $file${NC}"
  sed -i.bak "s|http://$OLD_IP:8000|http://$LOCAL_IP:8000|g" "$file"
  sed -i.bak "s|'$OLD_IP'|'$LOCAL_IP'|g" "$file"
  rm -f "$file.bak"
done

echo -e "${GREEN}Mise à jour des références terminée.${NC}"

# 4. Nettoyage du cache
echo -e "${YELLOW}Nettoyage des caches...${NC}"

# Backend
cd showroombabyBackend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
cd ..

echo -e "${GREEN}Caches nettoyés.${NC}"
echo -e "${BLUE}=== Opération terminée avec succès ===${NC}"
echo -e "${YELLOW}Note: Vous devez redémarrer votre application pour appliquer les changements.${NC}"
echo -e "${YELLOW}Utilisez ./run_app.sh pour redémarrer l'application.${NC}" 