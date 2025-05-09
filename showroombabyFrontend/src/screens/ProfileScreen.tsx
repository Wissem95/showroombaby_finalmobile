import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Image, Modal, SafeAreaView, StatusBar } from 'react-native';
import { Avatar, Text, Divider, List, Button, Card, TextInput, Surface, Portal, Provider, IconButton, Dialog } from 'react-native-paper';
import AuthService from '../services/auth';
import { Props } from '../types/navigation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useIsFocused } from '@react-navigation/native';
import { SERVER_IP } from '../config/ip';
import imageService from '../services/api/imageService';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.3:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  category_id: number;
  user_id: number;
  city?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  images?: string | string[] | { path: string; url?: string }[] | any[] | null;
}

// Constantes
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300/f8bbd0/ffffff?text=Showroom+Baby';

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  
  // État pour la modification du profil
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editAddressVisible, setEditAddressVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  
  // Champs du formulaire de profil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Champs pour l'adresse
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Champs pour le mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États pour contrôler la visibilité des mots de passe
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // Charger les informations de l'utilisateur et ses produits
  useEffect(() => {
    loadUserData();
    loadUserProducts();
    loadFavorites();
  }, []);
  
  // Charger les données de l'utilisateur depuis l'API
  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data.data || response.data;
      console.log('Données utilisateur complètes:', userData);
      
      // Vérifier les noms exacts des propriétés dans la réponse
      const favoritesCount = userData.favorites_count || userData.favourites_count || userData.favorite_count || 0;
      const totalViews = userData.total_views || userData.views_count || userData.product_views || 0;
      
      // Ajouter ces propriétés à l'objet utilisateur si elles n'existent pas
      const enhancedUserData = {
        ...userData,
        favorites_count: favoritesCount,
        total_views: totalViews
      };
      
      console.log('Statistiques détectées - Favoris:', favoritesCount, 'Vues:', totalViews);
      setUser(enhancedUserData);
      
      // Initialiser les champs de formulaire (avec valeurs par défaut si non définies)
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      
      // Initialiser les champs d'adresse (avec valeurs par défaut si non définies)
      setStreet(userData.street || '');
      setCity(userData.city || '');
      setZipCode(userData.zipCode || '');
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger vos informations. Veuillez réessayer.');
    }
  };

  const loadUserProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir vos annonces');
        return;
      }

      const response = await axios.get(`${API_URL}/users/me/products`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.data) {
        const products = response.data.data || response.data;
        setUserProducts(Array.isArray(products) ? products : []);
        
        console.log('Produits chargés:', products);
        
        // Calculer le total des vues
        let views = 0;
        if (Array.isArray(products)) {
          products.forEach(product => {
            views += product.view_count || 0;
          });
        }
        setTotalViews(views);
        console.log('Total des vues calculé:', views);
      }
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response || error);
      
      let message = 'Impossible de charger vos annonces';
      if (error.code === 'ECONNABORTED') {
        message = 'Le chargement prend trop de temps. Veuillez réessayer.';
      } else if (error.response?.status === 404) {
        setUserProducts([]);
        message = 'Vous n\'avez pas encore publié d\'annonces';
      } else if (error.response?.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
        navigation.navigate('Auth');
      }
      
      if (error.response?.status !== 404) {
        Alert.alert('Erreur', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Nouvelle fonction pour charger les favoris
  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/favorites`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data) {
        const favorites = response.data.data || response.data;
        const count = Array.isArray(favorites) ? favorites.length : 0;
        setFavoritesCount(count);
        console.log('Nombre de favoris récupérés:', count);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      // Ne pas afficher d'alerte ici pour ne pas gêner l'utilisateur
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 10000);

    Promise.all([loadUserData(), loadUserProducts(), loadFavorites()]).finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Confirmation de déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.logout();
              
              Alert.alert(
                'Déconnexion réussie',
                'Vous avez été déconnecté avec succès.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} €`;
  };

  const getProductImage = (product: Product) => {
    return imageService.getProductImageSource(product, require('../../assets/placeholder.png'));
  };

  const handleDeleteProduct = async (productId: number) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              setUserProducts(prevProducts => 
                prevProducts.filter(product => product.id !== productId)
              );
              
              Alert.alert('Succès', 'Annonce supprimée avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
            }
          }
        }
      ]
    );
  };

  // Composant de produit dans le profil
  const ProductItemCard = React.memo(({ product, onDelete, onEdit }: { 
    product: Product; 
    onDelete: (id: number) => void; 
    onEdit: (id: number) => void;
  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    return (
      <Card style={styles.productCard} key={product.id}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProductDetails', { productId: product.id, fullscreenMode: true })}
        >
          <View style={styles.productImageContainer}>
            {imageLoading && (
              <ActivityIndicator 
                size="small" 
                color="#E75A7C" 
                style={styles.imageLoader} 
              />
            )}
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={24} color="#E75A7C" />
                <Text style={styles.imageErrorText}>Image indisponible</Text>
              </View>
            )}
            <Card.Cover 
              source={getProductImage(product)} 
              style={styles.productImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </View>
          <Card.Content style={styles.productContent}>
            <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.location && (
              <Text style={styles.productLocation} numberOfLines={1}>
                <Ionicons name="location-outline" size={14} color="#666" /> {product.location}
              </Text>
            )}
          </Card.Content>
        </TouchableOpacity>
        <Card.Actions style={styles.productActions}>
          <Button 
            mode="outlined" 
            onPress={() => onEdit(product.id)}
          >
            Modifier
          </Button>
          <Button 
            mode="outlined" 
            textColor="red"
            onPress={() => onDelete(product.id)}
          >
            Supprimer
          </Button>
        </Card.Actions>
      </Card>
    );
  });

  const renderProductItem = (product: Product) => (
    <ProductItemCard 
      product={product} 
      onDelete={handleDeleteProduct} 
      onEdit={(id) => navigation.navigate('AjouterProduit', { productId: id })}
    />
  );

  // Ajouter une fonction pour valider le format de téléphone français
  const isValidFrenchPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Vide est accepté
    const regex = /^(0|\+33)[1-9](\d{2}){4}$/;
    return regex.test(phone);
  };

  // Mettre à jour le profil (envoyer chaînes vides au lieu de null)
  const updateProfile = async () => {
    try {
      // Valider le numéro de téléphone
      if (phone && !isValidFrenchPhoneNumber(phone)) {
        Alert.alert(
          'Numéro de téléphone invalide',
          'Veuillez entrer un numéro de téléphone français valide (ex: 0612345678 ou +33612345678)'
        );
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour modifier votre profil');
        return;
      }
      
      // Générer automatiquement un username basé sur le name
      const formattedName = name?.trim() || '';
      const generatedUsername = formattedName ? formattedName.toLowerCase().replace(/\s+/g, '') : '';
      
      // Envoyer des chaînes vides au lieu de null
      const userData = {
        name: formattedName || '',
        email: email?.trim() || user?.email, // Email est obligatoire, utiliser la valeur actuelle si vide
        phone: phone?.trim() || '',
        username: generatedUsername || user?.username || '' // Mettre à jour le username basé sur le name
      };
      
      console.log('Envoi des données de profil:', userData);
      
      const response = await axios.put(`${API_URL}/users/profile`, 
        userData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data) {
        console.log('Réponse du serveur:', response.data);
        setEditProfileVisible(false);
        await loadUserData(); // Recharger les données utilisateur
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour du profil';
      
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
        if (error.response.status === 401) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
          // Rediriger vers la page de login
          navigation.navigate('Auth');
        } else if (error.response.status === 422) {
          if (error.response.data?.errors) {
            const errors = Object.values(error.response.data.errors).flat();
            errorMessage = errors.join('\n');
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour l'adresse (envoyer chaînes vides au lieu de null)
  const updateAddress = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour modifier votre adresse');
        return;
      }
      
      // Envoyer des chaînes vides au lieu de null
      const addressData = {
        street: street?.trim() || '',
        city: city?.trim() || '',
        zipCode: zipCode?.trim() || ''
      };
      
      console.log('Envoi des données d\'adresse:', addressData);
      
      const response = await axios.put(
        `${API_URL}/users/profile`,
        addressData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data) {
        console.log('Réponse du serveur:', response.data);
        setEditAddressVisible(false);
        await loadUserData(); // Recharger les données utilisateur
        Alert.alert('Succès', 'Votre adresse a été mise à jour avec succès');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'adresse:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour de l\'adresse';
      
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
        if (error.response.status === 401) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
          // Rediriger vers la page de login
          navigation.navigate('Auth');
        } else if (error.response.status === 422) {
          if (error.response.data?.errors) {
            const errors = Object.values(error.response.data.errors).flat();
            errorMessage = errors.join('\n');
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Amélioration de la fonction changePassword
  const changePassword = async () => {
    // Validation
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour changer votre mot de passe');
        return;
      }
      
      // Utiliser les noms de champs attendus par l'API
      const passwordData = { 
        oldPassword: currentPassword,
        newPassword: newPassword,
        newPassword_confirmation: confirmPassword
      };
      
      console.log('Envoi de la demande de changement de mot de passe');
      
      const response = await axios.post(`${API_URL}/users/change-password`, 
        passwordData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Réponse du serveur:', response.status);
      
      setChangePasswordVisible(false);
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès');
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      
      let errorMessage = 'Une erreur est survenue lors du changement de mot de passe';
      
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
        if (error.response.status === 401) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
          // Rediriger vers la page de login
          navigation.navigate('Auth');
        } else if (error.response.status === 422) {
          if (error.response.data?.errors) {
            const errors = Object.values(error.response.data.errors).flat();
            errorMessage = errors.join('\n');
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.response.status === 400 || error.response.status === 403) {
          // Mot de passe actuel incorrect
          errorMessage = 'Le mot de passe actuel est incorrect';
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <View style={styles.statusBarBackground} />
      
      {/* L'élément qui masque l'espace blanc est maintenant placé en arrière-plan */}
      <View style={styles.bottomCover} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#E75A7C']}
            tintColor="#E75A7C"
            progressBackgroundColor="#ffffff"
          />
        }
      >
        <ImageBackground
          source={require('../../assets/placeholder.png')}
          style={styles.headerBackground}
        >
          <LinearGradient
            colors={['rgba(231,90,140,0.7)', 'rgba(231,90,140,0.9)']}
            style={styles.headerGradient}
          >
            <SafeAreaView style={styles.header}>
              <Avatar.Image 
                size={100} 
                source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Utilisateur') + '&background=E75A7C&color=fff' }} 
                style={styles.avatar}
              />
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setEditProfileVisible(true)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Modifier le profil</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        <Surface style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProducts.length}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalViews}</Text>
            <Text style={styles.statLabel}>Vues</Text>
          </View>
        </Surface>

        <List.Section>
          <List.Subheader style={styles.sectionHeader}>Paramètres du compte</List.Subheader>
          <List.Item
            title="Informations personnelles"
            description="Modifier vos informations de base"
            left={props => <List.Icon {...props} icon="account-edit" color="#E75A7C" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setEditProfileVisible(true)}
            style={styles.listItem}
          />
          <List.Item
            title="Changer de mot de passe"
            description="Mettre à jour votre mot de passe"
            left={props => <List.Icon {...props} icon="lock-reset" color="#E75A7C" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setChangePasswordVisible(true)}
            style={styles.listItem}
          />
          <List.Item
            title="Adresses de livraison"
            description="Gérer vos adresses de livraison"
            left={props => <List.Icon {...props} icon="map-marker" color="#E75A7C" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setEditAddressVisible(true)}
            style={styles.listItem}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader style={styles.sectionHeader}>Mes annonces</List.Subheader>
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('AjouterProduit')}
            style={styles.addButton}
            icon="plus"
          >
            Publier une nouvelle annonce
          </Button>

          <View style={styles.productsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E75A7C" />
                <Text style={styles.loadingText}>Chargement de vos annonces...</Text>
              </View>
            ) : userProducts.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="basket-outline" size={50} color="#E75A7C" />
                <Text style={styles.emptyStateText}>
                  Vous n'avez pas encore publié d'annonces
                </Text>
              </View>
            ) : (
              userProducts.map(product => (
                <ProductItemCard 
                  key={product.id}
                  product={product} 
                  onDelete={handleDeleteProduct} 
                  onEdit={(id) => navigation.navigate('AjouterProduit', { productId: id })}
                />
              ))
            )}
          </View>
        </List.Section>
        
        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader style={styles.sectionHeader}>Navigation rapide</List.Subheader>
          <List.Item
            title="Mes favoris"
            description="Voir tous les articles que vous avez aimés"
            left={props => <List.Icon {...props} icon="heart" color="#E75A7C" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Favoris')}
            style={styles.listItem}
          />
          <List.Item
            title="Messages"
            description="Voir vos conversations avec les vendeurs"
            left={props => <List.Icon {...props} icon="chat" color="#E75A7C" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Messages')}
            style={styles.listItem}
          />
        </List.Section>

        <View style={styles.logoutContainer}>
          <Button 
            mode="outlined" 
            onPress={handleLogout} 
            textColor="#E75A7C"
            style={styles.logoutButton}
            icon="logout"
          >
            Se déconnecter
          </Button>
        </View>
        
        {/* Nouvelle modale pour modifier le profil */}
        <Portal>
          <Dialog
            visible={editProfileVisible}
            onDismiss={() => setEditProfileVisible(false)}
            style={styles.dialogContainer}
          >
            <IconButton
              icon="close"
              size={24}
              onPress={() => setEditProfileVisible(false)}
              style={styles.closeButton}
              color="#E75A7C"
            />
            
            <Dialog.Title style={styles.dialogTitle}>Informations personnelles</Dialog.Title>
            
            <Dialog.Content>
              <Text style={styles.dialogSubtitle}>
                Mettez à jour vos informations de contact
              </Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Nom complet</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="account" color="#E75A7C" />}
                  placeholder="Votre nom"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="email" color="#E75A7C" />}
                  placeholder="exemple@mail.com"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Téléphone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="phone" color="#E75A7C" />}
                  placeholder="06 XX XX XX XX"
                />
              </View>
            </Dialog.Content>
            
            <View style={styles.customDialogActions}>
              <TouchableOpacity 
                style={styles.customCancelButton}
                onPress={() => setEditProfileVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.customCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.customConfirmButton}
                onPress={updateProfile}
                activeOpacity={0.7}
              >
                <Text style={styles.customConfirmButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Dialog>
        </Portal>
        
        {/* Nouvelle modale pour modifier l'adresse */}
        <Portal>
          <Dialog
            visible={editAddressVisible}
            onDismiss={() => setEditAddressVisible(false)}
            style={styles.dialogContainer}
          >
            <IconButton
              icon="close"
              size={24}
              onPress={() => setEditAddressVisible(false)}
              style={styles.closeButton}
              color="#E75A7C"
            />
            
            <Dialog.Title style={styles.dialogTitle}>Adresse de livraison</Dialog.Title>
            
            <Dialog.Content>
              <Text style={styles.dialogSubtitle}>
                Où souhaitez-vous recevoir vos articles ?
              </Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Rue et numéro</Text>
                <TextInput
                  value={street}
                  onChangeText={setStreet}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="home" color="#E75A7C" />}
                  placeholder="12 rue des Lilas"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Ville</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="city" color="#E75A7C" />}
                  placeholder="Paris"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Code postal</Text>
                <TextInput
                  value={zipCode}
                  onChangeText={setZipCode}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="numeric" color="#E75A7C" />}
                  placeholder="75001"
                />
              </View>
            </Dialog.Content>
            
            <View style={styles.customDialogActions}>
              <TouchableOpacity 
                style={styles.customCancelButton}
                onPress={() => setEditAddressVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.customCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.customConfirmButton}
                onPress={updateAddress}
                activeOpacity={0.7}
              >
                <Text style={styles.customConfirmButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Dialog>
        </Portal>
        
        {/* Nouvelle modale pour changer le mot de passe */}
        <Portal>
          <Dialog
            visible={changePasswordVisible}
            onDismiss={() => setChangePasswordVisible(false)}
            style={styles.dialogContainer}
          >
            <IconButton
              icon="close"
              size={24}
              onPress={() => setChangePasswordVisible(false)}
              style={styles.closeButton}
              color="#E75A7C"
            />
            
            <Dialog.Title style={styles.dialogTitle}>Sécurité du compte</Dialog.Title>
            
            <Dialog.Content>
              <Text style={styles.dialogSubtitle}>
                Choisissez un mot de passe fort pour protéger votre compte
              </Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!currentPasswordVisible}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="lock" color="#E75A7C" />}
                  right={<TextInput.Icon 
                    icon={currentPasswordVisible ? "eye-off" : "eye"} 
                    color="#E75A7C" 
                    onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)} 
                  />}
                  placeholder="••••••••"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!newPasswordVisible}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="lock-open" color="#E75A7C" />}
                  right={<TextInput.Icon 
                    icon={newPasswordVisible ? "eye-off" : "eye"} 
                    color="#E75A7C" 
                    onPress={() => setNewPasswordVisible(!newPasswordVisible)} 
                  />}
                  placeholder="••••••••"
                />
                <Text style={styles.fieldHelperText}>Au moins 8 caractères</Text>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!confirmPasswordVisible}
                  outlineColor="#E75A7C"
                  activeOutlineColor="#E75A7C"
                  left={<TextInput.Icon icon="lock-check" color="#E75A7C" />}
                  right={<TextInput.Icon 
                    icon={confirmPasswordVisible ? "eye-off" : "eye"} 
                    color="#E75A7C" 
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} 
                  />}
                  placeholder="••••••••"
                />
              </View>
            </Dialog.Content>
            
            <View style={styles.customDialogActions}>
              <TouchableOpacity 
                style={styles.customCancelButton}
                onPress={() => setChangePasswordVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.customCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.customConfirmButton}
                onPress={changePassword}
                activeOpacity={0.7}
              >
                <Text style={styles.customConfirmButtonText}>Mettre à jour</Text>
              </TouchableOpacity>
            </View>
          </Dialog>
        </Portal>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    top: -65,
    flex: 1,
    backgroundColor: '#f8f9fa',
    zIndex: 10,
  },
  contentContainer: {
    paddingBottom: 180,
  },
  headerBackground: {
    height: 330,
    marginTop: 0,
    width: '100%',
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  avatar: {
    backgroundColor: '#E75A7C',
    marginBottom: 0,
    borderWidth: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#eee',
    marginTop: 5,
  },
  editButton: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: -30,
    borderRadius: 10,
    elevation: 3,
    padding: 15,
    backgroundColor: '#fff',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E75A7C',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  divider: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },
  listItem: {
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  productsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 15,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 15,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  addButton: {
    margin: 15,
    backgroundColor: '#E75A7C',
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 100,
  },
  logoutButton: {
    borderColor: '#E75A7C',
    width: '80%',
  },
  dialogContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  dialogIconHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dialogIcon: {
    backgroundColor: '#E75A7C',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E75A7C',
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  customDialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 5,
    marginBottom: 10,
  },
  customCancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E75A7C',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 55,
  },
  customConfirmButton: {
    flex: 1,
    backgroundColor: '#E75A7C',
    borderWidth: 2,
    borderColor: '#E75A7C',
    borderRadius: 10,
    paddingVertical: 15, 
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 55,
  },
  customCancelButtonText: {
    color: '#E75A7C',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  customConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
  },
  productCard: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },
  productImage: {
    height: 160,
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 1,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  imageErrorText: {
    fontSize: 14,
    color: '#E75A7C',
    marginTop: 8,
  },
  productContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  productPrice: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#E75A7C',
    marginBottom: 6,
  },
  productLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productActions: {
    justifyContent: 'space-between',
    padding: 10,
    paddingHorizontal: 15,
  },
  fieldHelperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StatusBar.currentHeight || 0,
    backgroundColor: '#E75A7C',
    zIndex: 999,
  },
  bottomCover: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#f8f9fa',
    zIndex: -1,
  },
}); 