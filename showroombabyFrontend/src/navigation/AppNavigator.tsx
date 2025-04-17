import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase, CommonActions } from '@react-navigation/native';
import AuthService from '../services/auth';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import { Button } from 'react-native-paper';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import FavoritesScreen from '../screens/FavoritesScreen';
import AjouterProduitScreen from '../screens/AjouterProduitScreen';
import ChatScreen from '../screens/ChatScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SearchScreen from '../screens/SearchScreen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icons3DStatic from '../components/Icons3DStatic';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://192.168.0.34:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

// Définir les types pour les navigateurs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Interface pour les composants de navigation
interface NavigationProps {
  navigation: NavigationProp<ParamListBase>;
}

// Écran temporaire pour Explorer
function ExploreScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Explorer</Text>
      <Text style={{ marginBottom: 20 }}>Découvrez de nouveaux articles</Text>
    </View>
  );
}

// Écran temporaire pour Favoris
function FavorisScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Mes favoris</Text>
      <Text style={{ marginBottom: 20 }}>Liste de vos articles favoris</Text>
    </View>
  );
}

// Composant de navigation pour les écrans d'authentification
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Interface pour la barre de navigation
interface CustomBottomBarProps {
  navigation: NavigationProp<ParamListBase>;
  activeRoute: string;
}

