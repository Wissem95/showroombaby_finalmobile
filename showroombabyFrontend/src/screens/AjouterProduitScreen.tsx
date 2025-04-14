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

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.2:8000'  // Adresse IP locale de l'utilisateur
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
}

enum Step {
  INFOS_BASE = 0,
  DESCRIPTION_PRIX = 1,
  FACTURE_GARANTIE = 2,
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
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [modalVisible, setModalVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<number | null>(null);

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
          <Ionicons name="close" size={24} color="#000" />
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
        const response = await axios.get(`${API_URL}/api/users/profile`, {
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status === 'granted') {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
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

  const validateStep = React.useCallback(() => {
    const newErrors = {} as Record<string, string>;
    
    switch (currentStep) {
      case Step.INFOS_BASE:
        if (!productData.title) {
          newErrors.title = 'Veuillez saisir un titre.';
        }
        if (!productData.category_id) {
          newErrors.category = 'Veuillez sélectionner une catégorie.';
        }
        break;
      case Step.DESCRIPTION_PRIX:
        if (!productData.description) {
          newErrors.description = 'Veuillez saisir une description.';
        }
        if (!productData.price) {
          newErrors.price = 'Veuillez saisir un prix.';
        } else if (isNaN(parseFloat(productData.price))) {
          newErrors.price = 'Le prix doit être un nombre.';
        }
        break;
      case Step.FACTURE_GARANTIE:
        if (!productData.condition) {
          newErrors.condition = 'Veuillez sélectionner un état.';
        }
        break;
      case Step.PHOTOS:
        if (!productData.images || productData.images.length === 0) {
          newErrors.images = 'Veuillez ajouter au moins une photo.';
        }
        break;
      case Step.LOCATION:
        if (!productData.location) {
          newErrors.location = 'Veuillez saisir une adresse.';
        }
        if (!productData.zipCode) {
          newErrors.zipCode = 'Veuillez saisir un code postal.';
        } else if (!/^\d{5}$/.test(productData.zipCode)) {
          newErrors.zipCode = 'Le code postal doit contenir 5 chiffres.';
        }
        if (!productData.telephone) {
          newErrors.telephone = 'Veuillez saisir un numéro de téléphone.';
        } else if (!/^\d{10}$/.test(productData.telephone)) {
          newErrors.telephone = 'Le numéro de téléphone doit contenir 10 chiffres.';
        }
        if (!termsAccepted) {
          newErrors.terms = 'Veuillez accepter les conditions générales.';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, productData, termsAccepted]);

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < Step.LOCATION) {
        setCurrentStep(currentStep + 1);
      } else {
        submitProduct();
      }
    }
  };

  const submitProduct = async () => {
    if (!validateStep()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs avant de continuer.');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour publier une annonce.');
        navigation.navigate('Auth');
        return;
      }

      const formData = new FormData();
      
      // Ajout des données du produit
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('condition', productData.condition);
      
      if (productData.size) {
        formData.append('size', productData.size);
      }
      
      if (productData.color) {
        formData.append('color', productData.color);
      }
      
      if (productData.warranty) {
        formData.append('warranty', productData.warranty);
      }
      
      if (productData.category_id) {
        formData.append('category_id', productData.category_id.toString());
      }
      
      if (productData.subcategory_id) {
        formData.append('subcategory_id', productData.subcategory_id.toString());
      }
      
      formData.append('address', productData.location);
      
      // Extraire la ville à partir de l'adresse
      const locationParts = productData.location.split(',');
      const city = locationParts[0]?.trim() || 'Paris';
      
      formData.append('city', city);
      formData.append('zipCode', productData.zipCode);
      formData.append('phone', productData.telephone);
      formData.append('hide_phone', productData.hide_phone ? '1' : '0');
      formData.append('is_professional', productData.is_professional ? '1' : '0');
      
      // Ajout de la marque si elle est définie
      if (productData.brand) {
        formData.append('brand', productData.brand);
      }

      // Ajout des images
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach((image, index) => {
          if (!image.uri.includes(API_URL)) {
            const uri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
            formData.append(`images[${index}]`, {
              uri: uri,
              type: 'image/jpeg',
              name: `image_${index}.jpg`
            } as any);
          }
        });
      }

      let response;
      if (productId) {
        // Mise à jour d'un produit existant
        response = await axios.post(`${API_URL}/api/products/${productId}`, formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Création d'un nouveau produit
        response = await axios.post(`${API_URL}/api/products`, formData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      }

      console.log('Réponse du serveur:', response.data);

      if (response.data && (response.data.id || (response.data.data && response.data.data.id))) {
        const responseProductId = response.data.id || response.data.data.id;
        setPublishedProductId(responseProductId);
        setShowSuccessPage(true);
      } else {
        throw new Error('Réponse invalide du serveur');
      }

    } catch (error: any) {
      console.error('Erreur complète:', error);
      
      let message = 'Une erreur est survenue lors de la publication.';
      
      if (error.response) {
        console.error('Erreur de réponse:', error.response.data);
        const errors = error.response.data.errors;
        if (errors) {
          message = Object.values(errors).flat().join('\n');
        } else {
          message = error.response.data.message || error.response.data.error || message;
        }
      } else if (error.request) {
        console.error('Erreur de requête:', error.request);
        message = 'Impossible de contacter le serveur';
      } else {
        console.error('Erreur:', error.message);
        message = error.message;
      }
      
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/products/${productId}`, {
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
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du produit');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour afficher une modale de sélection
  const showSelectionModal = () => {
    // Liste des options selon le type de modale
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

  // Fonction pour sélectionner un élément et fermer la modale
  const handleSelect = (type: string, value: string, label: string) => {
    switch (type) {
      case 'condition':
        setProductData(prev => ({ ...prev, condition: value }));
        break;
      case 'warranty':
        setProductData(prev => ({ ...prev, warranty: value }));
        break;
      case 'category':
        const category = categories.find(c => c.id === parseInt(value));
        setProductData(prev => ({ 
          ...prev, 
          category_id: category ? category.id : null,
          subcategory_id: null // Réinitialiser la sous-catégorie
        }));
        break;
      case 'subcategory':
        setProductData(prev => ({ ...prev, subcategory_id: parseInt(value) }));
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
    setProductData(prev => ({
      ...prev,
      location: `${address.street || ''} ${address.city || ''}`.trim(),
      zipCode: address.postalCode || prev.zipCode || '',
      city: address.city || '',
      latitude: address.latitude,
      longitude: address.longitude
    }));
  };

  const renderPhotoStep = () => (
    <View style={styles.pageContainer}>
      <Text style={styles.stepTitle}>Ajoutez des photos</Text>
      <Text style={styles.stepDescription}>
        Des photos de qualité augmentent vos chances de vendre rapidement. Ajoutez jusqu'à 5 images.
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
          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={40} color="#888" />
            <Text style={styles.addPhotoText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
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
          // Ne garder que les chiffres et limiter à 5
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
          // Ne garder que les chiffres et limiter à 10
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
        <Checkbox
          status={termsAccepted ? 'checked' : 'unchecked'}
          onPress={() => setTermsAccepted(!termsAccepted)}
        />
        <Text style={styles.termsText}>
          J'accepte les conditions générales d'utilisation et les règles de diffusion du site Showroombaby.com et autorise Showroombaby à diffuser mon annonce.
        </Text>
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
      case Step.FACTURE_GARANTIE:
        return renderFactureGarantieStep();
      case Step.PHOTOS:
        return renderPhotoStep();
      case Step.LOCATION:
        return renderLocationStep();
      default:
        return null;
    }
  };

  // Création de la nouvelle étape pour les informations de base
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
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
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
              <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
            </TouchableOpacity>
          </>
        )}
        
        <Text style={styles.inputLabel}>Marque</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible('brand')}
        >
          <Text style={productData.brand ? styles.selectText : styles.selectPlaceholder}>
            {productData.brand ? productData.brand : 'Sélectionnez une marque (optionnel)'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  // Étape de description et prix
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
          onChangeText={(text) => setProductData(prev => ({ ...prev, price: text }))}
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

  // Étape facture, garantie, état
  const renderFactureGarantieStep = () => {
    return (
      <View style={styles.pageContainer}>
        <Text style={styles.stepTitle}>Détails supplémentaires</Text>
        <Text style={styles.stepDescription}>
          Ces informations aideront les acheteurs à connaître l'état et les garanties de votre produit.
        </Text>
        
        <Text style={styles.inputLabel}>Facture d'achat</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {/* Action pour facture */}}
        >
          <Text style={styles.selectPlaceholder}>Veuillez choisir...</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
        
        <Text style={styles.inputLabel}>Envoi possible</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {/* Action pour envoi */}}
        >
          <Text style={styles.selectPlaceholder}>Veuillez choisir...</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
        
        <Text style={styles.inputLabel}>Garantie</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible('warranty')}
        >
          <Text style={productData.warranty ? styles.selectText : styles.selectPlaceholder}>
            {productData.warranty ? 
              WARRANTIES.find(w => w.id === productData.warranty)?.label || 'Sélectionnez une garantie' : 
              'Veuillez choisir...'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
        
        <Text style={styles.inputLabel}>État du produit</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible('condition')}
        >
          <Text style={productData.condition ? styles.selectText : styles.selectPlaceholder}>
            {productData.condition ? 
              CONDITIONS.find(c => c.id === productData.condition)?.label || 'Sélectionnez un état' : 
              'État du produit'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
        </TouchableOpacity>
        {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
      </View>
    );
  };

  const getButtonLabel = () => {
    if (currentStep === Step.LOCATION) {
      return productId ? 'Modifier l\'annonce' : 'Publier mon annonce';
    }
    return 'Continuer';
  };

  // Nouveau composant pour la page de confirmation
  const renderSuccessPage = () => (
    <View style={styles.successPageContainer}>
      <View style={styles.successIconContainer}>
        <AntDesign name="checkcircle" size={80} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>Félicitations !</Text>
      <Text style={styles.successMessage}>Votre annonce a été publiée avec succès.</Text>
      <Text style={styles.successDescription}>
        Votre produit est maintenant visible pour tous les utilisateurs de Showroombaby.
      </Text>
      
      <View style={styles.successButtonsContainer}>
        <TouchableOpacity
          style={[styles.successButton, styles.viewProductButton]}
          onPress={() => {
            navigation.navigate('ProductDetails', { productId: publishedProductId, fullscreenMode: true });
          }}
        >
          <Text style={styles.viewProductButtonText}>Voir mon produit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.successButton, styles.goHomeButton]}
          onPress={() => {
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.goHomeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Si la page de succès est visible, afficher uniquement cette page
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
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {productId ? 'Modifier l\'annonce' : 
          currentStep === Step.INFOS_BASE ? 'Informations produit' :
          currentStep === Step.DESCRIPTION_PRIX ? 'Description et prix' :
          currentStep === Step.FACTURE_GARANTIE ? 'État et garantie' :
          currentStep === Step.PHOTOS ? 'Photos du produit' :
          'Localisation et contact'}
        </Text>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
          <Ionicons name="close" size={24} color="#333" />
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
          {currentStep > 0 && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleBackPress}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={currentStep === Step.LOCATION ? submitProduct : handleNext}
            disabled={isLoading}
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
          <ActivityIndicator size="large" color="#E75A7C" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
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
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  stepContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pageContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 10,
    minHeight: '70%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
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
    borderColor: '#ddd',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  addPhotoText: {
    color: '#888',
    marginTop: 4,
  },
  mapPreview: {
    width: '100%',
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    color: '#333',
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
    color: '#E75A7C',
    marginTop: 4,
    fontSize: 14,
  },
  termsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'flex-start',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  primaryButton: {
    backgroundColor: '#E75A7C',
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#333',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCancelButton: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#aaa',
  },
  inputHint: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 13,
    color: '#ff9500',
    marginTop: 8,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#FFF9EC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#E75A7C',
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
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeStepIndicator: {
    backgroundColor: '#E75A7C',
    width: 24,
  },
  successPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  successIconContainer: {
    marginBottom: 25,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  successMessage: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: '#777',
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
    backgroundColor: '#E75A7C',
  },
  viewProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goHomeButton: {
    backgroundColor: '#f1f1f1',
  },
  goHomeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressAutocomplete: {
    marginBottom: 8,
    zIndex: 1000,
  },
  stepContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  selectButton: {
    position: 'relative',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
}); 