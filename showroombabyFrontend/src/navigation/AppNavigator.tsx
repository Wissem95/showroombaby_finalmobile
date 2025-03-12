import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
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

// Définir les types pour les navigateurs
const Stack = createNativeStackNavigator();

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

// Écran temporaire pour Messages
function MessagesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Messages</Text>
      <Text style={{ marginBottom: 20 }}>Vos conversations</Text>
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
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();
  
  const handleNavigate = (screen: string) => {
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une fonctionnalité protégée
    if (!isAuthenticated && 
        (screen === 'Favoris' || screen === 'AjouterProduit' || screen === 'Messages')) {
      // Rediriger vers la page de connexion
      navigation.navigate('Auth');
      // Afficher un message pour informer l'utilisateur
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour accéder à cette fonctionnalité',
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate(screen);
    }
  };
  
  return (
    <View style={styles.mainIcons}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={styles.iconItem}>
        <Ionicons 
          name={activeRoute === 'Home' ? 'search' : 'search-outline'} 
          size={24} 
          color={activeRoute === 'Home' ? '#ff6b9b' : '#888'} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => handleNavigate('Favoris')}>
        <Ionicons 
          name={activeRoute === 'Favoris' ? 'heart' : 'heart-outline'} 
          size={24} 
          color={activeRoute === 'Favoris' ? '#ff6b9b' : '#888'} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.iconItem, styles.addButton]}
        onPress={() => handleNavigate('AjouterProduit')}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => handleNavigate('Messages')}>
        <Ionicons 
          name={activeRoute === 'Messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} 
          size={24} 
          color={activeRoute === 'Messages' ? '#ff6b9b' : '#888'} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconItem}
        onPress={() => isAuthenticated ? 
          // Si connecté, afficher le profil
          navigation.navigate('Profile') : 
          // Sinon, afficher la page de connexion
          navigation.navigate('Auth')
        }>
        <Ionicons 
          name={isAuthenticated ? 'person' : 'person-outline'} 
          size={24} 
          color={(activeRoute === 'Auth' || activeRoute === 'Profile') ? '#ff6b9b' : '#888'} 
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
      <MessagesScreen />
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
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' }
        }}
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
              <View style={{ flex: 1 }}>
                <FavoritesScreen {...props} />
              </View>
              <CustomBottomBar navigation={props.navigation} activeRoute="Favoris" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="AjouterProduit">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <CustomAjouterProduitScreen {...props} />
              </View>
              <CustomBottomBar navigation={props.navigation} activeRoute="AjouterProduit" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Messages">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <MessagesScreen />
              </View>
              <CustomBottomBar navigation={props.navigation} activeRoute="Messages" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Profile">
          {(props) => (
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <ProfileScreen {...props} />
              </View>
              <CustomBottomBar navigation={props.navigation} activeRoute="Profile" />
            </SafeAreaView>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Auth" component={AuthNavigator} />
        
        <Stack.Screen 
          name="ProductDetails" 
          component={ProductDetailsScreen}
          options={{ headerShown: true, title: 'Détails du produit' }}
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
}); 