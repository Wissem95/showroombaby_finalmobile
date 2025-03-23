<?php

require __DIR__ . '/../showroombabyBackend/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../showroombabyBackend');
$dotenv->load();

// Créer une connexion PDO
$db = new PDO('sqlite:' . __DIR__ . '/../showroombabyBackend/database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fonction pour mettre à jour manuellement les codes postaux des produits problématiques
function updateMissingPostalCodes() {
    global $db;
    
    try {
        echo "Mise à jour manuelle des codes postaux manquants...\n";
        
        // Récupérer tous les produits avec des codes postaux manquants ou invalides
        $stmt = $db->query("SELECT p.*, u.name as user_name 
                           FROM products p 
                           LEFT JOIN users u ON p.user_id = u.id 
                           WHERE p.zipCode IS NULL OR p.zipCode = '' OR p.zipCode = '75000'");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Nombre de produits avec code postal manquant: " . count($products) . "\n";
        
        if (count($products) === 0) {
            echo "Aucun produit ne nécessite de mise à jour manuelle.\n";
            return;
        }
        
        $updatedCount = 0;
        
        // Attribution de codes postaux basée sur le titre, la description ou l'utilisateur
        foreach ($products as $product) {
            echo "Analyse du produit {$product['id']}: \"{$product['title']}\"\n";
            
            // Code postal par défaut pour la France si nous ne trouvons rien de mieux
            $newPostalCode = '75001'; // Paris par défaut
            
            // Définir une liste de villes françaises et leurs codes postaux
            $frenchCities = [
                'paris' => '75001',
                'lyon' => '69001',
                'marseille' => '13001',
                'bordeaux' => '33000',
                'lille' => '59000',
                'nice' => '06000',
                'toulouse' => '31000',
                'nantes' => '44000',
                'strasbourg' => '67000',
                'montpellier' => '34000',
                'rennes' => '35000',
                'grenoble' => '38000',
                'toulon' => '83000',
                'angers' => '49000',
                'dijon' => '21000',
                'le mans' => '72000',
                'aix' => '13100',
                'brest' => '29200',
                'montreuil' => '93100',
                'versailles' => '78000',
                'caen' => '14000',
                'nancy' => '54000',
                'saint-etienne' => '42000',
                'evry' => '91000',
                'villejuif' => '94800',
                'cergy' => '95000',
                'meaux' => '77100',
                'melun' => '77000',
                'creteil' => '94000',
                'bobigny' => '93000'
            ];
            
            // Chercher des indices dans le titre et la description
            $titleAndDesc = strtolower($product['title'] . ' ' . $product['description']);
            
            // Rechercher les villes dans le titre et la description
            foreach ($frenchCities as $city => $postalCode) {
                if (stripos($titleAndDesc, $city) !== false) {
                    $newPostalCode = $postalCode;
                    echo "  Ville trouvée dans le titre/description: $city -> $postalCode\n";
                    break;
                }
            }
            
            // Si nous avons déjà une ville partiellement renseignée, l'utiliser
            if (!empty($product['city'])) {
                $city = strtolower($product['city']);
                foreach ($frenchCities as $cityName => $postalCode) {
                    if (stripos($city, $cityName) !== false) {
                        $newPostalCode = $postalCode;
                        echo "  Ville trouvée dans les données: $city -> $postalCode\n";
                        break;
                    }
                }
            }
            
            // Utiliser l'historique d'achats/ventes de l'utilisateur
            if (!empty($product['user_id'])) {
                $userProductsStmt = $db->prepare("SELECT zipCode, COUNT(*) as count 
                                               FROM products 
                                               WHERE user_id = :user_id 
                                               AND zipCode IS NOT NULL 
                                               AND zipCode != '' 
                                               AND zipCode != '75000'
                                               GROUP BY zipCode 
                                               ORDER BY count DESC 
                                               LIMIT 1");
                $userProductsStmt->execute([':user_id' => $product['user_id']]);
                $userMostUsedZipCode = $userProductsStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($userMostUsedZipCode && !empty($userMostUsedZipCode['zipCode'])) {
                    $newPostalCode = $userMostUsedZipCode['zipCode'];
                    echo "  Code postal trouvé dans l'historique de l'utilisateur: {$newPostalCode}\n";
                }
            }
            
            // Mettre à jour le produit avec le nouveau code postal
            $updateStmt = $db->prepare("UPDATE products SET zipCode = :zipCode WHERE id = :id");
            $updateStmt->execute([
                ':zipCode' => $newPostalCode,
                ':id' => $product['id']
            ]);
            
            echo "✅ Produit {$product['id']} mis à jour avec le code postal: {$newPostalCode}\n";
            $updatedCount++;
        }
        
        echo "\n--- RÉSUMÉ ---\n";
        echo "Total de produits mis à jour: $updatedCount\n";
        
    } catch (Exception $e) {
        echo "Erreur lors de la mise à jour manuelle des codes postaux: " . $e->getMessage() . "\n";
    }
}

// Exécuter la fonction principale
echo "Script de mise à jour manuelle des codes postaux démarré\n";
updateMissingPostalCodes();
echo "Script terminé avec succès.\n"; 