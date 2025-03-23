const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Clé API HERE
const HERE_API_KEY = 'mJTj_ivJS2vjA9GLOtq6AtOFK91e8CoNoBpvK1mEQ7c';

// Délai entre les requêtes API (en ms) pour éviter de surcharger l'API
const DELAY = 500;

// Fonction pour attendre un délai spécifié
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour obtenir le code postal correct à partir d'une adresse avec l'API HERE
async function getPostalCodeFromAddress(address, city) {
  try {
    if (!address && !city) return null;
    
    // Construire une meilleure requête de recherche
    const searchQuery = address ? address : city;
    
    console.log(`Recherche pour: ${searchQuery}`);
    
    const response = await axios.get(
      `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(searchQuery)}&apiKey=${HERE_API_KEY}&in=countryCode:FRA`
    );
    
    if (response.data?.items?.[0]?.address?.postalCode) {
      return response.data.items[0].address.postalCode;
    } else {
      console.log(`Pas de code postal trouvé pour: ${searchQuery}`);
      return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche d'adresse: ${error.message}`);
    return null;
  }
}

// Fonction principale pour mettre à jour les codes postaux
async function updatePostalCodes() {
  try {
    console.log('Démarrage de la mise à jour des codes postaux...');
    
    // Récupérer tous les produits
    const products = await prisma.product.findMany();
    console.log(`Nombre total de produits: ${products.length}`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      // Vérifier si le code postal est manquant ou invalide
      const needsUpdate = !product.zipCode || product.zipCode === '75000' || product.zipCode.length !== 5;
      
      if (needsUpdate && (product.location || product.city)) {
        console.log(`Produit ${product.id}: "${product.title}" - Mise à jour du code postal...`);
        
        // Obtenir le code postal à partir de l'adresse ou de la ville
        const newPostalCode = await getPostalCodeFromAddress(product.location, product.city);
        
        if (newPostalCode) {
          // Mettre à jour le produit avec le nouveau code postal
          await prisma.product.update({
            where: { id: product.id },
            data: { zipCode: newPostalCode }
          });
          
          console.log(`✅ Produit ${product.id} mis à jour: ${product.zipCode || 'vide'} -> ${newPostalCode}`);
          updatedCount++;
        } else {
          console.log(`❌ Impossible de trouver un code postal pour le produit ${product.id}`);
          errorCount++;
        }
        
        // Pause pour éviter de surcharger l'API
        await sleep(DELAY);
      } else if (!needsUpdate) {
        console.log(`🟢 Produit ${product.id}: Le code postal ${product.zipCode} semble valide.`);
      } else {
        console.log(`⚠️ Produit ${product.id}: Pas assez d'informations pour déterminer le code postal.`);
        errorCount++;
      }
    }
    
    console.log('\n--- RÉSUMÉ ---');
    console.log(`Total de produits traités: ${products.length}`);
    console.log(`Produits mis à jour: ${updatedCount}`);
    console.log(`Échecs: ${errorCount}`);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des codes postaux:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction principale
updatePostalCodes()
  .then(() => console.log('Script terminé avec succès.'))
  .catch(error => console.error('Erreur lors de l\'exécution du script:', error)); 