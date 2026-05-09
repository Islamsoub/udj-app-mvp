// Compatibility shim: react-native-wheel-scrollview-picker uses the legacy
// global JSX namespace which was removed in @types/react v19.
import React from 'react';

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementType = React.JSX.ElementType;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}
