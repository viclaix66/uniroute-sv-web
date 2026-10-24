import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';

export default function App() {
  const [busqueda, setBusqueda] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UniRoute SV 📍</Text>
        <Text style={styles.headerSubtitle}>Rutas Universitarias de El Salvador (Web)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Buscador */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ruta, universidad o parada..."
            placeholderTextColor="#888"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {/* Mapa Web Nactivo (Google Maps Embed) */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Mapa de Cobertura</Text>
          <iframe
            src="https://maps.google.com/maps?q=13.6929,-89.2182&z=13&output=embed"
            width="100%"
            height="320"
            style={{ border: 0, borderRadius: 12, marginTop: 10 }}
            allowFullScreen=""
            loading="lazy"
            title="Mapa UniRoute SV"
          ></iframe>
        </View>

        {/* Sección de Rutas Populares */}
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Rutas Disponibles</Text>
          
          <View style={styles.routeCard}>
            <Text style={styles.routeName}>Ruta 44 - UES / UCA</Text>
            <Text style={styles.routeDetails}>San Salvador - Antiguo Cuscatlán</Text>
          </View>

          <View style={styles.routeCard}>
            <Text style={styles.routeName}>Ruta 30-B - Campus Central</Text>
            <Text style={styles.routeDetails}>Zona Universitaria</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    backgroundColor: '#0B2850',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#AFC2D8',
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 16,
  },
  mapContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routesSection: {
    marginTop: 10,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#0B2850',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});