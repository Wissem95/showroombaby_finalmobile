import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Image, Dimensions, Alert, SafeAreaView, Modal } from 'react-native';
import { Text, Searchbar, Button, Chip, Card, Checkbox, Divider, ProgressBar } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ProductItem from '../components/ProductItem';
import Slider from '@react-native-community/slider';

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

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
}

// Interface pour les catégories
interface Category {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

// Définition des catégories principales et leurs sous-catégories
const CATEGORIES_DATA = [
  {
    id: 1,
    name: 'Poussettes',
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

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES_DATA);
  
  // Filtres avancés
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  
  // Modal
  const [modalVisible, setModalVisible] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalOptions, setModalOptions] = useState<any[]>([]);

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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Tenter d'abord de charger les catégories depuis l'API
      const response = await axios.get(`${API_URL}/api/categories`);
      
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
      const response = await axios.get(`${API_URL}/api/products`);
      let productsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || response.data.items || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
      
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
      setFilteredProducts(products);
      return;
    }
    
    // Recherche basique par titre et description
    const filtered = products.filter(product => 
      product.title.toLowerCase().includes(query.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredProducts(filtered);
  };

  const applyAdvancedFilters = () => {
    // Commencer avec tous les produits ou le résultat de la recherche par texte
    let filtered = searchQuery.trim() 
      ? products.filter(product => 
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : [...products];
    
    // Filtrer par catégorie de manière plus robuste
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        // Correspondance directe par ID
        if (product.category_id === selectedCategory) {
          return true;
        }
        
        // Si le produit existe dans notre jeu de données, mais avec une catégorie différente
        // nous pouvons vérifier si c'est une question de différence entre API et front
        const selectedCategoryInfo = categories.find(c => c.id === selectedCategory);
        if (selectedCategoryInfo) {
          // Vérifier si les noms correspondent (ignorer les pluriels/singuliers et majuscules)
          const normalizedSelectedName = selectedCategoryInfo.name.toLowerCase();
          const selectedNameSingular = normalizedSelectedName.endsWith('s') 
            ? normalizedSelectedName.slice(0, -1) 
            : normalizedSelectedName;
          
          // On pourrait ajouter plus de logique ici pour des correspondances plus avancées
          
          // Pour l'instant, on s'en tient à la correspondance par ID
        }
        
        return false;
      });
    }
    
    // Filtrer par sous-catégorie
    if (selectedSubcategory) {
      filtered = filtered.filter(product => product.subcategory_id === selectedSubcategory);
    }
    
    // Filtrer par taille
    if (selectedSize) {
      filtered = filtered.filter(product => product.size === selectedSize);
    }
    
    // Filtrer par condition
    if (selectedCondition) {
      filtered = filtered.filter(product => product.condition === selectedCondition);
    }
    
    // Filtrer par plage de prix
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    setFilteredProducts(filtered);
    setShowAdvancedSearch(false);
    
    // Afficher des statistiques pour aider au débogage
    console.log(`Filtres appliqués - Résultats: ${filtered.length}/${products.length} produits`);
    if (selectedCategory) {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Inconnu';
      console.log(`Filtre par catégorie: ${categoryName} (ID: ${selectedCategory})`);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedSize(null);
    setSelectedCondition(null);
    setPriceRange([0, 1000]);
    
    // Appliquer juste la recherche par texte
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredProducts(products);
    }
    
    setShowAdvancedSearch(false);
  };

  const showSelectionModal = (type: string) => {
    let options: any[] = [];
    let title = '';

    switch (type) {
      case 'category':
        options = categories.map(c => ({ id: c.id, label: c.name }));
        title = 'Sélectionner une catégorie';
        break;
      case 'subcategory':
        const selectedCat = categories.find(c => c.id === selectedCategory);
        options = selectedCat && selectedCat.subcategories 
          ? selectedCat.subcategories.map(sc => ({ id: sc.id, label: sc.name }))
          : [];
        title = 'Sélectionner une sous-catégorie';
        break;
      case 'size':
        // Tailles basées sur la catégorie ou sous-catégorie sélectionnée
        if (selectedSubcategory && SIZES_BY_CATEGORY[selectedSubcategory]) {
          // Si une sous-catégorie est sélectionnée et qu'elle a des tailles définies
          options = SIZES_BY_CATEGORY[selectedSubcategory].map(size => ({ id: size, label: size }));
        } else if (selectedCategory === 4) {
          // Catégorie vêtements générale
          options = SIZES_BY_CATEGORY[4].map(size => ({ id: size, label: size }));
        } else if (selectedCategory) {
          // Vérifier si la catégorie a des tailles définies
          const catId = selectedCategory;
          if (SIZES_BY_CATEGORY[catId]) {
            options = SIZES_BY_CATEGORY[catId].map(size => ({ id: size, label: size }));
          }
        }
        title = 'Sélectionner une taille';
        break;
      case 'condition':
        options = CONDITIONS;
        title = 'Sélectionner un état';
        break;
    }

    setModalOptions(options);
    setModalTitle(title);
    setModalVisible(type);
  };

  const selectModalOption = (option: any) => {
    switch (modalVisible) {
      case 'category':
        setSelectedCategory(option.id);
        setSelectedSubcategory(null); // Réinitialiser la sous-catégorie quand la catégorie change
        setSelectedSize(null); // Réinitialiser la taille
        break;
      case 'subcategory':
        setSelectedSubcategory(option.id);
        break;
      case 'size':
        setSelectedSize(option.id);
        break;
      case 'condition':
        setSelectedCondition(option.id);
        break;
    }
    setModalVisible(null);
  };

  const renderModalContent = () => {
    return (
      <Modal
        visible={!!modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Divider style={{ marginVertical: 10 }} />
            
            <ScrollView style={styles.modalBody}>
              {modalOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.modalOption}
                  onPress={() => selectModalOption(option)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {modalOptions.length === 0 && (
                <Text style={styles.noOptionsText}>Aucune option disponible</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Searchbar
            placeholder="Rechercher un produit"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.advancedSearchButton}
          onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
        >
          <Text style={styles.advancedSearchText}>
            {showAdvancedSearch ? 'Masquer les filtres' : 'Recherche avancée'}
          </Text>
          <MaterialIcons 
            name={showAdvancedSearch ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#6B3CE9" 
          />
        </TouchableOpacity>
      </View>
      
      {showAdvancedSearch && (
        <ScrollView style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Catégorie</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => showSelectionModal('category')}
            >
              <Text style={selectedCategory ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Sélectionner' 
                  : 'Sélectionner'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          
          {selectedCategory && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Sous-catégorie</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => showSelectionModal('subcategory')}
              >
                <Text style={selectedSubcategory ? styles.selectorText : styles.selectorPlaceholder}>
                  {selectedSubcategory 
                    ? categories.find(c => c.id === selectedCategory)?.subcategories?.find(sc => sc.id === selectedSubcategory)?.name || 'Sélectionner'
                    : 'Sélectionner'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Afficher le sélecteur de taille pour les vêtements et chaussures */}
          {(selectedCategory === 4 ||
            (selectedSubcategory !== null && 
              ((selectedSubcategory >= 31 && selectedSubcategory <= 48) || 
               (SIZES_BY_CATEGORY[selectedSubcategory] !== undefined)))) && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Taille</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => showSelectionModal('size')}
              >
                <Text style={selectedSize ? styles.selectorText : styles.selectorPlaceholder}>
                  {selectedSize || 'Sélectionner'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>État</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => showSelectionModal('condition')}
            >
              <Text style={selectedCondition ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedCondition 
                  ? CONDITIONS.find(c => c.id === selectedCondition)?.label || 'Sélectionner'
                  : 'Sélectionner'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Prix</Text>
            <View style={styles.priceRangeContainer}>
              <Text style={styles.priceValue}>{priceRange[0]}€</Text>
              <Text style={styles.priceValue}>{priceRange[1]}€</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1000}
              step={10}
              value={priceRange[0]}
              minimumTrackTintColor="#6B3CE9"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#6B3CE9"
              onValueChange={(value) => setPriceRange([value, priceRange[1]])}
            />
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1000}
              step={10}
              value={priceRange[1]}
              minimumTrackTintColor="#6B3CE9"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#6B3CE9"
              onValueChange={(value) => setPriceRange([priceRange[0], value])}
            />
          </View>
          
          <View style={styles.filterButtons}>
            <Button 
              mode="outlined" 
              onPress={resetFilters}
              style={styles.resetButton}
            >
              Réinitialiser
            </Button>
            <Button 
              mode="contained" 
              onPress={applyAdvancedFilters}
              style={styles.applyButton}
            >
              Appliquer
            </Button>
          </View>
        </ScrollView>
      )}
      
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductItem item={item} navigation={navigation} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Commencez à chercher'}
            </Text>
          </View>
        }
      />
      
      {renderModalContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
  },
  searchBar: {
    flex: 1,
    marginLeft: 5,
    borderRadius: 30,
    height: 45,
    backgroundColor: '#f5f5f5',
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  advancedSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 5,
  },
  advancedSearchText: {
    color: '#6B3CE9',
    fontWeight: '500',
    marginRight: 5,
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectorText: {
    color: '#333',
    fontSize: 15,
  },
  selectorPlaceholder: {
    color: '#999',
    fontSize: 15,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 10,
  },
  resetButton: {
    flex: 1,
    marginRight: 10,
    borderColor: '#6B3CE9',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#6B3CE9',
  },
  productsGrid: {
    padding: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  noOptionsText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },
}); 