import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { Avatar, Text, Divider, List, Button, Card, TextInput, Surface, Portal, Provider, IconButton } from 'react-native-paper';
import AuthService from '../services/auth';
import { Props } from '../types/navigation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://192.168.0.34:8000/api'  // Adresse IP locale de l'utilisateur
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
  
  // Charger les informations de l'utilisateur et ses produits
  useEffect(() => {
    loadUserData();
    loadUserProducts();
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
      setUser(userData);
      
      // Initialiser les champs de formulaire
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      
      // Initialiser les champs d'adresse si disponibles
      if (userData.address) {
        setStreet(userData.address.street || '');
        setCity(userData.address.city || '');
        setZipCode(userData.address.zip_code || '');
      }
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 10000);

    loadUserProducts().finally(() => {
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
    // Image par défaut si pas d'images
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      return require('../../assets/placeholder.png');
    }
    
    try {
      const image = product.images[0];
      
      // Si c'est une chaîne qui commence par http, c'est déjà une URL complète
      if (typeof image === 'string' && image.startsWith('http')) {
        return { uri: image };
      }
      
      // Si c'est une chaîne sans http, ajouter le préfixe de stockage
      if (typeof image === 'string') {
        return { uri: `${API_URL}/storage/${image}` };
      }
      
      // Si c'est un objet avec une propriété url
      if (typeof image === 'object' && image && 'url' in image && image.url) {
        return { uri: image.url };
      }
      
      // Si c'est un objet avec une propriété path
      if (typeof image === 'object' && image && 'path' in image && image.path) {
        return { uri: `${API_URL}/storage/${image.path}` };
      }
    } catch (e) {
      console.error('Erreur traitement image:', e);
    }
    
    // Image par défaut en cas d'échec
    return require('../../assets/placeholder.png');
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

  // Fonction pour mettre à jour le profil
  const updateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour modifier votre profil');
        return;
      }
      
      const response = await axios.put(`${API_URL}/users/profile`, 
        {
          name,
          email,
          phone
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setEditProfileVisible(false);
        loadUserData(); // Recharger les données utilisateur
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour du profil';
      
      if (error.response) {
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
    }
  };
  
  // Fonction pour mettre à jour l'adresse
  const updateAddress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour modifier votre adresse');
        return;
      }
      
      // Inclure l'adresse dans la mise à jour du profil
      const response = await axios.put(`${API_URL}/users/profile`,
        {
          address: {
            street,
            city,
            zip_code: zipCode
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setEditAddressVisible(false);
        loadUserData(); // Recharger les données utilisateur
        Alert.alert('Succès', 'Votre adresse a été mise à jour avec succès');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'adresse:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour de l\'adresse';
      
      if (error.response) {
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
    }
  };
  
  // Fonction pour changer le mot de passe
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
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour changer votre mot de passe');
        return;
      }
      
      const response = await axios.post(`${API_URL}/users/change-password`, 
        { 
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
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
    }
  };

  return (
    <Provider>
      <ScrollView 
        style={styles.container}
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
            <View style={styles.header}>
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
            </View>
          </LinearGradient>
        </ImageBackground>

        <Surface style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProducts.length}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.favorites_count || 0}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.total_views || 0}</Text>
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
        
        {/* Modal pour modifier le profil */}
        <Portal>
          <Modal visible={editProfileVisible} onDismiss={() => setEditProfileVisible(false)}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Modifier mon profil</Text>
              
              <TextInput
                label="Nom"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setEditProfileVisible(false)} style={styles.modalButton}>
                  Annuler
                </Button>
                <Button mode="contained" onPress={updateProfile} style={[styles.modalButton, styles.primaryButton]}>
                  Enregistrer
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
        
        {/* Modal pour modifier l'adresse */}
        <Portal>
          <Modal visible={editAddressVisible} onDismiss={() => setEditAddressVisible(false)}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Modifier mon adresse</Text>
              
              <TextInput
                label="Rue et numéro"
                value={street}
                onChangeText={setStreet}
                mode="outlined"
                style={styles.input}
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Ville"
                value={city}
                onChangeText={setCity}
                mode="outlined"
                style={styles.input}
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Code postal"
                value={zipCode}
                onChangeText={setZipCode}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setEditAddressVisible(false)} style={styles.modalButton}>
                  Annuler
                </Button>
                <Button mode="contained" onPress={updateAddress} style={[styles.modalButton, styles.primaryButton]}>
                  Enregistrer
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
        
        {/* Modal pour changer le mot de passe */}
        <Portal>
          <Modal visible={changePasswordVisible} onDismiss={() => setChangePasswordVisible(false)}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Changer de mot de passe</Text>
              
              <TextInput
                label="Mot de passe actuel"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <TextInput
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                outlineColor="#E75A7C"
                activeOutlineColor="#E75A7C"
              />
              
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setChangePasswordVisible(false)} style={styles.modalButton}>
                  Annuler
                </Button>
                <Button mode="contained" onPress={changePassword} style={[styles.modalButton, styles.primaryButton]}>
                  Enregistrer
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    height: 220,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    backgroundColor: '#E75A7C',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
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
    paddingHorizontal: 15,
    paddingBottom: 15,
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
    marginBottom: 20,
  },
  logoutButton: {
    borderColor: '#E75A7C',
    width: '80%',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E75A7C',
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#E75A7C',
  },
  productCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  productImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productImage: {
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
    padding: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E75A7C',
    marginBottom: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    justifyContent: 'space-between',
    padding: 8,
  },
}); 