import { styled } from 'nativewind';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, FlatList } from 'react-native';

/**
 * Composants de base stylés avec NativeWind
 * Ces composants facilitent l'utilisation de TailwindCSS dans l'application
 */

// Conteneurs
export const StyledView = styled(View);
export const StyledScrollView = styled(ScrollView);
export const StyledFlatList = styled(FlatList);

// Typographie
export const StyledText = styled(Text);

// Interactions
export const StyledTouchableOpacity = styled(TouchableOpacity);
export const StyledTextInput = styled(TextInput);

// Média
export const StyledImage = styled(Image);

/**
 * Composant de carte pour afficher des informations
 */
export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <StyledView className={`bg-card rounded-lg shadow-sm overflow-hidden ${className}`}>
    {children}
  </StyledView>
);

/**
 * Bouton primaire
 */
export const PrimaryButton = ({ 
  title, 
  onPress, 
  className = '',
  disabled = false 
}: { 
  title: string; 
  onPress: () => void; 
  className?: string;
  disabled?: boolean;
}) => (
  <StyledTouchableOpacity 
    className={`bg-primary py-3 px-6 rounded-lg ${disabled ? 'opacity-50' : 'active:opacity-80'} ${className}`} 
    onPress={onPress}
    disabled={disabled}
  >
    <StyledText className="text-white font-bold text-center">{title}</StyledText>
  </StyledTouchableOpacity>
);

/**
 * Bouton secondaire
 */
export const SecondaryButton = ({ 
  title, 
  onPress, 
  className = '',
  disabled = false
}: { 
  title: string; 
  onPress: () => void; 
  className?: string;
  disabled?: boolean;
}) => (
  <StyledTouchableOpacity 
    className={`border border-primary py-3 px-6 rounded-lg ${disabled ? 'opacity-50' : 'active:opacity-80'} ${className}`} 
    onPress={onPress}
    disabled={disabled}
  >
    <StyledText className="text-primary font-bold text-center">{title}</StyledText>
  </StyledTouchableOpacity>
);

/**
 * Champ de saisie stylé
 */
export const FormInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  className = '',
  error = '',
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  className?: string;
  error?: string;
}) => (
  <StyledView className="mb-4">
    <StyledTextInput
      className={`border border-border rounded-lg p-3 bg-white ${error ? 'border-red-500' : ''} ${className}`}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
    {error ? (
      <StyledText className="text-red-500 text-xs mt-1 ml-1">{error}</StyledText>
    ) : null}
  </StyledView>
);

export default {
  StyledView,
  StyledText,
  StyledTouchableOpacity,
  StyledTextInput,
  StyledImage,
  StyledScrollView,
  StyledFlatList,
  Card,
  PrimaryButton,
  SecondaryButton,
  FormInput,
}; 