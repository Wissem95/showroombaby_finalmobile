import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Image, Dimensions, Alert, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Button, Chip, Card, Checkbox, Divider, ProgressBar, RadioButton } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ProductItem from '../components/ProductItem';
import Slider from '@react-native-community/slider';
import { Animated } from 'react-native';
import imageService from '../services/api/imageService';
import { SERVER_IP } from '../config/ip';
import FilterService, { Filters } from '../services/FilterService';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? `http://${SERVER_IP}:8000/api`  // Adresse IP locale chargée depuis la configuration avec préfixe /api
  : 'https://api.showroombaby.com/api';  // URL de production

// Importer l'image placeholder directement
const placeholderImage = require('../../assets/placeholder.png');

// Interface du produit
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  category_id: number;
  subcategory_id?: number;
  city?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  images?: string | string[] | { path: string; url?: string }[] | any[] | null;
  is_trending?: boolean | number;
  is_featured?: boolean | number;
  user_id: number;
  size?: string;
  color?: string;
  warranty?: string;
  phone?: string;
  hide_phone?: boolean;
  zip_code?: string;
  brand?: string;
  model?: string;
  user_type?: string; // Si le vendeur est professionnel ou particulier
  user?: {
    id: number;
    name?: string;
    email?: string;
    is_professional?: boolean;
  };
}

