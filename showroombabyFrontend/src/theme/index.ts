import { createTheme } from '@shopify/restyle';

const palette = {
  pink: '#ff6b9b',
  lightPink: '#fef6f9',
  borderPink: '#ffd4e5',
  white: '#ffffff',
  black: '#000000',
  gray: '#666666',
  lightGray: '#f5f5f5',
  error: '#ff3b30',
};

const theme = createTheme({
  colors: {
    mainBackground: palette.white,
    mainForeground: palette.black,
    primary: palette.pink,
    primaryLight: palette.lightPink,
    border: palette.borderPink,
    text: palette.gray,
    error: palette.error,
    cardBackground: palette.white,
    inputBackground: palette.lightGray,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
    xxl: 48,
  },
  borderRadii: {
    xs: 4,
    s: 8,
    m: 10,
    l: 25,
    xl: 30,
    xxl: 50,
  },
  textVariants: {
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'mainForeground',
    },
    subheader: {
      fontSize: 20,
      fontWeight: '600',
      color: 'mainForeground',
    },
    body: {
      fontSize: 16,
      color: 'text',
    },
    caption: {
      fontSize: 12,
      color: 'text',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  },
  buttonVariants: {
    primary: {
      backgroundColor: 'primary',
      borderRadius: 'l',
      padding: 'm',
    },
    secondary: {
      backgroundColor: 'primaryLight',
      borderRadius: 'l',
      padding: 'm',
    },
  },
  cardVariants: {
    primary: {
      backgroundColor: 'cardBackground',
      borderRadius: 'm',
      padding: 'm',
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
  },
  inputVariants: {
    primary: {
      backgroundColor: 'inputBackground',
      borderRadius: 'l',
      padding: 'm',
      borderWidth: 1,
      borderColor: 'border',
    },
  },
});

export type Theme = typeof theme;
export default theme; 