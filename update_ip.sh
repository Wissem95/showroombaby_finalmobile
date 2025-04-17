#!/bin/bash

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mise à jour des adresses IP dans ShowroomBaby ===${NC}"

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

# 2. Liste des fichiers à mettre à jour
FILES_TO_UPDATE=(
    "showroombabyBackend/.env"
    "showroombabyFrontend/src/config/ip.ts"
    "showroombabyFrontend/config.ts"
    "showroombabyFrontend/src/config/index.ts"
    "showroombabyFrontend/app.json"
    "showroombabyFrontend/src/screens/LoginScreen.tsx"
    "showroombabyFrontend/src/screens/RegisterScreen.tsx"
    "showroombabyFrontend/src/screens/SearchScreen.tsx"
    "showroombabyFrontend/src/screens/ProductDetailsScreen.tsx"
    "showroombabyFrontend/src/screens/FavoritesScreen.tsx"
    "showroombabyFrontend/src/screens/ChatScreen.tsx"
    "showroombabyFrontend/src/screens/ProfileScreen.tsx"
    "showroombabyFrontend/src/screens/AjouterProduitScreen.tsx"
    "showroombabyFrontend/src/navigation/AppNavigator.tsx"
    "showroombabyFrontend/src/services/auth.ts"
)

# 3. Mise à jour des fichiers
echo -e "${BLUE}Mise à jour des fichiers de configuration...${NC}"

for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Traitement de $file...${NC}"
        
        # Backup du fichier
        cp "$file" "$file.bak"
        
        case "$file" in
            *".env")
                sed -i.tmp "s|APP_URL=.*|APP_URL=http://${LOCAL_IP}:8000|" "$file"
                sed -i.tmp "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=*|" "$file"
                ;;
            *"ip.ts")
                echo "export const SERVER_IP = '$LOCAL_IP';" > "$file"
                ;;
            *"config.ts"|*"index.ts")
                sed -i.tmp "s|export const API_URL = .*|export const API_URL = 'http://${LOCAL_IP}:8000';|" "$file"
                sed -i.tmp "s|return 'http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8000'|return 'http://${LOCAL_IP}:8000'|g" "$file"
                ;;
            *"app.json")
                sed -i.tmp "s|\"apiUrl\": \"http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8000\"|\"apiUrl\": \"http://${LOCAL_IP}:8000\"|g" "$file"
                ;;
            *".tsx"|*".ts")
                # Mise à jour des URLs dans les fichiers TypeScript/React
                sed -i.tmp "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8000|http://${LOCAL_IP}:8000|g" "$file"
                ;;
        esac
        
        # Nettoyage des fichiers temporaires
        rm -f "$file.tmp"
        echo -e "${GREEN}✓ $file mis à jour${NC}"
    else
        echo -e "${RED}× Fichier non trouvé: $file${NC}"
    fi
done

# 4. Nettoyage du cache
echo -e "${BLUE}Nettoyage des caches...${NC}"

# Backend
if [ -d "showroombabyBackend" ]; then
    cd showroombabyBackend
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    cd ..
    echo -e "${GREEN}Cache du backend nettoyé${NC}"
fi

# Frontend
if [ -d "showroombabyFrontend" ]; then
    cd showroombabyFrontend
    rm -rf node_modules/.cache
    cd ..
    echo -e "${GREEN}Cache du frontend nettoyé${NC}"
fi

echo -e "${GREEN}=== Mise à jour terminée ===${NC}"
echo -e "${YELLOW}Pour appliquer les changements :${NC}"
echo -e "1. Redémarrez le serveur backend"
echo -e "2. Redémarrez l'application frontend"
echo -e "3. Nettoyez le cache de l'application mobile si nécessaire" 