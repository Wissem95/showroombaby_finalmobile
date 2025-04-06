#!/bin/bash

# Nouvelle adresse IP
NEW_IP="172.20.10.2"
OLD_IP="192.168.1.104"

# Mettre à jour tous les fichiers .ts, .tsx et .json dans le dossier frontend
find ./showroombabyFrontend -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) -exec sed -i '' "s/$OLD_IP/$NEW_IP/g" {} \;

echo "Adresse IP mise à jour de $OLD_IP à $NEW_IP dans tous les fichiers"

# Redémarrer le serveur backend
cd ./showroombabyBackend && php artisan cache:clear && php artisan config:clear

echo "Cache du backend effacé"

echo "Opération terminée. Veuillez redémarrer l'application frontend." 