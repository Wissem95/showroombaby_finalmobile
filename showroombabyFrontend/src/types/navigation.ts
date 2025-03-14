import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type Props = NativeStackScreenProps<any, 'Profile'>;

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  ProductDetails: { productId: number };
  Auth: undefined;
  AjouterProduit: { productId?: number };
  Favoris: undefined;
  Messages: undefined;
  Chat: {
    receiverId: number;
    productId: number;
    productTitle: string;
  };
}; 