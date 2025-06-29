import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, Button, RadioButton } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilterService, { Filters } from '../services/FilterService';
import { globalStyles, colors } from '../theme/globalStyles';

// Types
interface Category {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

// Conditions des produits
const CONDITIONS = [
  { id: 'NEW', label: 'Neuf' },
  { id: 'LIKE_NEW', label: 'Très bon état' },
  { id: 'GOOD', label: 'Bon état' },
  { id: 'FAIR', label: 'État satisfaisant' },
];

export default function AdvancedFiltersScreen({ navigation, route }: any) {
  // Récupérer les paramètres de la route
  const { categories } = route.params || {};
  
  // Récupérer les filtres actuels depuis le FilterService
  const currentFilters = FilterService.getFilters();
  
  // États pour les filtres
  const [selectedCategory, setSelectedCategory] = useState<number | null>(currentFilters.category);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(currentFilters.subcategory);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(currentFilters.condition);
  const [sellerType, setSellerType] = useState<string | null>(currentFilters.sellerType);
  const [minPrice, setMinPrice] = useState<string>(currentFilters.minPrice.toString());
  const [maxPrice, setMaxPrice] = useState<string>(currentFilters.maxPrice.toString());
  
  // États pour la gestion des modales de sélection
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Fonction pour appliquer les filtres et retourner à l'écran de recherche
  const applyFilters = () => {
    // Vérifier que minPrice et maxPrice sont des nombres valides
    const min = Math.max(0, parseInt(minPrice) || 0);
    const max = Math.max(min, parseInt(maxPrice) || 1000);

    // Préparer l'objet des filtres
    const newFilters: Filters = {
      category: selectedCategory,
      subcategory: selectedSubcategory,
      condition: selectedCondition,
      sellerType: sellerType,
      minPrice: min,
      maxPrice: max
    };

    // Appliquer les filtres via le service
    FilterService.setFilters(newFilters);
    console.log("AdvancedFiltersScreen: Filtres appliqués", newFilters);

    // Retourner à l'écran précédent sans paramètres
    navigation.goBack();
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedCondition(null);
    setSellerType(null);
    setMinPrice('0');
    setMaxPrice('1000');
    
    // Réinitialiser les filtres dans le service
    FilterService.resetFilters();
  };

  // Rendu des modales de sélection
  const renderCategoryModal = () => {
    if (!showCategoryModal) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
            <TouchableOpacity 
              onPress={() => setShowCategoryModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {categories?.map((cat: Category) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory(null);
                  setShowCategoryModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>{cat.name}</Text>
                {selectedCategory === cat.id && (
                  <Ionicons name="checkmark" size={20} color={colors.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSubcategoryModal = () => {
    if (!showSubcategoryModal || !selectedCategory) return null;
    
    const category = categories?.find((cat: Category) => cat.id === selectedCategory);
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une sous-catégorie</Text>
            <TouchableOpacity 
              onPress={() => setShowSubcategoryModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {category?.subcategories?.map(subcat => (
              <TouchableOpacity
                key={subcat.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSubcategory(subcat.id);
                  setShowSubcategoryModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>{subcat.name}</Text>
                {selectedSubcategory === subcat.id && (
                  <Ionicons name="checkmark" size={20} color={colors.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderConditionModal = () => {
    if (!showConditionModal) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un état</Text>
            <TouchableOpacity 
              onPress={() => setShowConditionModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {CONDITIONS.map(condition => (
              <TouchableOpacity
                key={condition.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCondition(condition.id);
                  setShowConditionModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>{condition.label}</Text>
                {selectedCondition === condition.id && (
                  <Ionicons name="checkmark" size={20} color={colors.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtres avancés</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Catégorie</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedCategory ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedCategory 
                  ? categories?.find((c: Category) => c.id === selectedCategory)?.name || 'Sélectionner' 
                  : 'Sélectionner'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
            </TouchableOpacity>
          </View>
          
          {selectedCategory && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Sous-catégorie</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => setShowSubcategoryModal(true)}
                activeOpacity={0.7}
              >
                <Text style={selectedSubcategory ? styles.selectorText : styles.selectorPlaceholder}>
                  {selectedSubcategory 
                    ? categories?.find((c: Category) => c.id === selectedCategory)?.subcategories?.find(sc => sc.id === selectedSubcategory)?.name || 'Sélectionner'
                    : 'Sélectionner'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>État</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setShowConditionModal(true)}
              activeOpacity={0.7}
            >
              <Text style={selectedCondition ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedCondition 
                  ? CONDITIONS.find(c => c.id === selectedCondition)?.label || 'Sélectionner'
                  : 'Sélectionner'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="colors.TEXT_MUTED" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Type de vendeur</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setSellerType(null)}
                activeOpacity={0.7}
              >
                <RadioButton
                  value="all"
                  status={sellerType === null ? 'checked' : 'unchecked'}
                  onPress={() => setSellerType(null)}
                  color={colors.PRIMARY}
                />
                <Text style={styles.radioLabel}>Tous</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setSellerType('professional')}
                activeOpacity={0.7}
              >
                <RadioButton
                  value="professional"
                  status={sellerType === 'professional' ? 'checked' : 'unchecked'}
                  onPress={() => setSellerType('professional')}
                  color={colors.PRIMARY}
                />
                <Text style={styles.radioLabel}>Professionnel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setSellerType('individual')}
                activeOpacity={0.7}
              >
                <RadioButton
                  value="individual"
                  status={sellerType === 'individual' ? 'checked' : 'unchecked'}
                  onPress={() => setSellerType('individual')}
                  color={colors.PRIMARY}
                />
                <Text style={styles.radioLabel}>Particulier</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Prix</Text>
            <View style={styles.priceInputContainer}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>Min</Text>
                <TextInput 
                  style={styles.priceInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <Text style={styles.euroSymbol}>€</Text>
              </View>
              <View style={styles.priceInputDivider} />
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>Max</Text>
                <TextInput 
                  style={styles.priceInput}
                  keyboardType="numeric"
                  placeholder="1000"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
                <Text style={styles.euroSymbol}>€</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button 
            mode="outlined" 
            onPress={resetFilters}
            style={styles.resetButton}
          >
            Réinitialiser
          </Button>
          <Button 
            mode="contained" 
            onPress={applyFilters}
            style={styles.applyButton}
          >
            Appliquer
          </Button>
        </View>
      </KeyboardAvoidingView>

      {renderCategoryModal()}
      {renderSubcategoryModal()}
      {renderConditionModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.BORDER_LIGHT',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: colors.TEXT_PRIMARY,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: 'colors.BORDER_MEDIUM',
    borderRadius: 10,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  selectorText: {
    color: colors.TEXT_PRIMARY,
    fontSize: 15,
  },
  selectorPlaceholder: {
    color: 'colors.TEXT_MUTED',
    fontSize: 15,
  },
  radioContainer: {
    marginVertical: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    padding: 12,
    backgroundColor: colors.BACKGROUND_MAIN,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'colors.BORDER_LIGHT',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: colors.TEXT_PRIMARY,
  },
  priceInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'colors.BORDER_DARK',
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  priceInputLabel: {
    fontSize: 14,
    color: 'colors.TEXT_SECONDARY',
    marginRight: 5,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
    textAlign: 'right',
    padding: 0,
  },
  euroSymbol: {
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
    marginLeft: 5,
  },
  priceInputDivider: {
    width: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'colors.BORDER_LIGHT',
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  resetButton: {
    flex: 1,
    marginRight: 10,
    borderColor: colors.PRIMARY,
    height: 50,
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.PRIMARY,
    height: 50,
    justifyContent: 'center',
  },
  // Styles pour les modales
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'colors.OVERLAY_DARK',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: colors.BACKGROUND_MAIN,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.BORDER_LIGHT',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'colors.BORDER_LIGHT',
  },
  modalItemText: {
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
  },
}); 