// Composant de barre de navigation personnalisée
function CustomBottomBar({ navigation, activeRoute }: CustomBottomBarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Vérifier l'authentification
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
          const userInfo = await AsyncStorage.getItem('userInfo');
          if (userInfo) {
            setUser(JSON.parse(userInfo));
          }
          
          // Charge le nombre de messages non lus immédiatement
          loadUnreadMessages();
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur vérification authentification:', error);
      }
    };

    checkAuth();
    
    // Configurer un intervalle pour vérifier les messages non lus uniquement si authentifié
    if (isAuthenticated) {
      // Nettoyer l'intervalle existant si nécessaire
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Définir un nouvel intervalle
      intervalRef.current = setInterval(loadUnreadMessages, 180000); // Augmenté à 3 minutes
    }
    
    // Nettoyage à la désinstallation du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const loadUnreadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      // Ajouter un cache pour éviter des requêtes trop fréquentes
      const lastChecked = await AsyncStorage.getItem('lastUnreadMessagesCheck');
      const now = Date.now();
      
      if (lastChecked && now - parseInt(lastChecked) < 60000) {
        // Si moins d'une minute s'est écoulée depuis la dernière vérification, ne rien faire
        return;
      }
      
      const response = await axios.get(`${API_URL}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadCount(response.data.count);
      
      // Mettre à jour le timestamp de dernière vérification
      await AsyncStorage.setItem('lastUnreadMessagesCheck', now.toString());
    } catch (error) {
      // Réduire le log d'erreur pour éviter de spammer la console
      console.error('Erreur chargement messages non lus');
    }
  };
  
  const handleNavigate = (screen: string) => {
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une fonctionnalité protégée
    if (!isAuthenticated && 
        (screen === 'Favoris' || screen === 'AjouterProduit' || screen === 'Messages')) {
      // Afficher un message pour informer l'utilisateur
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour accéder à cette fonctionnalité',
        [
          { 
            text: 'Annuler',
            style: 'cancel'
          },
          { 
            text: 'Se connecter',
            onPress: () => {
              // Stocker l'écran de destination pour y accéder après connexion
              AsyncStorage.setItem('redirectAfterLogin', screen);
              // Rediriger vers la page de connexion
              navigation.navigate('Auth');
            }
          }
        ]
      );
    } else {
      // Utiliser CommonActions.navigate au lieu de reset pour préserver l'historique
      navigation.dispatch(
        CommonActions.navigate({
          name: screen
        })
      );
    }
  };
  
  return (
    <View style={styles.mainIcons}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={styles.iconItem}>
        <Icons3DStatic 
          name="search"
          size={32}
          isActive={activeRoute === 'Home'}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => handleNavigate('Favoris')}>
        <Icons3DStatic 
          name="heart"
          size={32}
          isActive={activeRoute === 'Favoris'}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.iconItem, styles.addButton]}
        onPress={() => handleNavigate('AjouterProduit')}>
        <Icons3DStatic 
          name="add"
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => handleNavigate('Messages')}>
        <View>
          <Icons3DStatic 
            name="chat"
            size={32}
            isActive={activeRoute === 'Messages'}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => isAuthenticated ? 
          navigation.navigate('Profile') : 
          navigation.navigate('Auth')
        }>
        <Icons3DStatic 
          name="person"
          size={32}
          isActive={activeRoute === 'Auth' || activeRoute === 'Profile'}
        />
        {isAuthenticated && user && (
          <View style={styles.statusDot} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// Écran d'accueil avec barre de navigation personnalisée
function CustomHomeScreen({ navigation, route }: { navigation: any; route: any }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen navigation={navigation} route={route} />
      <CustomBottomBar navigation={navigation} activeRoute="Home" />
    </SafeAreaView>
  );
}

// Explorer avec barre de navigation personnalisée
function CustomExploreScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ExploreScreen />
      <CustomBottomBar navigation={navigation} activeRoute="Explore" />
    </SafeAreaView>
  );
}

// Favoris avec barre de navigation personnalisée
function CustomFavorisScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FavoritesScreen navigation={navigation} />
      <CustomBottomBar navigation={navigation} activeRoute="Favoris" />
    </SafeAreaView>
  );
}

// Ajouter produit avec barre de navigation personnalisée
function CustomAjouterProduitScreen({ navigation }: { navigation: any }) {
  return (
    <>
      <AjouterProduitScreen navigation={navigation} />
    </>
  );
}

// Messages avec barre de navigation personnalisée
function CustomMessagesScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <MessagesScreen navigation={navigation} />
      </View>
      <CustomBottomBar navigation={navigation} activeRoute="Messages" />
    </SafeAreaView>
  );
}

// Navigation principale de l'application
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await AuthService.init();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({ 
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
          presentation: 'card',
          animation: 'fade',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen name="Home">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <HomeScreen {...props} />
              <CustomBottomBar navigation={props.navigation} activeRoute="Home" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Favoris">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <FavoritesScreen {...props} />
              <CustomBottomBar navigation={props.navigation} activeRoute="Favoris" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Messages">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <MessagesScreen {...props} />
              <CustomBottomBar navigation={props.navigation} activeRoute="Messages" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="AjouterProduit"
          component={AjouterProduitScreen}
          options={({ navigation }) => ({ 
            headerShown: true,
            headerTitle: "Ajouter un produit",
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            ),
            gestureEnabled: false,
            contentStyle: { backgroundColor: '#fff' },
          })}
        />
        
        <Stack.Screen name="Profile">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <ProfileScreen {...props} />
              <CustomBottomBar navigation={props.navigation} activeRoute="Profile" />
            </SafeAreaView>
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{ presentation: 'modal' }}
        />
        
        <Stack.Screen 
          name="Search" 
          component={SearchScreen}
          options={{ 
            headerShown: false,
            animation: 'default'
          }}
        />
        
        <Stack.Screen 
          name="ProductDetails" 
          component={ProductDetailsScreen}
          options={{ 
            headerShown: false,
            presentation: 'card',
            animation: 'fade_from_bottom',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen as any}
          options={{ 
            headerShown: false,
            animation: 'default'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles pour la barre de navigation
const styles = StyleSheet.create({
  // Barre d'icônes
  mainIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  addButton: {
    backgroundColor: '#ff6b9b',
    borderRadius: 30,
    width: 50,
    height: 50,
    marginTop: -20,
    shadowColor: '#ff6b9b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusDot: {
    backgroundColor: '#ff6b9b',
    borderRadius: 5,
    width: 10,
    height: 10,
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#ff6b9b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 