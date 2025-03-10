import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, HomeStackParamList } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import de nos écrans réels
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';

// Écrans temporaires pour les autres tabs (à remplacer plus tard)
const SearchScreen = () => (
  <View style={styles.placeholder}>
    <Text>Écran de recherche</Text>
  </View>
);

const AddProductScreen = () => (
  <View style={styles.placeholder}>
    <Text>Ajouter un produit</Text>
  </View>
);

const MessagesScreen = () => (
  <View style={styles.placeholder}>
    <Text>Messages</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.placeholder}>
    <Text>Profil</Text>
  </View>
);

// Écran temporaire pour les catégories (à remplacer plus tard)
const CategoryProductsScreen = ({ route }: any) => (
  <View style={styles.placeholder}>
    <Text>Produits de la catégorie {route.params.categoryName}</Text>
  </View>
);

// Créer la pile de navigation pour l'écran d'accueil
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <HomeStack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
    </HomeStack.Navigator>
  );
};

// Créer le navigateur principal avec onglets
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Navigateur principal avec les onglets de l'application
 */
const MainNavigator = () => {
  const unreadMessagesCount = useSelector((state: RootState) => 0); // À implémenter

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'AddProduct') {
            iconName = 'add-circle';
            size = 40; // Plus grand pour le bouton d'ajout
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF7043', // Couleur principale de l'application
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarLabel: 'Recherche',
        }}
      />
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainNavigator; 