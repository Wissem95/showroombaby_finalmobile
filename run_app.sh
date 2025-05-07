#!/bin/bash

# Script pour lancer le backend et le frontend sur la même adresse IP
# Créé par l'assistant IA

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Démarrage de l'application ShowroomBaby ===${NC}"

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

# 2. Mise à jour de la configuration
echo -e "${BLUE}Mise à jour de la configuration...${NC}"

# Backend: mise à jour du fichier .env
if [ -f "showroombabyBackend/.env" ]; then
  sed -i.bak "s|APP_URL=.*|APP_URL=http://${LOCAL_IP}:8000|" showroombabyBackend/.env
  sed -i.bak "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=*|" showroombabyBackend/.env
  rm -f showroombabyBackend/.env.bak
  echo -e "${GREEN}Configuration du backend mise à jour.${NC}"
else
  echo -e "${RED}Fichier .env non trouvé dans le backend.${NC}"
  exit 1
fi

# Frontend: créer/mettre à jour le fichier de configuration IP
mkdir -p showroombabyFrontend/src/config
echo "export const SERVER_IP = '$LOCAL_IP';" > ./showroombabyFrontend/src/config/ip.ts
echo -e "${GREEN}Adresse IP du serveur configurée dans ./src/config/ip.ts${NC}"

# Vérifier si le fichier config.ts existe et le mettre à jour
if [ -f "showroombabyFrontend/config.ts" ]; then
  sed -i.bak "s|export const API_URL = .*|export const API_URL = 'http://${LOCAL_IP}:8000';|" showroombabyFrontend/config.ts
  rm -f showroombabyFrontend/config.ts.bak
  echo -e "${GREEN}Configuration du frontend mise à jour dans config.ts${NC}"
fi

# 3. Nettoyage du cache du backend
echo -e "${BLUE}Nettoyage du cache du backend...${NC}"
cd showroombabyBackend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
cd ..
echo -e "${GREEN}Cache du backend nettoyé.${NC}"

# 4. Lancement du serveur backend
echo -e "${YELLOW}Démarrage du serveur backend Laravel...${NC}"
cd showroombabyBackend
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Serveur backend démarré à http://$LOCAL_IP:8000 (PID: $BACKEND_PID)${NC}"

# Attente que le backend soit prêt
sleep 3

# 5. Lancement du serveur frontend Expo
echo -e "${YELLOW}Démarrage du serveur frontend Expo...${NC}"
cd showroombabyFrontend
echo -e "${BLUE}=== Lancement de l'app Expo... ===${NC}"
echo -e "${YELLOW}Pour accéder à l'application depuis votre appareil mobile:${NC}"
echo -e "${GREEN}1. Connectez votre téléphone au même réseau WiFi que cet ordinateur${NC}"
echo -e "${GREEN}2. Scannez le QR code qui apparaîtra${NC}"
echo -e "${GREEN}3. Ou entrez manuellement: exp://$LOCAL_IP:19000${NC}"

# Lancement d'Expo en mode hors ligne pour éviter la connexion
npx expo start 

# 6. Nettoyage lors de la fermeture
function cleanup() {
  echo -e "${YELLOW}Arrêt des serveurs...${NC}"
  kill $BACKEND_PID 2>/dev/null
  echo -e "${GREEN}Serveurs arrêtés.${NC}"
  exit 0
}

# Enregistrer gestionnaire signal pour CTRL+C
trap cleanup INT TERM EXIT

# Attendre
wait $BACKEND_PID 