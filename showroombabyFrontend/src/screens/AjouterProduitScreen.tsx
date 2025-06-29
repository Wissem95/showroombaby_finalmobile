import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal, FlatList, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Button, Card, Checkbox, Divider, HelperText, Searchbar } from 'react-native-paper';
import { Ionicons, MaterialIcons, Entypo, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { globalStyles, colors } from '../theme/globalStyles';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.3:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

type Category = {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
};

interface ProductData {
  title: string;
  description: string;
  price: string;
  condition: string;
  size: string;
  color: string;
  warranty: string;
  category_id: number | null;
  subcategory_id: number | null;
  location: string;
  telephone: string;
  hide_phone: boolean;
  images: { uri: string; type: string; name: string }[];
  user_id: number | null;
  zipCode: string;
  brand: string | null;
  is_professional: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
}

enum Step {
  INFOS_BASE = 0,
  DESCRIPTION_PRIX = 1,
  CONDITION = 2,
  PHOTOS = 3,
  LOCATION = 4,
}

const CONDITIONS = [
  { id: 'NEW', label: 'Neuf' },
  { id: 'LIKE_NEW', label: 'Très bon état' },
  { id: 'GOOD', label: 'Bon état' },
  { id: 'FAIR', label: 'État satisfaisant' },
];

const WARRANTIES = [
  { id: 'no', label: 'Pas de garantie' },
  { id: '3_months', label: '3 mois' },
  { id: '6_months', label: '6 mois' },
  { id: '12_months', label: '12 mois' },
  { id: '24_months', label: '24 mois' },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

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

// Marques pour les différentes catégories
const BRANDS = [
  { id: 1, name: 'Babymoov' },
  { id: 2, name: 'Chicco' },
  { id: 3, name: 'Bébé Confort' },
  { id: 4, name: 'Cybex' },
  { id: 5, name: 'Nattou' },
  { id: 6, name: 'Nuk' },
  { id: 7, name: 'Philips Avent' },
  { id: 8, name: 'Red Castle' },
  { id: 9, name: 'Tigex' },
  { id: 10, name: 'Autre' },
];

export default function AjouterProduitScreen({ navigation, route }: any) {
  const productId = route.params?.productId;
  
  // Regrouper tous les useState au début
  const [currentStep, setCurrentStep] = useState<Step>(Step.INFOS_BASE);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productData, setProductData] = useState<ProductData>({
    title: '',
    description: '',
    price: '',
    condition: '',
    size: '',
    color: '',
    warranty: '',
    category_id: null,
    subcategory_id: null,
    location: '',
    telephone: '',
    hide_phone: false,
    images: [],
    user_id: null,
    zipCode: '',
    brand: null,
    is_professional: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [modalVisible, setModalVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<number | null>(null);
  const [lastLocationCheck, setLastLocationCheck] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const LOCATION_CHECK_INTERVAL = 5000; // 5 secondes
  const [brandInput, setBrandInput] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<typeof BRANDS>([]);

  useEffect(() => {
    // Utiliser les catégories prédéfinies au lieu de les charger depuis l'API
    setCategories(CATEGORIES_DATA);
    checkPermissions();
    getUserInfo();
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Reset form when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setProductData({
          title: '',
          description: '',
          price: '',
          condition: '',
          size: '',
          color: '',
          warranty: '',
          category_id: null,
          subcategory_id: null,
          location: '',
          telephone: '',
          hide_phone: false,
          images: [],
          user_id: null,
          zipCode: '',
          brand: null,
          is_professional: false,
        });
        setCurrentStep(Step.INFOS_BASE);
        setErrors({});
        setTermsAccepted(false);
        setModalVisible(null);
        setShowSuccessPage(false);
        setPublishedProductId(null);
      };
    }, [])
  );

  // Add close button in header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            if (currentStep > 0) {
              handleBackPress();
            } else {
              Alert.alert(
                'Quitter',
                'Voulez-vous vraiment quitter ? Les modifications non enregistrées seront perdues.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    text: 'Quitter', 
                    style: 'destructive',
                    onPress: () => navigation.goBack() 
                  }
                ]
              );
            }
          }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="colors.TEXT_DARK" />
        </TouchableOpacity>
      ),
      headerTitle: 'Ajouter un produit',
      headerTitleStyle: styles.headerTitle,
    });
  }, [navigation, currentStep]);

  const handleClosePress = () => {
    Alert.alert(
      'Quitter',
      'Voulez-vous vraiment quitter ? Les modifications non enregistrées seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleBackPress = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      handleClosePress();
    }
  };

  const getUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.id) {
          setProductData(prev => ({ ...prev, user_id: response.data.id }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      // Continuer sans les informations utilisateur
    }
  };

  const checkPermissions = async () => {
    // Vérifier si on a déjà fait une vérification récemment
    const now = Date.now();
    if (now - lastLocationCheck < LOCATION_CHECK_INTERVAL) {
      return;
    }
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const { latitude, longitude } = location.coords;
        
        // Mettre à jour le timestamp de la dernière vérification
        setLastLocationCheck(now);
        
        const response = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        if (response[0]) {
          const { city, region, postalCode } = response[0];
          const locationString = `${city || ''}, ${postalCode || ''} ${region || ''}`.trim();
          setUserLocation(locationString);
          setProductData(prev => ({ ...prev, location: locationString }));
        }
      } catch (error) {
        console.error('Erreur de localisation:', error);
      }
    }
  };

  const validateImage = async (imageUri: string): Promise<string | false> => {
    try {
      // Compresser l'image avant validation
      const compressedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      const response = await fetch(compressedImage.uri);
      const blob = await response.blob();
      
      // Vérifier la taille
      if (blob.size > MAX_IMAGE_SIZE) {
        Alert.alert('Erreur', 'L\'image est trop volumineuse (max 5MB)');
        return false;
      }

      // Vérifier le type
      if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
        Alert.alert('Erreur', 'Format d\'image non supporté (JPG/PNG uniquement)');
        return false;
      }

      return compressedImage.uri;
    } catch (error) {
      console.error('Erreur lors de la validation de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de valider l\'image');
      return false;
    }
  };

  const pickImage = async () => {
    if (productData.images.length >= MAX_IMAGES) {
      Alert.alert('Maximum atteint', `Vous ne pouvez pas ajouter plus de ${MAX_IMAGES} photos.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à votre galerie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Compresser l'image
        const compressedImage = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );

        const validatedUri = await validateImage(compressedImage.uri);
        if (validatedUri) {
          setProductData(prev => ({
            ...prev,
            images: [...prev.images, {
              uri: validatedUri,
              type: 'image/jpeg',
              name: `image_${prev.images.length}.jpg`
            }]
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...productData.images];
    newImages.splice(index, 1);
    setProductData(prev => ({ ...prev, images: newImages }));
  };

  const validateStep = () => {
    let valid = true;
    const tempErrors: Record<string, string> = {};

    switch (currentStep) {
      case Step.INFOS_BASE:
        if (!productData.title.trim()) {
          tempErrors.title = 'Le titre est obligatoire.';
          valid = false;
        } else if (productData.title.length < 3) {
          tempErrors.title = 'Le titre doit contenir au moins 3 caractères.';
          valid = false;
        }
        
        if (!productData.category_id) {
          tempErrors.category = 'La catégorie est obligatoire.';
          valid = false;
        }
        
        if (!productData.subcategory_id) {
          tempErrors.subcategory = 'La sous-catégorie est obligatoire.';
          valid = false;
        } else {
          // Vérifier que la sous-catégorie appartient bien à la catégorie sélectionnée
          const category = categories.find(c => c.id === productData.category_id);
          const subcategoryExists = category?.subcategories?.some(sub => sub.id === productData.subcategory_id);
          if (!subcategoryExists) {
            tempErrors.subcategory = 'La sous-catégorie sélectionnée n\'est pas valide pour cette catégorie.';
            valid = false;
          }
        }
        break;
      
      case Step.DESCRIPTION_PRIX:
        if (!productData.description.trim()) {
          tempErrors.description = 'La description est obligatoire.';
          valid = false;
        } else if (productData.description.length < 10) {
          tempErrors.description = 'La description doit contenir au moins 10 caractères.';
          valid = false;
        }
        
        if (!productData.price.trim()) {
          tempErrors.price = 'Le prix est obligatoire.';
          valid = false;
        } else {
          const price = parseFloat(productData.price);
          if (isNaN(price) || price <= 0) {
            tempErrors.price = 'Veuillez saisir un prix valide (supérieur à 0).';
            valid = false;
          } else if (price > 1000000) {
            tempErrors.price = 'Le prix ne peut pas dépasser 1 000 000 €.';
            valid = false;
          }
        }
        break;
      
      case Step.CONDITION:
        if (!productData.condition) {
          tempErrors.condition = 'Veuillez sélectionner un état du produit.';
          valid = false;
        } else {
          // Vérifier que l'état sélectionné est valide
          const validCondition = CONDITIONS.some(c => c.id === productData.condition);
          if (!validCondition) {
            tempErrors.condition = 'L\'état sélectionné n\'est pas valide.';
            valid = false;
          }
        }
        break;
      
      case Step.PHOTOS:
        if (productData.images.length === 0) {
          tempErrors.images = 'Veuillez ajouter au moins deux photos.';
          valid = false;
        } else if (productData.images.length < 2) {
          tempErrors.images = 'Vous devez ajouter au moins deux photos.';
          valid = false;
        } else if (productData.images.length > MAX_IMAGES) {
          tempErrors.images = `Vous ne pouvez pas ajouter plus de ${MAX_IMAGES} photos.`;
          valid = false;
        }
        break;
      
      case Step.LOCATION:
        if (!productData.location.trim()) {
          tempErrors.location = 'L\'adresse est obligatoire.';
          valid = false;
        }
        
        if (!productData.telephone.trim()) {
          tempErrors.telephone = 'Le numéro de téléphone est obligatoire.';
          valid = false;
        } else if (!/^0[1-9][0-9]{8}$/.test(productData.telephone)) {
          tempErrors.telephone = 'Le numéro de téléphone doit commencer par 0 et contenir 10 chiffres.';
          valid = false;
        }
        
        if (productData.zipCode && !/^\d{5}$/.test(productData.zipCode)) {
          tempErrors.zipCode = 'Le code postal doit contenir 5 chiffres.';
          valid = false;
        }
        
        if (!termsAccepted) {
          tempErrors.terms = 'Vous devez accepter les conditions générales.';
          valid = false;
        }
        break;
    }
    
    setErrors(tempErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < Step.LOCATION) {
        setCurrentStep(currentStep + 1);
      } else {
        submitProduct();
      }
    } else {
      // Afficher une alerte pour informer l'utilisateur des champs manquants
      const errorMessages = Object.values(errors).filter(msg => msg);
      if (errorMessages.length > 0) {
        Alert.alert(
          'Champs obligatoires',
          errorMessages.join('\n'),
          [{ text: 'OK' }]
        );
      }
    }
  };

  const submitProduct = async () => {
    try {
      setIsLoading(true);
      
      if (!validateStep()) {
        setIsLoading(false);
        return;
      }
      
      // Vérifier si l'utilisateur est connecté et a un ID
      if (!productData.user_id) {
        // Tenter de récupérer l'ID de l'utilisateur si pas déjà fait
        await getUserInfo();
        
        if (!productData.user_id) {
          Alert.alert(
            'Connexion requise',
            'Vous devez être connecté pour publier une annonce.',
            [
              {
                text: 'Se connecter',
                onPress: () => navigation.navigate('Auth', { backToAjoutProduit: true })
              },
              {
                text: 'Annuler',
                style: 'cancel'
              }
            ]
          );
          setIsLoading(false);
          return;
        }
      }
      
      // Préparer les données du produit pour l'envoi
      const formData = new FormData();
      
      // Ajouter les champs textuels
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      
      // Vérification et correction des IDs de catégorie et sous-catégorie
      if (productData.category_id) {
        // Le backend attend 'categoryId' and not 'category_id'
        formData.append('categoryId', productData.category_id.toString());
        
        // Vérifier si la sous-catégorie est valide avant de l'ajouter
        if (productData.subcategory_id) {
          // Vérifier que l'ID de sous-catégorie est bien conforme à ceux définis dans le backend
          const category = CATEGORIES_DATA.find(c => c.id === productData.category_id);
          const subCategoryValid = category?.subcategories?.some(sc => sc.id === productData.subcategory_id);
            
          if (subCategoryValid) {
            console.log(`Sous-catégorie valide: ID=${productData.subcategory_id} pour catégorie=${productData.category_id}`);
            formData.append('subcategoryId', productData.subcategory_id.toString());
          } else {
            console.log('Sous-catégorie invalide pour cette catégorie');
            Alert.alert(
              'Sous-catégorie invalide',
              'La sous-catégorie sélectionnée n\'est pas valide pour cette catégorie. Veuillez en sélectionner une autre.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setCurrentStep(Step.INFOS_BASE);
                    setProductData(prev => ({ ...prev, subcategory_id: null }));
                  }
                }
              ]
            );
            setIsLoading(false);
            return;
          }
        } else {
          console.log('Aucune sous-catégorie sélectionnée');
        }
      }
      
      // Make sure condition is set to a valid value
      if (!productData.condition || productData.condition === '') {
        // Default condition is not set anymore - require user selection
        console.log('Erreur: État du produit non sélectionné');
        setErrors({...errors, condition: 'Veuillez sélectionner un état du produit.'});
        setIsLoading(false);
        setCurrentStep(Step.CONDITION);
        return;
      } else {
        formData.append('condition', productData.condition);
        console.log('Condition sélectionnée utilisée:', productData.condition);
      }
      
      // Important: Le backend attend 'address' and not 'location'
      formData.append('address', productData.location);
      // Also required by the backend
      formData.append('city', productData.city || '');
      // Phone (the backend expects 'phone' and not 'telephone')
      formData.append('phone', productData.telephone);
      
      formData.append('hide_phone', productData.hide_phone ? '1' : '0');
      
      // Geographical coordinates
      if (productData.latitude !== undefined && productData.latitude !== null) {
        formData.append('latitude', productData.latitude.toString());
      }
      if (productData.longitude !== undefined && productData.longitude !== null) {
        formData.append('longitude', productData.longitude.toString());
      }
      
      // Add other fields if present
      if (productData.zipCode) {
        formData.append('zipcode', productData.zipCode);
      }
      if (productData.brand) {
        formData.append('brand', productData.brand);
      }
      if (productData.size) {
        formData.append('size', productData.size);
      }
      if (productData.color) {
        formData.append('color', productData.color);
      }
      if (productData.warranty) {
        formData.append('warranty', productData.warranty);
      }
      
      // Add images
      for (let i = 0; i < productData.images.length; i++) {
        const imgFile = productData.images[i];
        formData.append('images[]', {
          uri: imgFile.uri,
          type: imgFile.type || 'image/jpeg',
          name: imgFile.name || `image_${i}.jpg`
        } as any);
      }
      
      // Get authentication token
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      // Send to API
      // Debug sent data
      console.log('Envoi des données au serveur:', {
        title: productData.title,
        address: productData.location,
        city: productData.city || '',
        phone: productData.telephone,
        categoryId: productData.category_id,
        subcategoryId: productData.subcategory_id,
        zipcode: productData.zipCode,
        latitude: productData.latitude,
        longitude: productData.longitude
      });
      
      const response = await axios.post(`${API_URL}/products`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log response for debug
      console.log('Réponse API:', response.data);
      
      // If everything is fine, show success screen
      setShowSuccessPage(true);
      setPublishedProductId(response.data.data.id);
      
    } catch (error: any) {
      console.error('Erreur soumission produit:', error);
      
      // Show specific error message if possible
      let errorMessage = 'Une erreur est survenue lors de la publication de votre annonce.';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Get first validation error
          console.log('Erreurs de validation:', JSON.stringify(error.response.data.errors));
          const firstError = Object.values(error.response.data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
          
          // Gérer spécifiquement l'erreur de sous-catégorie invalide
          if (error.response.data.errors.subcategoryId) {
            console.log('Erreur de sous-catégorie détectée, tentative de correction...');
            
            // Option 1: Essayer à nouveau sans sous-catégorie
            Alert.alert(
              'Erreur de sous-catégorie',
              'La sous-catégorie sélectionnée semble invalide. Voulez-vous réessayer sans sous-catégorie?',
              [
                {
                  text: 'Oui, publier sans sous-catégorie',
                  onPress: async () => {
                    try {
                      setIsLoading(true);
                      
                      // Créer un nouveau FormData sans la sous-catégorie
                      const newFormData = new FormData();
                      
                      // Recréer un FormData sans la sous-catégorie
                      newFormData.append('title', productData.title);
                      newFormData.append('description', productData.description);
                      newFormData.append('price', productData.price);
                      newFormData.append('condition', productData.condition);
                      newFormData.append('address', productData.location);
                      newFormData.append('city', productData.city || '');
                      newFormData.append('phone', productData.telephone);
                      newFormData.append('hide_phone', productData.hide_phone ? '1' : '0');
                      
                      // Inclure seulement categoryId, pas subcategoryId
                      if (productData.category_id) {
                        newFormData.append('categoryId', productData.category_id.toString());
                        console.log('Envoi avec uniquement categoryId =', productData.category_id);
                      }
                      
                      // Conserver le reste des données
                      if (productData.zipCode) {
                        newFormData.append('zipcode', productData.zipCode);
                      }
                      
                      if (productData.brand) {
                        newFormData.append('brand', productData.brand);
                      }
                      
                      if (productData.latitude !== undefined && productData.latitude !== null) {
                        newFormData.append('latitude', productData.latitude.toString());
                      }
                      
                      if (productData.longitude !== undefined && productData.longitude !== null) {
                        newFormData.append('longitude', productData.longitude.toString());
                      }
                      
                      // Ajouter les images
                      for (let i = 0; i < productData.images.length; i++) {
                        const imgFile = productData.images[i];
                        newFormData.append('images[]', {
                          uri: imgFile.uri,
                          type: imgFile.type || 'image/jpeg',
                          name: imgFile.name || `image_${i}.jpg`
                        } as any);
                      }
                      
                      // Obtenir le token d'authentification
                      const token = await AsyncStorage.getItem('token');
                      
                      if (!token) {
                        throw new Error('Non authentifié');
                      }
                      
                      console.log('Tentative de publication sans sous-catégorie...');
                      const newResponse = await axios.post(`${API_URL}/products`, newFormData, {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      console.log('Réponse API (seconde tentative):', newResponse.data);
                      setShowSuccessPage(true);
                      setPublishedProductId(newResponse.data.data.id);
                    } catch (retryError) {
                      console.error('Erreur lors de la seconde tentative:', retryError);
                      Alert.alert(
                        'Erreur',
                        'La publication a échoué. Veuillez réessayer plus tard ou contacter le support.'
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }
                },
                {
                  text: 'Annuler',
                  style: 'cancel'
                }
              ]
            );
            return;
          }
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const product = response.data.data;
      
      setProductData({
        title: product.title || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        condition: product.condition || '',
        size: product.size || '',
        color: product.color || '',
        warranty: product.warranty || '',
        category_id: product.category_id || null,
        subcategory_id: product.subcategory_id || null,
        location: product.city ? `${product.city}, ${product.zipCode}` : '',
        telephone: product.phone || '',
        hide_phone: product.hide_phone || false,
        images: product.images?.map((img: any) => ({
          uri: `${API_URL}/storage/${img.path}`,
          type: 'image/jpeg',
          name: 'photo.jpg'
        })) || [],
        user_id: product.user_id || null,
        zipCode: product.zipCode || '',
        brand: product.brand || null,
        is_professional: product.is_professional || false,
        city: product.city || '',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du produit');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to display a selection modal
  const showSelectionModal = () => {
    // List of options based on modal type
    let options: { id: string | number; label: string }[] = [];
    let title = '';

    switch (modalVisible) {
      case 'condition':
        options = CONDITIONS;
        title = 'Sélectionnez un état';
        break;
      case 'warranty':
        options = WARRANTIES;
        title = 'Sélectionnez une garantie';
        break;
      case 'category':
        options = categories && Array.isArray(categories) 
          ? categories.map(c => ({ id: c.id, label: c.name }))
          : [];
        title = 'Sélectionnez une catégorie';
        break;
      case 'subcategory':
        const selectedCategory = categories && Array.isArray(categories) 
          ? categories.find(c => c.id === productData.category_id)
          : undefined;
        options = selectedCategory && selectedCategory.subcategories 
          ? selectedCategory.subcategories.map(sc => ({ id: sc.id, label: sc.name })) 
          : [];
        title = 'Sélectionnez une sous-catégorie';
        break;
      case 'brand':
        options = BRANDS.map(b => ({ id: b.id, label: b.name }));
        title = 'Sélectionnez une marque';
        break;
      case 'size':
        options = [
          { id: 'xs', label: 'XS' },
          { id: 's', label: 'S' },
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L' },
          { id: 'xl', label: 'XL' },
          { id: 'xxl', label: 'XXL' },
        ];
        title = 'Sélectionnez une taille';
        break;
      case 'color':
        options = [
          { id: 'noir', label: 'Noir' },
          { id: 'blanc', label: 'Blanc' },
          { id: 'rouge', label: 'Rouge' },
          { id: 'bleu', label: 'Bleu' },
          { id: 'vert', label: 'Vert' },
          { id: 'jaune', label: 'Jaune' },
          { id: 'orange', label: 'Orange' },
          { id: 'violet', label: 'Violet' },
          { id: 'rose', label: 'Rose' },
          { id: 'marron', label: 'Marron' },
          { id: 'gris', label: 'Gris' },
          { id: 'autre', label: 'Autre' },
        ];
        title = 'Sélectionnez une couleur';
        break;
    }

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!modalVisible}
        onRequestClose={() => setModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelect(modalVisible || '', item.id.toString(), item.label)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Divider />}
              style={styles.modalList}
            />
            <Button
              mode="text"
              onPress={() => setModalVisible(null)}
              style={styles.modalCancelButton}
            >
              Annuler
            </Button>
          </View>
        </View>
      </Modal>
    );
  };

  // Function to select an item and close the modal
  const handleSelect = (type: string, value: string, label: string) => {
    switch (type) {
      case 'condition':
        setProductData(prev => ({ ...prev, condition: value }));
        setErrors(prev => ({ ...prev, condition: '' }));
        break;
      case 'warranty':
        setProductData(prev => ({ ...prev, warranty: value }));
        break;
      case 'category':
        const category = categories.find(c => c.id === parseInt(value));
        setProductData(prev => ({ 
          ...prev, 
          category_id: category ? category.id : null,
          subcategory_id: null // Reset subcategory
        }));
        break;
      case 'subcategory':
        // Vérifier que la sous-catégorie existe pour la catégorie actuelle
        const subcategoryId = parseInt(value);
        
        // Vérifier que la sous-catégorie appartient à la catégorie sélectionnée
        const parentCategory = categories.find(c => c.id === productData.category_id);
        const isValidSubcategory = parentCategory?.subcategories?.some(sc => sc.id === subcategoryId);
        
        if (isValidSubcategory) {
          console.log(`Sous-catégorie valide: ID=${subcategoryId}, pour catégorie=${productData.category_id}`);
          setProductData(prev => ({ ...prev, subcategory_id: subcategoryId }));
          
          // Supprimer toute erreur existante
          if (errors.subcategory) {
            setErrors(prev => ({ ...prev, subcategory: '' }));
          }
        } else {
          console.log(`Sous-catégorie invalide: ID=${subcategoryId} pour catégorie=${productData.category_id}`);
          Alert.alert('Erreur', 'Sous-catégorie invalide pour cette catégorie.');
        }
        break;
      case 'size':
        setProductData(prev => ({ ...prev, size: label }));
        break;
      case 'color':
        setProductData(prev => ({ ...prev, color: label }));
        break;
      case 'brand':
        setProductData(prev => ({ ...prev, brand: label }));
        break;
    }
    setModalVisible(null);
  };

  const handleAddressSelect = (address: any) => {
    console.log('Adresse sélectionnée dans AjouterProduitScreen:', address);
    
    // Verify that all necessary data is present
    if (!address) return;
    
    // Create full address from street and city
    const fullAddress = `${address.street || ''} ${address.city || ''}`.trim();
    
    // Update product data
    setProductData(prev => ({
      ...prev,
      location: fullAddress,
      zipCode: address.postalCode || prev.zipCode || '',
      city: address.city || '',
      // Ensure coordinates are included in product data
      latitude: address.latitude || null,
      longitude: address.longitude || null
    }));
    
    // Reset location error if it exists
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
    
    console.log('Données du produit mises à jour avec les coordonnées:', 
      { location: fullAddress, lat: address.latitude, lng: address.longitude });
  };

  const renderPhotoStep = () => (
    <View style={styles.pageContainer}>
      <Text style={styles.stepTitle}>Ajoutez des photos</Text>
      <Text style={styles.stepDescription}>
        Des photos de qualité augmentent vos chances de vendre rapidement. 
        Vous devez ajouter au minimum 2 photos et maximum 5 images.
      </Text>
      
      <View style={styles.photosGrid}>
        {productData.images.map((image, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: image.uri }} style={styles.photoPreview} />
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        
        {productData.images.length < 5 && (
          <TouchableOpacity 
            style={styles.addPhotoButton} 
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={40} color="colors.GRAY_MEDIUM" />
            <Text style={styles.addPhotoText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
      {productData.images.length < 2 && (
        <Text style={styles.warningText}>
          Vous devez ajouter au moins 2 photos pour publier votre annonce.
        </Text>
      )}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.pageContainer}>
      <Text style={styles.stepTitle}>Où se situe votre bien</Text>
      <Text style={styles.stepDescription}>
        Indiquez l'adresse et vos coordonnées. Votre adresse personnelle restera confidentielle.
      </Text>
      
      <View style={styles.mapPreview}>
        {/* Ici, vous pourriez intégrer une véritable carte */}
        <View style={styles.mapPlaceholder}>
          <Text>Carte de localisation</Text>
        </View>
      </View>
      
      <Text style={styles.inputLabel}>Adresse</Text>
      <AddressAutocomplete
        onSelect={handleAddressSelect}
        placeholder="Entrez votre adresse"
        style={styles.addressAutocomplete}
      />
      <Text style={styles.inputHint}>
        Format recommandé: Rue, Ville
      </Text>
      {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      
      <Text style={styles.inputLabel}>Code postal</Text>
      <TextInput
        style={styles.input}
        placeholder="Code postal"
        keyboardType="number-pad"
        value={productData.zipCode}
        onChangeText={(text) => {
          // Keep only digits and limit to 5
          const postalCode = text.replace(/[^0-9]/g, '').slice(0, 5);
          setProductData(prev => ({ ...prev, zipCode: postalCode }));
        }}
        maxLength={5}
      />
      {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
      
      <Text style={styles.inputLabel}>Téléphone</Text>
      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone (10 chiffres)"
        keyboardType="phone-pad"
        value={productData.telephone}
        onChangeText={(text) => {
          // Keep only digits and limit to 10
          const phoneNumber = text.replace(/[^0-9]/g, '').slice(0, 10);
          setProductData(prev => ({ ...prev, telephone: phoneNumber }));
        }}
        maxLength={10}
      />
      {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Masquer mon numéro</Text>
        <Switch
          value={productData.hide_phone}
          onValueChange={(value) => setProductData(prev => ({ ...prev, hide_phone: value }))}
        />
      </View>
      
      {locationPermission === false && (
        <Text style={styles.warningText}>
          Vous n'avez pas autorisé l'accès à votre localisation. 
          Vous pouvez modifier ce paramètre dans les réglages de votre appareil.
        </Text>
      )}
      
      <View style={styles.termsContainer}>
        <TouchableOpacity 
          style={styles.termsCheckboxContainer}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[
            styles.termsCheckbox,
            termsAccepted && styles.termsCheckboxChecked
          ]}>
            {termsAccepted && (
              <Ionicons name="checkmark" size={20} color="colors.BACKGROUND_MAIN" />
            )}
          </View>
          <Text style={[
            styles.termsText,
            !termsAccepted && styles.termsTextRequired
          ]}>
            J'accepte les conditions générales d'utilisation et les règles de diffusion du site Showroombaby.com et autorise Showroombaby à diffuser mon annonce.
          </Text>
        </TouchableOpacity>
      </View>
      {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case Step.INFOS_BASE:
        return renderInfosBaseStep();
      case Step.DESCRIPTION_PRIX:
        return renderDescriptionPrixStep();
      case Step.CONDITION:
        return renderConditionStep();
      case Step.PHOTOS:
        return renderPhotoStep();
      case Step.LOCATION:
        return renderLocationStep();
      default:
        return null;
    }
  };

  // Fonction pour filtrer les marques
  const filterBrands = (text: string) => {
    setBrandInput(text);
    if (text.length > 0) {
      const filtered = BRANDS.filter(brand => 
        brand.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredBrands(filtered);
      setShowBrandSuggestions(true);
    } else {
      setFilteredBrands([]);
      setShowBrandSuggestions(false);
    }
  };

  // Fonction pour sélectionner une marque
  const selectBrand = (brand: string) => {
    setProductData(prev => ({ ...prev, brand }));
    setBrandInput(brand);
    setShowBrandSuggestions(false);
  };

  // Create new step for base information
  const renderInfosBaseStep = () => {
    return (
      <View style={styles.pageContainer}>
        <Text style={styles.stepTitle}>Informations du produit</Text>
        <Text style={styles.stepDescription}>
          Commencez par renseigner les informations essentielles de votre produit.
        </Text>
        
        <Text style={styles.inputLabel}>Titre de votre annonce</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre de votre annonce"
          value={productData.title}
          onChangeText={(text) => setProductData(prev => ({ ...prev, title: text }))}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        
        <Text style={styles.inputLabel}>Catégorie principale</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible('category')}
        >
          <Text style={productData.category_id ? styles.selectText : styles.selectPlaceholder}>
            {productData.category_id ? 
              categories.find(c => c.id === productData.category_id)?.name || 'Sélectionnez une catégorie' : 
              'Sélectionnez une catégorie'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
        </TouchableOpacity>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        
        {productData.category_id && (
          <>
            <Text style={styles.inputLabel}>Sous-catégorie</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setModalVisible('subcategory')}
            >
              <Text style={productData.subcategory_id ? styles.selectText : styles.selectPlaceholder}>
                {productData.subcategory_id ? 
                  categories.find(c => c.id === productData.category_id)?.subcategories?.find(sc => sc.id === productData.subcategory_id)?.name || 'Sélectionnez une sous-catégorie' : 
                  'Sélectionnez une sous-catégorie'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
            </TouchableOpacity>
          </>
        )}
        
        <Text style={styles.inputLabel}>Marque</Text>
        <View style={styles.brandInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez une marque"
            value={brandInput}
            onChangeText={filterBrands}
            onFocus={() => setShowBrandSuggestions(true)}
          />
          {showBrandSuggestions && filteredBrands.length > 0 && (
            <View style={styles.brandSuggestionsContainer}>
              <ScrollView style={styles.brandSuggestionsList}>
                {filteredBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={styles.brandSuggestionItem}
                    onPress={() => selectBrand(brand.name)}
                  >
                    <Text style={styles.brandSuggestionText}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Description and price step
  const renderDescriptionPrixStep = () => {
    return (
      <View style={styles.pageContainer}>
        <Text style={styles.stepTitle}>Description et prix</Text>
        <Text style={styles.stepDescription}>
          Donnez plus de détails sur votre produit pour aider les acheteurs à mieux le comprendre.
        </Text>
        
        <Text style={styles.inputLabel}>Prix (€)</Text>
        <TextInput
          style={styles.input}
          placeholder="Prix"
          keyboardType="numeric"
          value={productData.price}
          onChangeText={(text) => {
            // Ne garder que les chiffres et le point décimal
            const numericValue = text.replace(/[^0-9.]/g, '');
            // S'assurer qu'il n'y a qu'un seul point décimal
            const parts = numericValue.split('.');
            if (parts.length > 2) {
              const formattedValue = parts[0] + '.' + parts.slice(1).join('');
              setProductData(prev => ({ ...prev, price: formattedValue }));
            } else {
              setProductData(prev => ({ ...prev, price: numericValue }));
            }
          }}
        />
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        
        <Text style={styles.inputLabel}>Description du produit</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez votre produit en détail"
          multiline
          numberOfLines={4}
          value={productData.description}
          onChangeText={(text) => setProductData(prev => ({ ...prev, description: text }))}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>
    );
  };

  const renderConditionSelector = () => {
    return (
      <View style={styles.conditionSelectorContainer}>
        <Text style={styles.inputLabel}>État du produit</Text>
        <TouchableOpacity
          style={[
            styles.selectButton, 
            errors.condition ? styles.inputError : null,
            !productData.condition ? styles.highlightedButton : styles.selectedButton
          ]}
          onPress={() => setModalVisible('condition')}
        >
          <Text style={productData.condition ? styles.selectText : styles.selectPlaceholder}>
            {productData.condition ? 
              CONDITIONS.find(c => c.id === productData.condition)?.label || 'État du produit' : 
              'État du produit (obligatoire)'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
        </TouchableOpacity>
        {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
        {productData.condition && (
          <Text style={styles.successText}>
            État sélectionné avec succès. Cliquez sur "Continuer" pour passer à l'étape suivante.
          </Text>
        )}
      </View>
    );
  };

  // Condition step, warranty, condition
  const renderConditionStep = () => {
    return (
      <View style={styles.pageContainer}>
        <Text style={styles.stepTitle}>État du produit</Text>
        <Text style={styles.stepDescription}>
          Cette information aidera les acheteurs à connaître l'état de votre produit.
        </Text>
        
        {renderConditionSelector()}
        
        <Text style={styles.helpText}>
          Sélectionnez l'état de votre produit et appuyez sur "Continuer" pour passer à l'étape suivante.
        </Text>
      </View>
    );
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case Step.INFOS_BASE:
        return 'Continuer';
      case Step.DESCRIPTION_PRIX:
        return 'Continuer';
      case Step.CONDITION:
        return 'Continuer';
      case Step.PHOTOS:
        return 'Continuer';
      case Step.LOCATION:
        return productId ? 'Modifier l\'annonce' : 'Publier mon annonce';
      default:
        return 'Continuer';
    }
  };

  // New component for confirmation page
  const renderSuccessPage = () => {
    const handleViewProduct = () => {
      if (isNavigating) return;
      setIsNavigating(true);
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: 'ProductDetails', 
            params: { 
              productId: publishedProductId,
              fromSuccess: true // Ajouter ce paramètre
            }
          }
        ],
      });
    };

    const handleGoHome = () => {
      if (isNavigating) return;
      setIsNavigating(true);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    };

    return (
      <View style={styles.successPageContainer}>
        <TouchableOpacity 
          style={styles.closeSuccessButton}
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.TEXT_PRIMARY} />
        </TouchableOpacity>

        <View style={styles.successIconContainer}>
          <AntDesign name="checkcircle" size={80} color="colors.SUCCESS" />
        </View>
        <Text style={styles.successTitle}>Félicitations !</Text>
        <Text style={styles.successMessage}>Votre annonce a été publiée avec succès.</Text>
        <Text style={styles.successDescription}>
          Votre produit est maintenant visible pour tous les utilisateurs de Showroombaby.
        </Text>
        
        <View style={styles.successButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.successButton, 
              styles.viewProductButton,
              isNavigating && styles.disabledButton
            ]}
            onPress={handleViewProduct}
            disabled={isNavigating}
            activeOpacity={0.7}
          >
            <Text style={styles.viewProductButtonText}>
              {isNavigating ? 'Chargement...' : 'Voir mon produit'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.successButton, 
              styles.goHomeButton,
              isNavigating && styles.disabledButton
            ]}
            onPress={handleGoHome}
            disabled={isNavigating}
            activeOpacity={0.7}
          >
            <Text style={styles.goHomeButtonText}>
              {isNavigating ? 'Chargement...' : 'Retour à l\'accueil'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // If success page is visible, display only this page
  if (showSuccessPage) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        {renderSuccessPage()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.TEXT_PRIMARY} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {productId ? 'Modifier l\'annonce' : 
          currentStep === Step.INFOS_BASE ? 'Informations produit' :
          currentStep === Step.DESCRIPTION_PRIX ? 'Description et prix' :
          currentStep === Step.CONDITION ? 'État du produit' :
          currentStep === Step.PHOTOS ? 'Photos du produit' :
          'Localisation et contact'}
        </Text>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClosePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressIndicator, 
            { width: `${(currentStep + 1) * 20}%` }
          ]} 
        />
      </View>

      <View style={styles.stepIndicatorContainer}>
        {Object.values(Step)
          .filter(step => typeof step === 'number')
          .map((step, index) => (
            <View 
              key={index} 
              style={[
                styles.stepIndicator, 
                currentStep >= step && styles.activeStepIndicator
              ]} 
            />
          ))}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.primaryButton,
              isLoading && styles.disabledButton
            ]} 
            onPress={currentStep === Step.LOCATION ? submitProduct : handleNext}
            disabled={isLoading}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.buttonText}>
              {getButtonLabel()}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showSelectionModal()}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="colors.PRIMARY_DARK" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.GRAY_BACKGROUND',
    backgroundColor: colors.BACKGROUND_MAIN,
    elevation: 2,
    shadowColor: 'colors.TEXT_DARK',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'colors.TEXT_DARK',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  stepContainer: {
    backgroundColor: 'colors.BACKGROUND_MAIN',
    marginBottom: 16,
  },
  pageContainer: {
    backgroundColor: 'colors.BACKGROUND_MAIN',
    marginBottom: 16,
    paddingVertical: 10,
    minHeight: '70%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.TEXT_PRIMARY,
  },
  stepDescription: {
    fontSize: 16,
    color: 'colors.TEXT_SECONDARY',
    marginBottom: 24,
    lineHeight: 22,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  photoContainer: {
    width: '33%',
    aspectRatio: 1,
    padding: 8,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'colors.OVERLAY_DARK',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: '33%',
    aspectRatio: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  addPhotoText: {
    color: 'colors.GRAY_MEDIUM',
    marginTop: 4,
  },
  mapPreview: {
    width: '100%',
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'colors.BACKGROUND_GRAY',
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'colors.GRAY_BACKGROUND',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: 'colors.TEXT_PRIMARY',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
  },
  dropdown: {
    position: 'relative',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  errorText: {
    color: 'colors.BORDER_ERROR',
    fontSize: 12,
    marginTop: 4,
  },
  termsContainer: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'colors.PRIMARY_DARK',
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'colors.PRIMARY_DARK',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'colors.BACKGROUND_MAIN',
  },
  termsCheckboxChecked: {
    backgroundColor: 'colors.PRIMARY_DARK',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: 'colors.TEXT_PRIMARY',
    lineHeight: 20,
  },
  termsTextRequired: {
    color: 'colors.PRIMARY_DARK',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: 'colors.TEXT_DARK',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    transform: [{ scale: 1 }], // Pour l'animation
  },
  primaryButton: {
    backgroundColor: 'colors.PRIMARY_DARK',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'colors.BACKGROUND_MAIN',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'colors.WHITE_TRANSPARENT_MEDIUM',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'colors.OVERLAY_DARK',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: 'colors.TEXT_PRIMARY',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.GRAY_BACKGROUND',
  },
  modalItemText: {
    fontSize: 16,
    color: 'colors.TEXT_PRIMARY',
  },
  modalCancelButton: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: 'colors.BACKGROUND_GRAY',
    color: 'colors.ICON_DARK',
  },
  inputHint: {
    fontSize: 12,
    color: 'colors.TEXT_LIGHT',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 14,
    color: 'colors.PRIMARY_DARK',
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'colors.PRIMARY_DARK',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'colors.GRAY_BACKGROUND',
    marginBottom: 16,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: 'colors.PRIMARY_DARK',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'colors.BORDER_DARK',
    marginHorizontal: 4,
  },
  activeStepIndicator: {
    backgroundColor: 'colors.PRIMARY_DARK',
    width: 24,
  },
  successPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'colors.BACKGROUND_MAIN',
  },
  successIconContainer: {
    marginBottom: 25,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'colors.TEXT_PRIMARY',
  },
  successMessage: {
    fontSize: 18,
    color: 'colors.GRAY_DARK',
    marginBottom: 20,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: 'colors.TEXT_LIGHT',
    textAlign: 'center',
    marginBottom: 30,
  },
  successButtonsContainer: {
    width: '100%',
    marginTop: 10,
  },
  successButton: {
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  viewProductButton: {
    backgroundColor: 'colors.PRIMARY_DARK',
  },
  viewProductButtonText: {
    color: 'colors.BACKGROUND_MAIN',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goHomeButton: {
    backgroundColor: '#f1f1f1',
  },
  goHomeButtonText: {
    color: 'colors.TEXT_PRIMARY',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressAutocomplete: {
    marginBottom: 8,
    zIndex: 1000,
  },
  stepContent: {
    padding: 16,
    backgroundColor: 'colors.BACKGROUND_MAIN',
  },
  selectButton: {
    position: 'relative',
  },
  selectText: {
    fontSize: 16,
    color: 'colors.TEXT_PRIMARY',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: 'colors.TEXT_MUTED',
  },
  inputError: {
    borderColor: 'colors.BORDER_ERROR',
  },
  helpText: {
    fontSize: 14,
    color: 'colors.TEXT_LIGHT',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'colors.GRAY_LIGHT',
  },
  disabledButtonText: {
    color: 'colors.ICON_DARK',
  },
  conditionSelectorContainer: {
    marginBottom: 16,
  },
  highlightedButton: {
    backgroundColor: 'colors.BORDER_LIGHT',
  },
  selectedButton: {
    backgroundColor: 'colors.BORDER_LIGHT',
  },
  successText: {
    fontSize: 14,
    color: 'colors.SUCCESS',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  brandInputContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  brandSuggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
    maxHeight: 200,
    elevation: 3,
    shadowColor: 'colors.TEXT_DARK',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  brandSuggestionsList: {
    maxHeight: 200,
  },
  brandSuggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.GRAY_BACKGROUND',
  },
  brandSuggestionText: {
    fontSize: 16,
    color: 'colors.TEXT_PRIMARY',
  },
  closeSuccessButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    padding: 10,
    zIndex: 1000,
  },
}); 