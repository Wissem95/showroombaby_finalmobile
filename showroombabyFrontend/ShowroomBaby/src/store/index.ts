import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Store Redux central de l'application
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Ajoutez d'autres reducers ici au fur et à mesure que nous les créons
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Désactive la vérification de sérialisation pour certains objets complexes
    }),
});

// Types d'inférence pour useSelector et useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 