/// <reference types="nativewind/types" />

declare module 'nativewind' {
  import type { ComponentType } from 'react';

  export function styled<T extends ComponentType<any>>(
    Component: T,
  ): T & { className?: string };

  export type StyledProps = {
    className?: string;
  };
} 