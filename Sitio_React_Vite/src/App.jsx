import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import React from 'react';
import sublisantImg from './assets/sublisant.jpg';
function App() {
 return (

  <div>
    <h1>Sublisant</h1>
  <PortadaSublimacion />
  
  </div>

 );
}  
export default App;  

function PortadaSublimacion() {
 
  const handleCotizar = () => {
    window.open('https://wa.me', '_blank');
  };

  return (
    <section style={styles.heroContainer}>
      
      <div style={styles.textColumn}>
        <span style={styles.badge}>¡Trabajos realizados de calidad!</span>
        <h1 style={styles.title}>
          Dale Vida a tus Ideas con <span style={styles.highlight}>Sublimación</span> Profesional
        </h1>
        <p style={styles.subtitle}>
          Creamos playeras, tazas, termos y promocionales únicos para tu marca, negocio o evento especial. Colores vibrantes que no se borran.
        </p>
        <div style={styles.buttonGroup}>
          <button onClick={handleCotizar} style={styles.primaryButton}>
            Cotizar por WhatsApp
          </button>
          <button style={styles.secondaryButton}>
            Ver Catálogo
          </button>
        </div>
      </div>

      <div style={styles.imageColumn}>
        <div style={styles.imageCard}>
        
          <img 
            src={sublisantImg} 
            alt="Productos sublimados personalizados" 
            style={styles.heroImage}
          />
          <div style={styles.floatingTag}>✨ Colores Premium</div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  heroContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '60px 10%',
    backgroundColor: '#f9fbfd',
    minHeight: '80vh',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  textColumn: {
    flex: '1 1 500px',
    paddingRight: '20px',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2.8rem',
    color: '#212121',
    lineHeight: '1.2',
    marginBottom: '20px',
  },
  highlight: {
    color: '#ff4081', // Un color rosa/magenta vibrante que evoca las tintas de sublimación
    textDecoration: 'underline',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '30px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#4caf50', // Color verde WhatsApp
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: '0.3s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#212121',
    border: '2px solid #212121',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: '0.3s',
  },
  imageColumn: {
    flex: '1 1 400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30px',
  },
  imageCard: {
    position: 'relative',
    maxWidth: '100%',
  },
  heroImage: {
    width: '100%',
    maxWidth: '450px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  },
  floatingTag: {
    position: 'absolute',
    bottom: '20px',
    left: '-20px',
    backgroundColor: '#ffeb3b',
    color: '#000',
    padding: '8px 16px',
    borderRadius: '30px',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  }
};

