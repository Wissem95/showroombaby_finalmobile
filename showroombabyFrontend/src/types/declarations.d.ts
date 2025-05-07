// Déclaration pour les fichiers FBX
declare module '*.fbx' {
  const content: any;
  export default content;
}

// Déclaration pour React Native Paper
declare module 'react-native-paper' {
  export const Provider: any;
  export const DefaultTheme: any;
  export const MD3LightTheme: any;
  export const Text: any;
  export const Button: any;
  export const Surface: any;
  export const ActivityIndicator: any;
  export const Appbar: any;
  export const FAB: any;
  export const Badge: any;
  export const Avatar: any;
  export const Divider: any;
  export const Card: any;
  export const Checkbox: any;
  export const HelperText: any;
  export const Searchbar: any;
  export const IconButton: any;
  export const Portal: any;
  export const Dialog: any;
  export const Chip: any;
  export const ProgressBar: any;
  export const RadioButton: any;
  export const TextInput: any;
  export const List: {
    Item: any;
    Icon: any;
    Section: any;
    Subheader: any;
    Accordion: any;
  };
  export const SegmentedButtons: any;
  
  export interface ThemeColors {
    primary: string;
    background: string;
    surface: string;
    accent: string;
    error: string;
    text: string;
    onSurface: string;
    disabled: string;
    placeholder: string;
    backdrop: string;
    notification: string;
  }
}

// Déclaration pour les icônes PNG
declare module '*.png' {
  const content: any;
  export default content;
} 