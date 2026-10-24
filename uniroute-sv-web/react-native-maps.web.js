import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
  <View style={[{ backgroundColor: '#0B2850', justifyContent: 'center', alignItems: 'center', padding: 20 }, props.style]}>
    <Text style={{ color: '#AFC2D8', textAlign: 'center' }}>
      📍 Mapa interactivo disponible en la app móvil (Expo Go / Android)
    </Text>
  </View>
);

export const Marker = () => null;
export default MapView;