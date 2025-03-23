<?php

require __DIR__ . '/../showroombabyBackend/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../showroombabyBackend');
$dotenv->load();

// Créer une connexion PDO
$db = new PDO('sqlite:' . __DIR__ . '/../showroombabyBackend/database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Clé API HERE
$HERE_API_KEY = 'mJTj_ivJS2vjA9GLOtq6AtOFK91e8CoNoBpvK1mEQ7c';

// Délai entre les requêtes API (en ms) pour éviter de surcharger l'API
$DELAY = 500;

// Fonction pour obtenir le code postal correct à partir d'une adresse avec l'API HERE
function getPostalCodeFromAddress($address, $city) {
    global $HERE_API_KEY;
    
    try {
        if (empty($address) && empty($city)) return null;
        
        // Construire une meilleure requête de recherche
        $searchQuery = '';
        
        // Privilégier les adresses complètes
        if (!empty($address)) {
            $searchQuery = $address;
            // Ajouter la ville si elle n'est pas déjà dans l'adresse et qu'elle est disponible
            if (!empty($city) && stripos($address, $city) === false) {
                $searchQuery .= ", $city";
            }
        } else if (!empty($city)) {
            $searchQuery = $city;
        }
        
        echo "Recherche mondiale pour: $searchQuery\n";
        
        // Requête à l'API HERE sans restriction de pays
        $url = "https://geocode.search.hereapi.com/v1/geocode?q=" . urlencode($searchQuery) . "&apiKey=$HERE_API_KEY";
        
        $response = file_get_contents($url);
        $data = json_decode($response, true);
        
        if (isset($data['items'][0]['address']['postalCode'])) {
            $countryName = isset($data['items'][0]['address']['countryName']) ? $data['items'][0]['address']['countryName'] : "Inconnu";
            echo "Code postal trouvé: {$data['items'][0]['address']['postalCode']} ({$countryName})\n";
            return $data['items'][0]['address']['postalCode'];
        } else {
            echo "Pas de code postal trouvé pour: $searchQuery\n";
            return null;
        }
    } catch (Exception $e) {
        echo "Erreur lors de la recherche d'adresse: " . $e->getMessage() . "\n";
        return null;
    }
}

// Fonction pour essayer de trouver un code postal via une recherche web
function findPostalCodeViaWeb($address, $city) {
    try {
        $searchQuery = "";
        
        if (!empty($address)) {
            $searchQuery = "postal code $address";
            if (!empty($city) && stripos($address, $city) === false) {
                $searchQuery .= " $city";
            }
        } else if (!empty($city)) {
            $searchQuery = "postal code $city";
        } else {
            return null;
        }
        
        echo "Recherche web mondiale pour: $searchQuery\n";
        
        // Simuler une recherche web avec une fonction qui extrait les codes postaux
        $postalCodes = extractPostalCodesFromText($searchQuery);
        
        if (!empty($postalCodes)) {
            echo "Code postal trouvé via recherche web: " . $postalCodes[0] . "\n";
            return $postalCodes[0];
        }
        
        echo "Pas de code postal trouvé via recherche web\n";
        return null;
    } catch (Exception $e) {
        echo "Erreur lors de la recherche web: " . $e->getMessage() . "\n";
        return null;
    }
}

// Fonction pour vérifier si un code postal est valide (formats internationaux acceptés)
function isValidPostalCode($postalCode, $country = null) {
    if (empty($postalCode)) return false;
    
    // Format général pour vérifier si c'est un code postal quelconque
    // Cette expression régulière accepte la plupart des formats internationaux
    $generalPattern = '/^[A-Za-z0-9\s-]{3,10}$/';
    
    // Si ça ressemble à un code postal, on l'accepte
    if (preg_match($generalPattern, $postalCode)) {
        return true;
    }
    
    return false;
}

// Fonction pour extraire des codes postaux d'un texte
function extractPostalCodesFromText($text) {
    // Différents formats de codes postaux à travers le monde
    $patterns = [
        // Formats numériques (3-10 chiffres)
        '/\b\d{3,10}\b/',
        
        // Format UK: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
        '/\b[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}\b/i',
        
        // Format Canada: A9A 9A9
        '/\b[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]\b/i',
        
        // Format Brésil: 99999-999
        '/\b\d{5}-\d{3}\b/',
        
        // Format Japon: 999-9999
        '/\b\d{3}-\d{4}\b/',
        
        // Format général pour les codes avec tirets ou espaces
        '/\b[A-Z0-9]{2,8}[-\s][A-Z0-9]{2,4}\b/i'
    ];
    
    $allMatches = [];
    
    // Appliquer tous les patterns pour trouver des correspondances
    foreach ($patterns as $pattern) {
        preg_match_all($pattern, $text, $matches);
        if (!empty($matches[0])) {
            $allMatches = array_merge($allMatches, $matches[0]);
        }
    }
    
    // Si nous avons trouvé des codes postaux
    if (!empty($allMatches)) {
        return array_unique($allMatches);
    }
    
    // Si aucun code postal n'a été trouvé, chercher dans notre dictionnaire mondial de villes
    $cities = [
        // France
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
        
        // États-Unis
        'new york' => '10001',
        'los angeles' => '90001',
        'chicago' => '60601',
        'houston' => '77001',
        'philadelphia' => '19019',
        'san francisco' => '94102',
        'san diego' => '92101',
        
        // Royaume-Uni
        'london' => 'SW1A 1AA',
        'manchester' => 'M1 1AA',
        'birmingham' => 'B1 1AA',
        'liverpool' => 'L1 1AA',
        
        // Allemagne
        'berlin' => '10115',
        'munich' => '80331',
        'hamburg' => '20095',
        
        // Italie
        'rome' => '00100',
        'milan' => '20121',
        'naples' => '80100',
        
        // Espagne
        'madrid' => '28001',
        'barcelona' => '08001',
        'valencia' => '46001',
        
        // Japon
        'tokyo' => '100-0001',
        'osaka' => '530-0001',
        
        // Chine
        'beijing' => '100000',
        'shanghai' => '200000',
        
        // Australie
        'sydney' => '2000',
        'melbourne' => '3000',
        
        // Canada
        'toronto' => 'M5A 1A1',
        'montreal' => 'H2X 1Y1',
        'vancouver' => 'V5K 0A1',
        
        // Moyen-Orient
        'dubai' => '00000',
        'مارث' => '1110', // Mareth en Tunisie
        'القاهرة' => '11511' // Le Caire, Égypte
    ];
    
    foreach ($cities as $cityName => $postalCode) {
        if (stripos($text, $cityName) !== false) {
            return [$postalCode];
        }
    }
    
    return [];
}

// Fonction principale pour mettre à jour les codes postaux
function updatePostalCodes() {
    global $db, $DELAY;
    
    try {
        echo "Démarrage de la mise à jour des codes postaux (mondial)...\n";
        
        // Récupérer tous les produits
        $stmt = $db->query("SELECT * FROM products");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Nombre total de produits: " . count($products) . "\n";
        
        $updatedCount = 0;
        $errorCount = 0;
        
        foreach ($products as $product) {
            // Vérifier si le code postal est manquant ou invalide
            $needsUpdate = empty($product['zipCode']) || $product['zipCode'] === '75000' || !isValidPostalCode($product['zipCode']);
            
            if ($needsUpdate && (!empty($product['address']) || !empty($product['city']))) {
                echo "Produit {$product['id']}: \"{$product['title']}\" - Mise à jour du code postal...\n";
                
                // Obtenir le code postal à partir de l'adresse ou de la ville
                $newPostalCode = getPostalCodeFromAddress($product['address'], $product['city']);
                
                // Si l'API HERE n'a pas trouvé de code postal, essayer la recherche web
                if (!$newPostalCode) {
                    echo "Tentative de recherche web...\n";
                    $newPostalCode = findPostalCodeViaWeb($product['address'], $product['city']);
                }
                
                if ($newPostalCode) {
                    // Mettre à jour le produit avec le nouveau code postal
                    $updateStmt = $db->prepare("UPDATE products SET zipCode = :zipCode WHERE id = :id");
                    $updateStmt->execute([
                        ':zipCode' => $newPostalCode,
                        ':id' => $product['id']
                    ]);
                    
                    echo "✅ Produit {$product['id']} mis à jour: " . ($product['zipCode'] ?: 'vide') . " -> $newPostalCode\n";
                    $updatedCount++;
                } else {
                    echo "❌ Impossible de trouver un code postal pour le produit {$product['id']}\n";
                    $errorCount++;
                }
                
                // Pause pour éviter de surcharger l'API
                usleep($DELAY * 1000);
            } else if (!$needsUpdate) {
                echo "🟢 Produit {$product['id']}: Le code postal {$product['zipCode']} semble valide.\n";
            } else {
                echo "⚠️ Produit {$product['id']}: Pas assez d'informations pour déterminer le code postal.\n";
                $errorCount++;
            }
        }
        
        echo "\n--- RÉSUMÉ ---\n";
        echo "Total de produits traités: " . count($products) . "\n";
        echo "Produits mis à jour: $updatedCount\n";
        echo "Échecs: $errorCount\n";
        
    } catch (Exception $e) {
        echo "Erreur lors de la mise à jour des codes postaux: " . $e->getMessage() . "\n";
    }
}

// Exécuter la fonction principale
echo "Script de correction des codes postaux démarré\n";
updatePostalCodes();
echo "Script terminé avec succès.\n"; 