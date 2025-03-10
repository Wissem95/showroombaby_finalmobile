import { ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Déclaration pour augmenter les types de useDispatch afin de résoudre les erreurs d'ESLint
declare module 'react-redux' {
  interface DefaultRootState extends RootState {}

  export function useDispatch<
    TDispatch = ThunkDispatch<RootState, any, AnyAction>
  >(): TDispatch;
}

// Type Thunk personnalisé
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>; 