
declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  
  export const Ionicons: ComponentType<IconProps>;
}

// Extend the global types
declare global {
  interface FormData {
    append(name: string, value: any, fileName?: string): void;
  }
}