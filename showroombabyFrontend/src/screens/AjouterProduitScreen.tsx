import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Button, Card, Checkbox, Divider, HelperText, Searchbar } from 'react-native-paper';
import { Ionicons, MaterialIcons, Entypo, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

type Category = {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
};

type ProductData = {
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
  images: any[];
  user_id: number | null;
};

enum Step {
  PHOTOS = 0,
  LOCATION = 1,
  CHARACTERISTICS = 2,
  DETAILS = 3,
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

export default function AjouterProduitScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState<Step>(Step.PHOTOS);
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
    fetchCategories();
    checkPermissions();
    getUserInfo();
  }, []);

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Ajouter un délai artificiel pour éviter les problèmes de course condition
      const response = await axios.get(`${API_URL}/api/categories`);
      
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Si les données sont dans un sous-objet data
        setCategories(response.data.data);
      } else {
        console.error('Format de données de catégories inattendu:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories. Veuillez réessayer.');
      setCategories([]);
    } finally {
      setLoading(false);
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

  const pickImage = async () => {
    if (productData.images.length >= 5) {
      Alert.alert('Maximum atteint', 'Vous ne pouvez pas ajouter plus de 5 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à votre galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      exif: false
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProductData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0]]
      }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...productData.images];
    newImages.splice(index, 1);
    setProductData(prev => ({ ...prev, images: newImages }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case Step.PHOTOS:
        if (productData.images.length === 0) {
          newErrors.images = 'Veuillez ajouter au moins une photo.';
        }
        break;
      case Step.LOCATION:
        if (!productData.location) {
          newErrors.location = 'Veuillez indiquer la localisation du produit.';
        }
        if (!productData.telephone) {
          newErrors.telephone = 'Veuillez saisir votre numéro de téléphone.';
        }
        if (!termsAccepted) {
          newErrors.terms = 'Veuillez accepter les conditions générales.';
        }
        break;
      case Step.CHARACTERISTICS:
        if (!productData.size) {
          newErrors.size = 'Veuillez sélectionner une taille.';
        }
        if (!productData.color) {
          newErrors.color = 'Veuillez sélectionner une couleur.';
        }
        if (!productData.condition) {
          newErrors.condition = 'Veuillez sélectionner l\'état du produit.';
        }
        break;
      case Step.DETAILS:
        if (!productData.title) {
          newErrors.title = 'Veuillez saisir un titre.';
        }
        if (!productData.category_id) {
          newErrors.category = 'Veuillez sélectionner une catégorie.';
        }
        if (!productData.warranty) {
          newErrors.warranty = 'Veuillez sélectionner une garantie.';
        }
        if (!productData.price) {
          newErrors.price = 'Veuillez indiquer un prix.';
        } else if (isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
          newErrors.price = 'Veuillez saisir un prix valide.';
        }
        if (!productData.description) {
          newErrors.description = 'Veuillez ajouter une description.';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < Step.DETAILS) {
        setCurrentStep(currentStep + 1);
      } else {
        submitProduct();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const submitProduct = async () => {
    if (!validateStep()) return;
    
    setIsLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour publier une annonce.');
        navigation.navigate('Login');
        setIsLoading(false);
        return;
      }
      
      // Préparer les données de localisation
      const [city, zipCode] = (productData.location || '').split(',').map(part => part.trim());
      
      // Vérifier si un code postal existe
      const postalCode = zipCode || ''; 
      const zipCodePattern = /\d{5}/; // Format français: 5 chiffres
      const extractedZipCode = postalCode.match(zipCodePattern)?.[0] || '75000'; // Code postal par défaut de Paris
      
      // Préparer les images pour l'upload
      const formData = new FormData();
      
      // Ajouter les données essentielles du produit
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('condition', productData.condition);
      formData.append('user_id', String(productData.user_id || ''));
      formData.append('status', 'PUBLISHED'); // S'assurer que le statut est défini
      
      // Ajouter les données de catégorie
      formData.append('category_id', String(productData.category_id || ''));
      formData.append('categoryId', String(productData.category_id || ''));
      
      if (productData.subcategory_id) {
        formData.append('subcategory_id', String(productData.subcategory_id));
        formData.append('subcategoryId', String(productData.subcategory_id));
      }
      
      // Ajouter les données de localisation (dans tous les formats possibles)
      formData.append('location', productData.location);
      formData.append('address', productData.location);
      formData.append('city', city || '');
      
      // Envoyer le code postal dans le format attendu par le backend
      formData.append('zipCode', extractedZipCode);
      
      // Ajouter les coordonnées par défaut
      formData.append('latitude', '0');
      formData.append('longitude', '0');
      
      // Ajouter les autres informations du produit
      formData.append('size', productData.size);
      formData.append('color', productData.color);
      formData.append('warranty', productData.warranty);
      formData.append('phone', productData.telephone);
      formData.append('hide_phone', String(productData.hide_phone));
      formData.append('view_count', '0');
      
      // Vérifier si les images ne sont pas trop nombreuses
      if (productData.images.length > 5) {
        Alert.alert('Erreur', 'Vous ne pouvez pas ajouter plus de 5 images.');
        setIsLoading(false);
        return;
      }
      
      // Ajouter toutes les images (max 5)
      for (let i = 0; i < productData.images.length; i++) {
        const image = productData.images[i];
        const uri = image.uri;
        const name = uri.split('/').pop() || `image_${i}.jpg`;
        
        // Détecter le type de l'image à partir de l'extension
        let type = 'image/jpeg'; // Type par défaut
        if (name.toLowerCase().endsWith('.png')) {
          type = 'image/png';
        } else if (name.toLowerCase().endsWith('.gif')) {
          type = 'image/gif';
        } else if (name.toLowerCase().endsWith('.webp')) {
          type = 'image/webp';
        }
        
        console.log(`Envoi de l'image ${i}:`, { uri, name, type });
        
        // Ajouter l'image au formData
        formData.append('images[]', {
          uri,
          name,
          type,
        } as any);
      }

      try {
        console.log('Envoi des données au serveur');
        
        const response = await axios.post(`${API_URL}/api/products`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (response.data && response.data.id) {
          // Afficher la page de confirmation au lieu d'une alerte
          setPublishedProductId(response.data.id);
          setShowSuccessPage(true);
          setIsLoading(false);
        }
      } catch (error: any) {
        // Si l'erreur est 413 (Payload too large)
        if (error.response && error.response.status === 413) {
          Alert.alert(
            'Erreur de taille de données',
            'Les images sont trop volumineuses. Veuillez réduire leur taille ou en sélectionner moins.',
            [{ text: 'OK' }]
          );
        } else if (error.response && error.response.status === 422) {
          // Erreur de validation
          console.log('Erreur de validation:', error.response.data);
          let validationErrors = 'Erreur de validation:';
          
          if (error.response.data.errors) {
            Object.entries(error.response.data.errors).forEach(([field, messages]: [string, any]) => {
              validationErrors += `\n- ${field}: ${messages[0]}`;
            });
          }
          
          Alert.alert('Erreur de validation', validationErrors);
        } else if (error.response && error.response.status === 500) {
          // Erreur serveur
          console.error('Erreur serveur:', error.response.data);
          
          // Vérifier si c'est une erreur de base de données liée aux colonnes
          const errorMessage = error.response.data && error.response.data.message || '';
          const isColumnError = errorMessage.includes('no column named');
          
          if (isColumnError) {
            // Extraire le nom de colonne manquante pour affichage
            const columnMatch = errorMessage.match(/no column named ([^\s]+)/);
            const columnName = columnMatch ? columnMatch[1] : 'unknown';
            
            // Ajouter le champ manquant directement si possible
            try {
              if (columnName && columnName !== 'unknown') {
                // Utiliser le code postal extrait comme valeur par défaut pour tout champ manquant lié au code postal
                if (columnName.toLowerCase().includes('zip') || columnName.toLowerCase().includes('code')) {
                  formData.append(columnName, extractedZipCode);
                  
                  // Réessayer immédiatement avec le champ ajouté
                  const retryResponse = await axios.post(`${API_URL}/api/products`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (retryResponse.data && retryResponse.data.id) {
                    Alert.alert(
                      'Succès',
                      'Votre annonce a été publiée avec succès !',
                      [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                    );
                    return;
                  }
                }
              }
            } catch (retryError) {
              console.error('Échec de la seconde tentative:', retryError);
            }
            
            Alert.alert(
              'Erreur technique',
              `Problème de structure de données : colonne "${columnName}" manquante. L'équipe technique a été notifiée.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Erreur serveur',
              'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw error; // Relancer l'erreur pour être gérée par le catch extérieur
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la publication de l\'annonce:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la publication de l\'annonce.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      if (!showSuccessPage) {
        setIsLoading(false);
      }
    }
  };

  // Fonction pour afficher une modale de sélection
  const showSelectionModal = (type: string) => {
    setModalVisible(type);
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
    }
    setModalVisible(null);
  };

  const renderPhotoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ajoutez des photos</Text>
      <Text style={styles.stepDescription}>
        Sélectionnez vos plus belles photos afin de mettre en valeur votre produit :
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
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Où se situe votre bien</Text>
      <Text style={styles.stepDescription}>
        Ne vous inquiétez pas votre adresse personnelle reste confidentielle :
      </Text>
      
      <View style={styles.mapPreview}>
        {/* Ici, vous pourriez intégrer une véritable carte */}
        <View style={styles.mapPlaceholder}>
          <Text>Carte de localisation</Text>
        </View>
      </View>
      
      <Text style={styles.inputLabel}>Adresse</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Paris, 75001"
        value={productData.location}
        onChangeText={(text) => setProductData(prev => ({ ...prev, location: text }))}
      />
      <Text style={styles.inputHint}>
        Format recommandé: Ville, Code Postal (ex: Paris, 75001)
      </Text>
      {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      
      <Text style={styles.inputLabel}>Téléphone</Text>
      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone"
        keyboardType="phone-pad"
        value={productData.telephone}
        onChangeText={(text) => setProductData(prev => ({ ...prev, telephone: text }))}
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

  const renderCharacteristicsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Les caractéristiques</Text>
      <Text style={styles.stepDescription}>
        Complétez les informations sur votre produit pour faciliter sa recherche
      </Text>
      
      <Text style={styles.inputLabel}>Taille</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => showSelectionModal('size')}
      >
        <TextInput
          style={styles.input}
          placeholder="Sélectionnez la taille"
          value={productData.size}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color="black" style={styles.dropdownIcon} />
      </TouchableOpacity>
      {errors.size && <Text style={styles.errorText}>{errors.size}</Text>}
      
      <Text style={styles.inputLabel}>Couleur</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => showSelectionModal('color')}
      >
        <TextInput
          style={styles.input}
          placeholder="Sélectionnez la couleur"
          value={productData.color}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color="black" style={styles.dropdownIcon} />
      </TouchableOpacity>
      {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
      
      <Text style={styles.inputLabel}>État du produit</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => showSelectionModal('condition')}
      >
        <TextInput
          style={styles.input}
          placeholder="Sélectionnez l'état"
          value={CONDITIONS.find(c => c.id === productData.condition)?.label || ''}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color="black" style={styles.dropdownIcon} />
      </TouchableOpacity>
      {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Publier une annonce</Text>
      <Text style={styles.stepDescription}>
        Décrivez au mieux votre article afin d'éviter les questions inutiles ! 😄
      </Text>
      
      <Text style={styles.inputLabel}>Quel est le titre de votre annonce?</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Poussette Yoyo+ comme neuve"
        value={productData.title}
        onChangeText={(text) => setProductData(prev => ({ ...prev, title: text }))}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      
      <Text style={styles.inputLabel}>À quelle catégorie appartient-elle ?</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => showSelectionModal('category')}
      >
        <TextInput
          style={styles.input}
          placeholder="Toutes catégories"
          value={categories && categories.length > 0 
            ? categories.find(c => c.id === productData.category_id)?.name || ''
            : ''}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color="black" style={styles.dropdownIcon} />
      </TouchableOpacity>
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      
      <Text style={styles.inputLabel}>À quelle sous-catégorie appartient-elle ?</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => productData.category_id && showSelectionModal('subcategory')}
        disabled={!productData.category_id}
      >
        <TextInput
          style={[styles.input, !productData.category_id && styles.disabledInput]}
          placeholder={productData.category_id ? "Choisissez dans la liste" : "Sélectionnez d'abord une catégorie"}
          value={productData.subcategory_id ? 
            categories?.find(c => c.id === productData.category_id)?.subcategories?.find(
              sc => sc.id === productData.subcategory_id
            )?.name || '' : 
            ''}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color={productData.category_id ? "black" : "#aaa"} style={styles.dropdownIcon} />
      </TouchableOpacity>
      
      <Text style={styles.inputLabel}>Garantie</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => showSelectionModal('warranty')}
      >
        <TextInput
          style={styles.input}
          placeholder="Sélectionnez la garantie"
          value={productData.warranty}
          editable={false}
        />
        <Entypo name="chevron-down" size={24} color="black" style={styles.dropdownIcon} />
      </TouchableOpacity>
      
      <Text style={styles.inputLabel}>Prix (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="Prix en euros"
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case Step.PHOTOS:
        return renderPhotoStep();
      case Step.LOCATION:
        return renderLocationStep();
      case Step.CHARACTERISTICS:
        return renderCharacteristicsStep();
      case Step.DETAILS:
        return renderDetailsStep();
      default:
        return null;
    }
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case Step.DETAILS:
        return 'Publier mon annonce';
      default:
        return 'Continuer';
    }
  };

  // Modale pour les sélections
  const renderSelectionModal = () => {
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
            navigation.navigate('ProductDetails', { productId: publishedProductId });
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentStep === Step.PHOTOS ? 'Ajouter des photos' :
          currentStep === Step.LOCATION ? 'Localisation' :
          currentStep === Step.CHARACTERISTICS ? 'Caractéristiques' :
          'Détails du produit'}
        </Text>
        
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressIndicator, 
            { width: `${(currentStep + 1) * 25}%` }
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
      >
        {renderCurrentStep()}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleBack}
          >
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={currentStep === Step.DETAILS ? submitProduct : handleNext}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {getButtonLabel()}
          </Text>
        </TouchableOpacity>
      </View>

      {renderSelectionModal()}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E75A7C" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Espace pour le bouton en bas
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
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
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
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
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
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
}); 