// Interface pour les catégories
interface Category {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

// Interface pour les options de modale
interface ModalOption {
  id: number | string;
  label: string;
}

// Définition des catégories principales et leurs sous-catégories
const CATEGORIES_DATA = [
  {
    id: 1,
    name: 'Poussette',
    subcategories: [
      { id: 1, name: 'Poussette canne' },
      { id: 2, name: 'Poussette 3 roues' },
      { id: 3, name: 'Poussette 4 roues' },
      { id: 4, name: 'Poussette combiné duo' },
      { id: 5, name: 'Poussette combiné trio' },
      { id: 6, name: 'Poussette double' },
      { id: 7, name: 'Poussette tout terrain' },
    ]
  },
  {
    id: 2,
    name: 'Sièges auto',
    subcategories: [
      { id: 8, name: 'Groupe 0/0+' },
      { id: 9, name: 'Groupe 0+/1' },
      { id: 10, name: 'Groupe 1' },
      { id: 11, name: 'Groupe 2/3' },
      { id: 12, name: 'Groupe 1/2/3' },
      { id: 13, name: 'Siège auto pivotant' },
    ]
  },
  {
    id: 3,
    name: 'Chambre',
    subcategories: [
      { id: 14, name: 'Applique et suspension' },
      { id: 15, name: 'Armoire' },
      { id: 16, name: 'Berceau bébé' },
      { id: 17, name: 'Bibliothèque' },
      { id: 18, name: 'Bureau' },
      { id: 19, name: 'Coffre à jouet' },
      { id: 20, name: 'Commode' },
      { id: 21, name: 'Deco/ lampe' },
      { id: 22, name: 'Lit bébé' },
      { id: 23, name: 'Lit enfant' },
      { id: 24, name: 'Lit mezzanine' },
      { id: 25, name: 'Matelas' },
      { id: 26, name: 'Parc à bébé' },
      { id: 27, name: 'Table à langer' },
      { id: 28, name: 'Table de nuit' },
      { id: 29, name: 'Tiroir de lit' },
      { id: 30, name: 'Tour de lit' },
    ]
  },
  {
    id: 4,
    name: 'Chaussure / Vêtements',
    subcategories: [
      { id: 31, name: 'Gigoteuse' },
      { id: 32, name: 'Pyjama' },
      { id: 33, name: 'T-shirt' },
      { id: 34, name: 'Body' },
      { id: 35, name: 'Salopette / Combinaison' },
      { id: 36, name: 'Pantalon / Jean' },
      { id: 37, name: 'Pull / Gilet / Sweat' },
      { id: 38, name: 'Robe / Jupe' },
      { id: 39, name: 'Short' },
      { id: 40, name: 'Chemise / Blouse' },
      { id: 41, name: 'Legging' },
      { id: 42, name: 'Maillot de bain' },
      { id: 43, name: 'Manteau / Blouson' },
      { id: 44, name: 'Chaussure' },
      { id: 45, name: 'Basket' },
      { id: 46, name: 'Chausson' },
      { id: 47, name: 'Chaussette' },
      { id: 48, name: 'Culotte' },
    ]
  },
  {
    id: 5,
    name: 'Jeux / Éveil',
    subcategories: [
      { id: 49, name: 'Transat' },
      { id: 50, name: 'Balancelle / Bascule' },
      { id: 51, name: 'Ballon' },
      { id: 52, name: 'Trotteur / Porteur/ Chariot' },
      { id: 53, name: 'Vélo' },
      { id: 54, name: 'Doudou / Peluche' },
      { id: 55, name: 'Tapis d\'éveil' },
      { id: 56, name: 'Jouet de bain' },
      { id: 57, name: 'Jouet en bois' },
      { id: 58, name: 'Poupon / Poupée' },
      { id: 59, name: 'Jeu de construction' },
      { id: 60, name: 'Figurine' },
      { id: 61, name: 'Puzzle' },
    ]
  },
  {
    id: 6,
    name: 'Livre / Dvd',
    subcategories: [
      { id: 62, name: 'Livre sonore' },
      { id: 63, name: 'Éveil et premier âge' },
      { id: 64, name: 'Livre 0 mois à 2 ans' },
      { id: 65, name: 'Livre 2 ans à 4 ans' },
      { id: 66, name: 'Livre de bain' },
    ]
  },
  {
    id: 7,
    name: 'Toilette',
    subcategories: [
      { id: 67, name: 'Baignoire' },
      { id: 68, name: 'Couche réutilisable' },
      { id: 69, name: 'Housse matelas à langer' },
      { id: 70, name: 'Matelas à langer' },
      { id: 71, name: 'Mouche bébé' },
      { id: 72, name: 'Peigne / Brosse' },
      { id: 73, name: 'Table à langer' },
      { id: 74, name: 'Thermomètre de bain' },
      { id: 75, name: 'Trousse de toilette' },
    ]
  },
  {
    id: 8,
    name: 'Repas',
    subcategories: [
      { id: 76, name: 'Allaitement' },
      { id: 77, name: 'Boîte' },
      { id: 78, name: 'Boîte doseurs' },
      { id: 79, name: 'Chaise haute bebe' },
      { id: 80, name: 'Chauffe biberon' },
      { id: 81, name: 'Chauffe repas' },
      { id: 82, name: 'Coussin pour chaise haute' },
      { id: 83, name: 'Vaisselle' },
      { id: 84, name: 'Soutien gorge allaitement' },
    ]
  },
  {
    id: 9,
    name: 'Sortie',
    subcategories: [
      { id: 85, name: 'Chancelière' },
      { id: 86, name: 'Lit pliant' },
      { id: 87, name: 'Sac a langer' },
      { id: 88, name: 'Porte bébé' },
    ]
  },
  {
    id: 10,
    name: 'Service',
    subcategories: [
      { id: 89, name: 'Garde d\'enfant' },
      { id: 90, name: 'Aide au devoir' },
    ]
  }
];

// Définition des tailles en fonction des catégories
const SIZES_BY_CATEGORY: Record<number, string[]> = {
  // Vêtements et catégories associées
  4: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  31: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois'],
  32: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  33: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  34: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois'],
  35: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  36: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  37: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  38: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  39: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  40: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  41: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  42: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  43: ['Prématuré', '0 mois', '1 mois', '3 mois', '6 mois', '9 mois', '12 mois', '18 mois', '24 mois', '3 ans', '4 ans', '5 ans', '6 ans'],
  
  // Chaussures et catégories associées
  44: ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
  45: ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
  46: ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
  47: ['Prématuré', '0-3 mois', '3-6 mois', '6-12 mois', '12-18 mois', '18-24 mois', '2-3 ans', '4-5 ans', '6-8 ans'],
};

// Conditions des produits
const CONDITIONS = [
  { id: 'NEW', label: 'Neuf' },
  { id: 'LIKE_NEW', label: 'Très bon état' },
  { id: 'GOOD', label: 'Bon état' },
  { id: 'FAIR', label: 'État satisfaisant' },
];

export default function SearchScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES_DATA);
  
  // Référence pour le listener des changements de filtres
  const filterListenerId = useRef<string | null>(null);

  // S'abonner aux changements de filtres
  useEffect(() => {
    console.log("SearchScreen: S'abonne aux changements de filtres");
    filterListenerId.current = FilterService.subscribe((filters) => {
      console.log("SearchScreen: Filtres mis à jour:", filters);
      applyFilters(filters);
    });

    // Nettoyage: se désabonner lors du démontage du composant
    return () => {
      if (filterListenerId.current) {
        console.log("SearchScreen: Se désabonne des changements de filtres");
        FilterService.unsubscribe(filterListenerId.current);
      }
    };
  }, [products]); // Dépend de products pour pouvoir appliquer les filtres

  // Chargement initial des données
  useEffect(() => {
    // Nettoyer le cache des images lors du chargement de l'écran
    imageService.clearImageCache();
    setIsLoading(true);
    
    // Charger d'abord les catégories puis les produits
    fetchCategories().then(() => {
      fetchProducts();
    });
  }, []);

  // Fonction pour vérifier les filtres stockés dans AsyncStorage
  const checkStoredFilters = async () => {
    try {
      const storedFilters = await AsyncStorage.getItem('activeFilters');
      if (storedFilters) {
        const filters = JSON.parse(storedFilters);
        console.log("Filtres récupérés depuis AsyncStorage:", filters);
        FilterService.setFilters(filters);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des filtres:", error);
    }
  };

  // Fonction de débogage pour vérifier les incohérences entre produits et catégories
  const logCategoryIssues = (prods: Product[], cats: Category[]) => {
    console.log("=== VÉRIFICATION DES CATÉGORIES ===");
    
    // Créer un mapping des IDs de catégories vers les noms
    const categoryMap = new Map<number, string>();
    cats.forEach(cat => categoryMap.set(cat.id, cat.name));
    
    // Collecter toutes les catégories uniques utilisées par les produits
    const productCategories = new Set<number>();
    prods.forEach(prod => {
      if (prod.category_id) {
        productCategories.add(prod.category_id);
      }
    });
    
    // Vérifier si des produits ont des catégories qui n'existent pas dans la liste des catégories
    console.log("Catégories utilisées par les produits mais non définies:");
    let missingCategories = false;
    productCategories.forEach(catId => {
      if (!categoryMap.has(catId)) {
        console.log(`- ID: ${catId} (utilisé par au moins un produit)`);
        missingCategories = true;
      }
    });
    
    if (!missingCategories) {
      console.log("Aucune inconsistance détectée");
    }
    
    console.log("=== FIN DE LA VÉRIFICATION ===");
  };

  // Fonction pour corriger les IDs de catégories des produits si nécessaire
  const normalizeProductCategories = (prods: Product[], cats: Category[]) => {
    // Mapping des noms de catégories aux IDs corrects
    const categoryNameToIdMap = new Map<string, number>();
    cats.forEach(cat => {
      // Ignorer les majuscules/minuscules pour la correspondance des noms
      const normalizedName = cat.name.toLowerCase();
      categoryNameToIdMap.set(normalizedName, cat.id);
      
      // Ajouter aussi des variantes (singulier/pluriel) pour plus de robustesse
      if (normalizedName.endsWith('s')) {
        // Si le nom est au pluriel, ajouter aussi le singulier
        categoryNameToIdMap.set(normalizedName.slice(0, -1), cat.id);
      } else {
        // Si le nom est au singulier, ajouter aussi le pluriel
        categoryNameToIdMap.set(normalizedName + 's', cat.id);
      }
    });
    
    // Mapper ID -> Nom pour les catégories existantes
    const categoryIdToNameMap = new Map<number, string>();
    cats.forEach(cat => categoryIdToNameMap.set(cat.id, cat.name));

    // Produits corrigés
    return prods.map(product => {
      const correctedProduct = { ...product };
      
      // Si la catégorie du produit n'existe pas dans nos catégories
      if (product.category_id && !categoryIdToNameMap.has(product.category_id)) {
        // Tenter de trouver une correspondance par nom
        console.log(`Produit "${product.title}" (ID: ${product.id}) utilise la catégorie ID: ${product.category_id} qui n'existe pas`);
        
        // Pour l'instant, ne pas corriger automatiquement mais juste alerter
        // Si besoin de correction automatique, on pourrait implémenter la logique ici
      }
      
      return correctedProduct;
    });
  };

  const fetchCategories = async () => {
    try {
      // Tenter d'abord de charger les catégories depuis l'API
      const response = await axios.get(`${API_URL}/categories`);
      
      if (response.data) {
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
          
        // Si nous avons des données de l'API, vérifier si elles contiennent des sous-catégories
        if (categoriesData.length > 0) {
          console.log('Données de catégories reçues de l\'API:', categoriesData.length);
          
          // Vérifier si les données de l'API ont des sous-catégories
          const hasSubcategories = categoriesData.some((cat: any) => 
            cat.subcategories && cat.subcategories.length > 0
          );
          
          if (hasSubcategories) {
            console.log('Utilisation des catégories de l\'API avec sous-catégories');
            setCategories(categoriesData);
          } else {
            console.log('Les catégories de l\'API n\'ont pas de sous-catégories, fusion avec les données locales');
            
            // Fusionner les catégories de l'API avec les sous-catégories locales
            const mergedCategories = categoriesData.map((apiCat: any) => {
              // Trouver la catégorie locale correspondante
              const localCat = CATEGORIES_DATA.find(localCat => 
                localCat.id === apiCat.id || 
                localCat.name.toLowerCase() === apiCat.name.toLowerCase() ||
                (localCat.name.toLowerCase().endsWith('s') && 
                 localCat.name.toLowerCase().slice(0, -1) === apiCat.name.toLowerCase()) ||
                (!localCat.name.toLowerCase().endsWith('s') && 
                 localCat.name.toLowerCase() + 's' === apiCat.name.toLowerCase())
              );
              
              // Si on trouve une correspondance, utiliser ses sous-catégories
              if (localCat && localCat.subcategories && localCat.subcategories.length > 0) {
                return {
                  ...apiCat,
                  subcategories: localCat.subcategories
                };
              }
              
              return apiCat;
            });
            
            setCategories(mergedCategories);
          }
          
          // Vérifier la cohérence avec les produits lorsque les deux sont chargés
          if (products.length > 0) {
            logCategoryIssues(products, categoriesData);
          }
        } else {
          // Fallback sur les données locales si l'API ne retourne rien
          console.log('API n\'a pas retourné de catégories, utilisation des catégories locales');
          setCategories(CATEGORIES_DATA);
        }
      } else {
        // Fallback sur les données locales si l'API retourne une réponse vide
        console.log('Réponse API vide, utilisation des catégories locales');
        setCategories(CATEGORIES_DATA);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories depuis l\'API:', error);
      // En cas d'erreur, utiliser les catégories locales
      console.log('Utilisation des catégories locales après erreur API');
      setCategories(CATEGORIES_DATA);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/products`);
      let productsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || response.data.items || [];
      
      console.log(`SearchScreen: Récupération de ${productsData.length} produits`);
      setProducts(productsData);
      
      // Appliquer les filtres actuels aux produits
      const currentFilters = FilterService.getFilters();
      if (currentFilters.category || currentFilters.condition || currentFilters.sellerType) {
        console.log("SearchScreen: Application des filtres actuels aux nouveaux produits");
        applyFilters(currentFilters);
      } else {
        setFilteredProducts(productsData);
      }
      
      // Vérifier la cohérence avec les catégories si elles sont déjà chargées
      if (categories.length > 0) {
        logCategoryIssues(productsData, categories);
      }
    } catch (err) {
      console.error('Erreur API lors du chargement des produits:', err);
      setError('Impossible de charger les produits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      // Si aucune recherche, applique uniquement les filtres
      const currentFilters = FilterService.getFilters();
      applyFilters(currentFilters);
      return;
    }
    
    // Recherche basique par titre et description
    let filtered = products.filter(product => 
      product.title.toLowerCase().includes(query.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Appliquer les filtres actuels également
    const currentFilters = FilterService.getFilters();
    if (currentFilters.category || currentFilters.condition || currentFilters.sellerType) {
      filtered = applyFiltersToProducts(filtered, currentFilters);
    }
    
    setFilteredProducts(filtered);
  };

  // Nouvelle fonction pour appliquer les filtres aux produits
  const applyFiltersToProducts = (productsToFilter: Product[], filters: Filters) => {
    console.log("SearchScreen: Application des filtres aux produits:", filters);
    let filtered = [...productsToFilter];
    
    // Filtrer par catégorie
    if (filters.category !== null) {
      console.log("SearchScreen: Filtrage par catégorie:", filters.category);
      filtered = filtered.filter(product => {
        return product.category_id === filters.category;
      });
    }
    
    // Filtrer par sous-catégorie
    if (filters.subcategory !== null) {
      console.log("SearchScreen: Filtrage par sous-catégorie:", filters.subcategory);
      filtered = filtered.filter(product => {
        return product.subcategory_id === filters.subcategory;
      });
    }
    
    // Filtrer par condition
    if (filters.condition !== null) {
      console.log("SearchScreen: Filtrage par condition:", filters.condition);
      filtered = filtered.filter(product => {
        return product.condition === filters.condition;
      });
    }
    
    // Filtrer par type de vendeur
    if (filters.sellerType !== null) {
      console.log("SearchScreen: Filtrage par type de vendeur:", filters.sellerType);
      filtered = filtered.filter(product => {
        if (filters.sellerType === 'professional') {
          return product.user_type === 'professional' || product.user?.is_professional === true;
        } else {
          return product.user_type !== 'professional' && product.user?.is_professional !== true;
        }
      });
    }
    
    // Filtrer par plage de prix
    if (typeof filters.minPrice === 'number' && typeof filters.maxPrice === 'number') {
      console.log("SearchScreen: Filtrage par prix:", filters.minPrice, "à", filters.maxPrice);
      filtered = filtered.filter(product => 
        product.price >= filters.minPrice && product.price <= filters.maxPrice
      );
    }
    
    console.log("SearchScreen: Résultat du filtrage:", filtered.length, "produits sur", productsToFilter.length);
    return filtered;
  };

  // Appliquer les filtres aux produits
  const applyFilters = (filters: Filters) => {
    console.log("SearchScreen: Appliquer les filtres:", filters);
    
    // Appliquer les filtres aux produits filtrés par la recherche
    let baseProducts = products;
    if (searchQuery.trim()) {
      baseProducts = products.filter(product => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    const result = applyFiltersToProducts(baseProducts, filters);
    console.log("SearchScreen: Résultat final:", result.length, "produits");
    setFilteredProducts(result);
  };

  // Ouvrir l'écran des filtres avancés
  const openAdvancedFilters = () => {
    navigation.navigate('AdvancedFilters', {
      categories: categories
    });
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    console.log("SearchScreen: Réinitialisation des filtres");
    FilterService.resetFilters();
    // La mise à jour des produits filtrés sera gérée par l'abonnement
  };

  // Afficher les filtres actifs
  const hasActiveFilters = () => {
    const filters = FilterService.getFilters();
    return filters.category !== null || 
           filters.subcategory !== null || 
           filters.condition !== null || 
           filters.sellerType !== null || 
           filters.minPrice > 0 || 
           filters.maxPrice < 1000;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#ff6b9b" />
          </TouchableOpacity>
          <Searchbar
            placeholder="Rechercher un produit..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            icon={() => <Ionicons name="search" size={22} color="#ff6b9b" style={styles.searchIcon} />}
            right={() => searchQuery.length > 0 ? 
              <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={22} color="#ff6b9b" style={styles.clearIcon} />
              </TouchableOpacity> : null
            }
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.advancedSearchButton,
            hasActiveFilters() ? styles.activeFilterButton : null
          ]}
          onPress={openAdvancedFilters}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.advancedSearchText,
            hasActiveFilters() ? styles.activeFilterText : null
          ]}>
            {hasActiveFilters() ? 'Filtres actifs' : 'Filtres avancés'}
          </Text>
          <MaterialIcons name="filter-list" size={24} color={hasActiveFilters() ? "#fff" : "#6B3CE9"} />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B3CE9" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* Afficher un message quand aucun produit ne correspond aux filtres */}
          {filteredProducts.length === 0 && !isLoading ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>Aucun produit ne correspond à vos critères</Text>
              {hasActiveFilters() && (
                <TouchableOpacity 
                  style={styles.resetFiltersButton}
                  onPress={resetFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetFiltersText}>Supprimer les filtres</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productCardInner}>
                    <ProductItem item={product} navigation={navigation} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  backButton: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: hp('6%'),
  },
  searchInput: {
    fontSize: 16,
    height: hp('6%'),
  },
  searchIcon: {
    marginRight: 10,
  },
  clearIcon: {
    marginRight: 10,
  },
  advancedSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6B3CE9',
  },
  advancedSearchText: {
    color: '#6B3CE9',
    fontWeight: '500',
    marginRight: 5,
  },
  activeFilterText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  productCard: {
    width: '50%',
    padding: 4,
  },
  productCardInner: {
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // Styles pour l'absence de résultats
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  resetFiltersButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  resetFiltersText: {
    color: '#6B3CE9',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#6B3CE9',
    fontSize: 16,
    marginTop: 20,
  },
}); 