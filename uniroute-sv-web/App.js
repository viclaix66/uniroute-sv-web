import React, { useState, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  BackHandler,
  Platform,
  Modal,
  TextInput,
  Animated,
  Image
} from 'react-native';

// --- IMPORTACIÓN CONDICIONAL PARA COMPATIBILIDAD CON WEB Y SNACK ---
let MapView = null;
let Marker = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.log('react-native-maps no disponible');
  }
}

// --- REQUISITOS ---
const DOCS_ESTANDAR = [
  'Título de Bachiller (original y copia).',
  'Partida de nacimiento reciente.',
  'Fotocopia de DUI (o carné de minoridad).',
  'Resultado oficial PAES/AVANZO.',
  'Certificación DI (con código QR) del Proceso Formativo de la Dirección de Integración.'
];
const PROCESO_ESTANDAR = [
  'Elegir la carrera en el portal de oferta académica de Integración y presentar tu Certificación DI.',
  'Llenar la solicitud de admisión / inscripción en la institución.',
  'Prueba diagnóstica o entrevista de admisión, según la carrera (confirma en la institución).'
];
const PROCESO_SALUD = [
  'Elegir la carrera en el portal de oferta académica de Integración y presentar tu Certificación DI.',
  'Llenar la solicitud de admisión / inscripción en la institución.',
  'Prueba diagnóstica y entrevista (obligatoria en carreras de salud; confirma en la institución).'
];
const reqEstandar = (sigla, nombre, proceso = PROCESO_ESTANDAR) => ({
  sigla, nombre, documentos: DOCS_ESTANDAR, proceso, estandar: true
});
const REQUISITOS_PENDIENTES = [
  reqEstandar('UNIVO', 'Universidad de Oriente', PROCESO_SALUD),
  reqEstandar('UNSSA', 'Universidad Nueva San Salvador', PROCESO_SALUD),
  reqEstandar('ULS', 'Universidad Luterana Salvadoreña'),
  reqEstandar('UPAN', 'Universidad Panamericana de El Salvador'),
  reqEstandar('UMOAR', 'Universidad Monseñor Oscar Arnulfo Romero'),
  reqEstandar('ESEN', 'Escuela Superior de Economía y Negocios'),
  reqEstandar('ECMH', 'Escuela de Comunicación Mónica Herrera'),
  reqEstandar('UGB', 'Universidad Gerardo Barrios (Usulután, San Miguel y Morazán)', PROCESO_SALUD),
  reqEstandar('UMA', 'Universidad Modular Abierta'),
  reqEstandar('UCAD', 'Universidad Cristiana de las Asambleas de Dios'),
  reqEstandar('UPES', 'Universidad Politécnica de El Salvador'),
  reqEstandar('USAM', 'Universidad Salvadoreña Alberto Masferrer', PROCESO_SALUD),
  reqEstandar('UNASA', 'Universidad Autónoma de Santa Ana', PROCESO_SALUD),
  reqEstandar('USO', 'Universidad de Sonsonate'),
  reqEstandar('ESINTEC', 'Esintec Institute'),
  reqEstandar('IEPROES', 'Instituto Especializado de Profesionales de la Salud', PROCESO_SALUD),
  reqEstandar('IEHES', 'Instituto Especializado Hospital de El Salvador', PROCESO_SALUD)
];

const REQUISITOS_BECA_DI = {
  sigla: 'BECA DI',
  nombre: 'Requisitos generales de la Beca de la Dirección de Integración',
  documentos: [
    'Ser bachiller de una institución pública y completar el Proceso Formativo de Integración.',
    'Certificación DI obtenida con tu código (se consulta con el QR de tu certificación).',
    'Beca universitaria o técnicos de 2 a 3 años (ITCA, universidades y profesorados): cumplir las 6 actividades del Proceso Formativo.',
    'Beca en escuela técnica: cumplir al menos 4 actividades; el Curso ADN de la Pobreza y la Cultura de la Integración, el refuerzo académico y el voluntariado son obligatorios.'
  ],
  proceso: [
    'Completar el Curso ADN de la Pobreza y la Cultura de la Integración y aprobar su prueba.',
    'Consultar tu Certificación DI.',
    'Explorar la oferta en ofertaacademica.culturadelaintegracion.com y elegir institución y carrera.',
    'Inscribirte según el proceso de admisión de la institución elegida (cupos limitados; hay segunda fase para quienes no fueron admitidos).'
  ]
};

const REQUISITOS_UNIVERSIDADES = [
  REQUISITOS_BECA_DI,
  {
    sigla: 'UES',
    nombre: 'Universidad de El Salvador (Pública)',
    documentos: [
      'Título de Bachiller original y copia.',
      'Resultado oficial prueba PAES/AVANZO.',
      'DUI (o minoridad/pasaporte) legible.',
      'Certificación de notas de bachillerato.'
    ],
    proceso: [
      'Registro en plataforma Ingreso UES.',
      'Pago de derecho a examen.',
      'Prueba Psicológica y Vocacional en línea.',
      'Examen de Conocimientos Generales (Fase I) o Específicos (Fase II).'
    ]
  },
  {
    sigla: 'UCA',
    nombre: 'Universidad Centroamericana José Simeón Cañas',
    documentos: [
      'Título de Bachiller (original y fotocopia).',
      'Fotocopia ampliada de DUI.',
      'Resultado oficial PAES/AVANZO.',
      'Notas de 1.º y 2.º año (profesorados).'
    ],
    proceso: [
      'Inscripción en portal de admisiones UCA.',
      'Estudio Socioeconómico obligatorio.',
      'Prueba Diagnóstica de Aptitudes.',
      'Curso de Inducción obligatorio.'
    ]
  },
  {
    sigla: 'UJMD',
    nombre: 'Universidad Dr. José Matías Delgado',
    documentos: [
      'Título de Bachiller (original y copia).',
      'Partida de nacimiento reciente (máx. 3 meses).',
      'Fotocopia de DUI / Carné de minoridad.',
      'Resultado de prueba PAES/AVANZO.'
    ],
    proceso: [
      'Solicitud de ingreso (presencial/línea).',
      'Pago de derechos de admisión.',
      'Examen Diagnóstico o Prueba de Admisión.',
      'Entrevista previa (Medicina/Odontología/Arqui).',
      'Jornada de Inducción preuniversitaria.'
    ]
  },
  {
    sigla: 'UTEC',
    nombre: 'Universidad Tecnológica de El Salvador',
    documentos: [
      'Título de Bachiller (original y fotocopia).',
      'Partida de nacimiento reciente.',
      'Fotocopia de DUI.',
      'Resultado oficial PAES/AVANZO.'
    ],
    proceso: [
      'Llenado de hoja de inscripción y matrícula.',
      'Pago de aranceles de ingreso.',
      'Prueba Diagnóstica Institucional para perfilamiento inicial.'
    ]
  },
  {
    sigla: 'UFG',
    nombre: 'Universidad Francisco Gavidia',
    documentos: [
      'Título de Bachiller acreditado por MINEDUCYT.',
      'Partida de nacimiento original y reciente.',
      'Fotocopia de DUI.',
      'Resultado oficial PAES/AVANZO.'
    ],
    proceso: [
      'Registro de usuario en portal de admisiones.',
      'Prueba de Admisión / Test Diagnóstico.',
      'Pago de matrícula y cuota 1.',
      'Curso de Orientación Universitaria (COU).'
    ]
  },
  {
    sigla: 'UDB',
    nombre: 'Universidad Don Bosco',
    documentos: [
      'Título de Bachiller original.',
      'Certificación de notas globales de 1.º y 2.º año.',
      'Resultado oficial PAES/AVANZO.',
      'Partida de nacimiento (vigencia < 3 meses).',
      'Fotocopia de DUI.'
    ],
    proceso: [
      'Creación de expediente digital institucional.',
      'Encuesta de Expectativas Estudiantiles.',
      'Prueba Diagnóstica Académica.',
      'Entrevista / Curso de admisión (Ingenierías, Aeronáutica y Salud).'
    ]
  },
  {
    sigla: 'UNAB',
    nombre: 'Universidad Dr. Andrés Bello',
    documentos: [
      'Título de Bachiller (original y copia).',
      'Partida de nacimiento reciente.',
      'Fotocopia de DUI.',
      'Resultado oficial PAES/AVANZO.'
    ],
    proceso: [
      'Llenado de formulario de admisión.',
      'Prueba diagnóstica institucional de competencias.',
      'Pago de inscripción y cuotas iniciales.'
    ]
  },
  {
    sigla: 'UNICAES',
    nombre: 'Universidad Católica de El Salvador',
    documentos: [
      'Título de Bachiller (original y copia).',
      'Certificación de notas de bachillerato.',
      'Partida de nacimiento original reciente.',
      'Fotocopia de DUI y resultado PAES/AVANZO.'
    ],
    proceso: [
      'Inscripción en sede (Santa Ana, Ilobasco, etc.).',
      'Examen de Admisión / Evaluación Diagnóstica.',
      'Entrevista vocacional (obligatoria en Salud).'
    ]
  },
  {
    sigla: 'UEES',
    nombre: 'Universidad Evangélica de El Salvador',
    documentos: [
      'Título de Bachiller (original y copia).',
      'Partida de nacimiento reciente.',
      'Fotocopia de DUI.',
      'Resultado de prueba PAES/AVANZO.'
    ],
    proceso: [
      'Llenado de ficha de admisión.',
      'Prueba Diagnóstica y Psicotécnica.',
      'Examen técnico y entrevista (Salud/Medicina).',
      'Curso de Inducción Universitaria.'
    ]
  },
  {
    sigla: 'UPED',
    nombre: 'Universidad Pedagógica de El Salvador',
    documentos: [
      'Título de Bachiller (original y fotocopia).',
      'Partida de nacimiento reciente.',
      'Fotocopia de DUI.',
      'Resultado de prueba PAES/AVANZO.'
    ],
    proceso: [
      'Formulario de inscripción.',
      'Test de Aptitudes y Actitudes Vocacionales.',
      'Jornada / Curso de Inducción.'
    ]
  },
  {
    sigla: 'ITCA-FEPADE',
    nombre: 'ITCA-FEPADE (Técnica / Ed. Superior)',
    documentos: [
      'Título de Bachiller (original y copia legalizada).',
      'Partida de nacimiento reciente.',
      'Fotocopia de DUI.',
      'Resultado oficial PAES/AVANZO.'
    ],
    proceso: [
      'Compra de prospecto/solicitud de admisión.',
      'Examen de Admisión (Matemáticas, Lenguaje, Razonamiento).',
      'Curso Propedéutico / Nivelación.',
      'Entrevista de perfilamiento técnico.'
    ]
  },
  ...REQUISITOS_PENDIENTES
];

const DATA_BASE = [
  {
    id: 'g1',
    nombre: 'Universidad Católica de El Salvador (UNICAES)',
    carrera: 'Licenciatura en Gastronomía y Hostelería',
    area: '🍳 Gastronomía',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Santa Ana',
    direccion: 'Bypass carretera a Metapán y carretera antigua a San Salvador, Santa Ana',
    telefono: '2484-0623',
    contactoDirecto: 'catolica@catolica.edu.sv',
    sitioWeb: 'https://www.catolica.edu.sv',
    comodidades: ['🔪 Cocinas Profesionales', '🍷 Taller de Enología', '📚 Biblioteca Central'],
    aceptaBeca: true
  },
  {
    id: 'g2',
    nombre: 'ITCA-FEPADE',
    carrera: 'Técnico en Gastronomía',
    area: '🍳 Gastronomía',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'Santa Tecla',
    direccion: 'Km 11.5, Carretera a Santa Tecla, La Libertad',
    telefono: '2132-7469',
    contactoDirecto: 'escueladealimentos@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['🔪 Cocinas Industriales', '🥐 Taller de Pastelería', '📶 Wi-Fi'],
    aceptaBeca: true
  },
  {
    id: 'g3',
    nombre: 'ITCA-FEPADE',
    carrera: 'Administración de Empresas Gastronómicas',
    area: '🍳 Gastronomía',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'Santa Tecla',
    direccion: 'Km 11.5, Carretera a Santa Tecla, La Libertad',
    telefono: '2132-7469',
    contactoDirecto: 'escueladealimentos@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['💼 Gestión de Restaurantes', '🔪 Cocina Demo'],
    aceptaBeca: true
  },
  {
    id: 'm1',
    nombre: 'Universidad de El Salvador (UES)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Ciudad Universitaria "Dr. Fabio Castillo Figueroa", Final Av. Mártires Estudiantes del 30 de julio',
    telefono: '2511-2000',
    contactoDirecto: 'secretaria.relaciones@ues.edu.sv',
    sitioWeb: 'https://www.ues.edu.sv',
    comodidades: ['🏥 Hospital de Prácticas', '🔬 Lab. Anatomía', '📚 Biblioteca Médica'],
    aceptaBeca: true
  },
  {
    id: 'm2',
    nombre: 'Universidad Dr. José Matías Delgado (UJMD)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'Antiguo Cuscatlán',
    direccion: 'Campus 1: Km. 8½ carretera a Santa Tecla, contiguo a Foro 4 TCS. Campus 2: Calle El Pedregal y Av. Finca El Espino, Antiguo Cuscatlán.',
    telefono: '2212-9400',
    contactoDirecto: 'contacto@ujmd.edu.sv',
    sitioWeb: 'https://www.ujmd.edu.sv',
    comodidades: ['🔬 Center for Health Simulation', '📚 Biblioteca Digital'],
    aceptaBeca: true
  },
  {
    id: 'm3',
    nombre: 'Universidad Evangélica de El Salvador (UEES)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Prolongación Alameda Juan Pablo II y Calle El Carmen, San Antonio Abad',
    telefono: '2275-4025',
    contactoDirecto: 'editorial@uees.edu.sv',
    sitioWeb: 'https://www.uees.edu.sv',
    comodidades: ['🔬 Simulación Clínica', '🏥 Convenios Hospitalarios'],
    aceptaBeca: true
  },
  {
    id: 'm4',
    nombre: 'Universidad Dr. Andrés Bello (UNAB)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador / Regionales',
    direccion: 'Sedes en San Salvador, Sonsonate, San Miguel y Chalatenango',
    telefono: '2240-8000',
    contactoDirecto: '2510-7400 (San Salvador)',
    sitioWeb: 'https://www.unab.edu.sv',
    comodidades: ['🔬 Laboratorios Multidisciplinarios', '📚 Biblioteca'],
    aceptaBeca: true
  },
  {
    id: 'm5',
    nombre: 'Universidad de Oriente (UNIVO)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Miguel',
    direccion: 'San Miguel, El Salvador',
    telefono: '2668-3700',
    contactoDirecto: 'orientacion@univo.edu.sv',
    sitioWeb: 'https://www.univo.edu.sv',
    comodidades: ['🔬 Lab de Microbiología', '🏥 Prácticas Clínicas'],
    aceptaBeca: true
  },
  {
    id: 'm6',
    nombre: 'Universidad Nueva San Salvador (UNSSA)',
    carrera: 'Doctorado en Medicina',
    area: '🩺 Medicina',
    tipo: 'Doctorado',
    duracion: '8 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: '4.ª Calle Poniente #2312, San Salvador',
    telefono: '2526-4500',
    contactoDirecto: 'unssa@unssa.edu.sv',
    sitioWeb: 'https://www.unssa.edu.sv',
    comodidades: ['🔬 Aulas Anatomofisiología', '📚 Biblioteca'],
    aceptaBeca: true
  },
  {
    id: 'l1',
    nombre: 'Universidad Centroamericana (UCA)',
    carrera: 'Licenciatura en Ciencias Jurídicas',
    area: '⚖️ Leyes',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Antiguo Cuscatlán',
    direccion: 'Bulevar de Los Próceres, Antiguo Cuscatlán, La Libertad',
    telefono: '2210-6600',
    contactoDirecto: 'conia@uca.edu.sv',
    sitioWeb: 'https://www.uca.edu.sv',
    comodidades: ['⚖️ Sala de Juicios Orales', '📚 Biblioteca Digital'],
    aceptaBeca: true
  },
  {
    id: 'l2',
    nombre: 'Universidad Tecnológica de El Salvador (UTEC)',
    carrera: 'Licenciatura en Ciencias Jurídicas',
    area: '⚖️ Leyes',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Calle Arce y 17 Av. Norte, San Salvador',
    telefono: '2275-8888',
    contactoDirecto: 'contactanos@utec.edu.sv',
    sitioWeb: 'https://www.utec.edu.sv',
    comodidades: ['🏛️ Sala de Audiencias', '📱 WhatsApp 6100-0777'],
    aceptaBeca: true
  },
  {
    id: 'l3',
    nombre: 'Universidad Francisco Gavidia (UFG)',
    carrera: 'Licenciatura en Ciencias Jurídicas',
    area: '⚖️ Leyes',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial / Semipresencial',
    ubicacion: 'San Salvador',
    direccion: '55 Avenida Sur, entre Alameda Roosevelt y Av. Olímpica',
    telefono: '2209-2834',
    contactoDirecto: 'admisiones@ufg.edu.sv',
    sitioWeb: 'https://www.ufg.edu.sv',
    comodidades: ['🏛️ Sala de Litigación', '📚 Biblioteca Virtual'],
    aceptaBeca: true
  },
  {
    id: 'l4',
    nombre: 'Universidad Pedagógica de El Salvador (UPED)',
    carrera: 'Licenciatura en Ciencias Jurídicas',
    area: '⚖️ Leyes',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Diagonal Dr. Arturo Romero y 25 Avenida Norte',
    telefono: '2205-8100',
    contactoDirecto: 'informacion@pedagogica.edu.sv',
    sitioWeb: 'https://www.pedagogica.edu.sv',
    comodidades: ['🏛️ Sala de Audiencias', '📚 Biblioteca Jurídica'],
    aceptaBeca: true
  },
  {
    id: 'i1',
    nombre: 'Universidad de El Salvador (UES)',
    carrera: 'Licenciatura en Idioma Inglés',
    area: '🗣️ Idiomas',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Ciudad Universitaria, San Salvador',
    telefono: '2511-2000',
    contactoDirecto: 'secretaria.relaciones@ues.edu.sv',
    sitioWeb: 'https://www.ues.edu.sv',
    comodidades: ['🎧 Lab. Fonético', '📚 Centro de Recursos'],
    aceptaBeca: true
  },
  {
    id: 'i2',
    nombre: 'Universidad de El Salvador (UES)',
    carrera: 'Licenciatura en Lenguas Modernas: Francés e Inglés',
    area: '🗣️ Idiomas',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Ciudad Universitaria, San Salvador',
    telefono: '2511-2000',
    contactoDirecto: 'secretaria.relaciones@ues.edu.sv',
    sitioWeb: 'https://www.ues.edu.sv',
    comodidades: ['🎧 Lab. Audiovisual', '📚 Biblioteca de Idiomas'],
    aceptaBeca: true
  },
  {
    id: 'i3',
    nombre: 'Universidad Don Bosco (UDB)',
    carrera: 'Licenciatura en Idiomas',
    area: '🗣️ Idiomas',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Soyapango',
    direccion: 'Calle a Plan del Pino Km 1½, Soyapango',
    telefono: '2251-8200',
    contactoDirecto: 'nuevo.ingreso@udb.edu.sv',
    sitioWeb: 'https://www.udb.edu.sv',
    comodidades: ['🎧 Lab Multimedia', '💬 Clubes de Conversación'],
    aceptaBeca: true
  },
  {
    id: 'ae1',
    nombre: 'Universidad Don Bosco (UDB)',
    carrera: 'Ingeniería en Aeronáutica',
    area: '✈️ Aeronáutica',
    tipo: 'Ingeniería',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Soyapango',
    direccion: 'Calle a Plan del Pino Km 1½, Soyapango',
    telefono: '2251-8200',
    contactoDirecto: 'nuevo.ingreso@udb.edu.sv',
    sitioWeb: 'https://www.udb.edu.sv',
    comodidades: ['✈️ Hangar Aeronáutico', '🔬 Lab. Aerodinámica'],
    aceptaBeca: true
  },
  {
    id: 'ae2',
    nombre: 'Universidad Don Bosco (UDB)',
    carrera: 'Técnico en Mantenimiento Aeronáutico',
    area: '✈️ Aeronáutica',
    tipo: 'Técnico',
    duracion: '3 Años',
    modalidad: 'Presencial',
    ubicacion: 'Soyapango',
    direccion: 'Calle a Plan del Pino Km 1½, Soyapango',
    telefono: '2251-8200',
    contactoDirecto: 'nuevo.ingreso@udb.edu.sv',
    sitioWeb: 'https://www.udb.edu.sv',
    comodidades: ['🛠️ Taller Turbinas', '✈️ Aviones de Práctica'],
    aceptaBeca: true
  },
  {
    id: 'au1',
    nombre: 'ITCA-FEPADE',
    carrera: 'Técnico en Mecánica y Electromovilidad Automotriz',
    area: '🚗 Automotriz',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'Santa Tecla',
    direccion: 'Km 11.5, Carretera a Santa Tecla, La Libertad',
    telefono: '2132-7506',
    contactoDirecto: 'automotriz@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['🚘 Banco de Diagnóstico', '⚡ Lab. Electromovilidad'],
    aceptaBeca: true
  },
  {
    id: 'ad1',
    nombre: 'Universidad Luterana Salvadoreña (ULS)',
    carrera: 'Licenciatura en Administración de Empresas',
    area: '💼 Administración',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'San Salvador',
    direccion: 'Campus Central, Barrio San Jacinto, San Salvador',
    telefono: '2133-2600',
    contactoDirecto: 'info@uls.edu.sv',
    sitioWeb: 'https://www.uls.edu.sv',
    comodidades: ['🏢 Centro de Incubación', '📚 Biblioteca'],
    aceptaBeca: true
  },
  {
    id: 't1',
    nombre: 'Universidad Francisco Gavidia (UFG)',
    carrera: 'Ingeniería en Desarrollo de Software',
    area: '💻 Tecnología',
    tipo: 'Ingeniería',
    duracion: '5 Años',
    modalidad: 'Presencial / Virtual',
    ubicacion: 'San Salvador',
    direccion: '55 Avenida Sur, Alameda Roosevelt',
    telefono: '2209-2834',
    contactoDirecto: 'admisiones@ufg.edu.sv',
    sitioWeb: 'https://www.ufg.edu.sv',
    comodidades: ['🔬 Lab. iMakers', '💻 Centro Nanotecnología'],
    aceptaBeca: true
  },
  {
    id: 't2',
    nombre: 'ITCA-FEPADE',
    carrera: 'Ingeniería en Desarrollo de Software',
    area: '💻 Tecnología',
    tipo: 'Ingeniería',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Santa Tecla',
    direccion: 'Km 11.5, Carretera a Santa Tecla',
    telefono: '2132-7400',
    contactoDirecto: 'sistemas@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['💻 Lab. Servidores', '📶 Wi-Fi Campus'],
    aceptaBeca: true
  },
  {
    id: 'lp1',
    nombre: 'ITCA-FEPADE',
    carrera: 'Técnico Superior en Logística Global (MEGATEC Zacatecoluca)',
    area: '💼 Administración',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'La Paz (Zacatecoluca)',
    direccion: 'Km 56.5 Carretera a Costa del Sol, Zacatecoluca, La Paz',
    telefono: '2334-0700',
    contactoDirecto: 'megateczacatecoluca@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['📦 Centro Logístico', '💻 Lab. de Informática'],
    aceptaBeca: true
  },
  {
    id: 'lu1',
    nombre: 'ITCA-FEPADE',
    carrera: 'Técnico en Administración y Operación Portuaria (MEGATEC La Unión)',
    area: '💼 Administración',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'La Unión',
    direccion: 'Carretera a Ruta Militar, La Unión',
    telefono: '2604-2000',
    contactoDirecto: 'megateclaunion@itca.edu.sv',
    sitioWeb: 'https://www.itca.edu.sv',
    comodidades: ['🚢 Simulación Marítima', '📚 Biblioteca Digital'],
    aceptaBeca: true
  },
  {
    id: 'cab1',
    nombre: 'Universidad Luterana Salvadoreña (ULS)',
    carrera: 'Licenciatura en Trabajo Social (Centro Cabañas)',
    area: '🧠 Ciencias Sociales',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Cabañas (Sensuntepeque)',
    direccion: '3ra Calle Oriente y 8va Avenida Norte #2, Sensuntepeque, Cabañas',
    telefono: '2133-2600',
    contactoDirecto: 'cabanas@uls.edu.sv',
    sitioWeb: 'https://www.uls.edu.sv',
    comodidades: ['📚 Biblioteca Regional', '📶 Wi-Fi'],
    aceptaBeca: true
  },
  {
    id: 'cab2',
    nombre: 'Universidad Católica de El Salvador (UNICAES)',
    carrera: 'Técnico en Lácteos y Cárnicos (Centro Regional Ilobasco)',
    area: '🌱 Agro y Ambiente',
    tipo: 'Técnico',
    duracion: '2 Años',
    modalidad: 'Presencial',
    ubicacion: 'Cabañas (Ilobasco)',
    direccion: 'Carretera a Ilobasco, Cabañas',
    telefono: '2384-2000',
    contactoDirecto: 'ilobasco@catolica.edu.sv',
    sitioWeb: 'https://www.catolica.edu.sv',
    comodidades: ['🥛 Planta Procesadora', '🔬 Lab. Agroindustrial'],
    aceptaBeca: true
  },
  {
    id: 'ahu1',
    nombre: 'Universidad Panamericana de El Salvador (UPAN)',
    carrera: 'Licenciatura en Mercadotecnia (Centro Regional Ahuachapán)',
    area: '💼 Administración',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Ahuachapán',
    direccion: 'Barrio El Calvario, 2a Ave. Norte, Ahuachapán',
    telefono: '2486-0700',
    contactoDirecto: 'ahuachapan@upan.edu.sv',
    sitioWeb: 'https://upan.edu.sv',
    comodidades: ['🏢 Aulas Climatizadas', '💻 Lab de Informática'],
    aceptaBeca: true
  },
  {
    id: 'cus1',
    nombre: 'Universidad Modular Abierta (UMA)',
    carrera: 'Licenciatura en Administración de Empresas',
    area: '💼 Administración',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial / Semipresencial',
    ubicacion: 'Cuscatlán (Cojutepeque)',
    direccion: 'Calle Francisco Menéndez, Cojutepeque, Cuscatlán',
    telefono: '2372-0000',
    contactoDirecto: 'cojutepeque@uma.edu.sv',
    sitioWeb: 'https://www.uma.edu.sv',
    comodidades: ['🏢 Aulas Climatizadas', '📚 Biblioteca'],
    aceptaBeca: true
  },
  {
    id: 'mor1',
    nombre: 'Universidad Gerardo Barrios (UGB)',
    carrera: 'Licenciatura en Enfermería (Sede Morazán)',
    area: '💉 Salud',
    tipo: 'Licenciatura',
    duracion: '5 Años',
    modalidad: 'Presencial',
    ubicacion: 'Morazán (San Francisco Gotera)',
    direccion: 'Barrio El Carmen, San Francisco Gotera, Morazán',
    telefono: '2654-0000',
    contactoDirecto: 'morazan@ugb.edu.sv',
    sitioWeb: 'https://www.ugb.edu.sv',
    comodidades: ['🔬 Laboratorio de Simulación', '📚 Biblioteca Central'],
    aceptaBeca: true
  }
];

const COORDENADAS = {
  g1:  { latitude: 13.9906, longitude: -89.5517 },
  g2:  { latitude: 13.6747, longitude: -89.2800 },
  g3:  { latitude: 13.6747, longitude: -89.2800 },
  m1:  { latitude: 13.7184, longitude: -89.2043 },
  m2:  { latitude: 13.6775, longitude: -89.2506 },
  m3:  { latitude: 13.7130, longitude: -89.2060 },
  m4:  { latitude: 13.6996, longitude: -89.2236 },
  m5:  { latitude: 13.4800, longitude: -88.1750 },
  m6:  { latitude: 13.7000, longitude: -89.2360 },
  l1:  { latitude: 13.6810, longitude: -89.2362 },
  l2:  { latitude: 13.7025, longitude: -89.2065 },
  l3:  { latitude: 13.6930, longitude: -89.2370 },
  l4:  { latitude: 13.7095, longitude: -89.2090 },
  i1:  { latitude: 13.7184, longitude: -89.2043 },
  i2:  { latitude: 13.7184, longitude: -89.2043 },
  i3:  { latitude: 13.7118, longitude: -89.1545 },
  ae1: { latitude: 13.7118, longitude: -89.1545 },
  ae2: { latitude: 13.7118, longitude: -89.1545 },
  au1: { latitude: 13.6747, longitude: -89.2800 },
  ad1: { latitude: 13.6850, longitude: -89.1980 },
  t1:  { latitude: 13.6930, longitude: -89.2370 },
  t2:  { latitude: 13.6747, longitude: -89.2800 },
  lp1: { latitude: 13.3880, longitude: -88.8780 },
  lu1: { latitude: 13.3360, longitude: -87.8420 },
  cab1:{ latitude: 13.8770, longitude: -88.6320 },
  cab2:{ latitude: 13.8410, longitude: -88.8480 },
  ahu1:{ latitude: 13.9210, longitude: -89.8450 },
  cus1:{ latitude: 13.7230, longitude: -88.9340 },
  mor1:{ latitude: 13.6950, longitude: -88.1060 }
};

const BECA_DI = '🎓 Beca de la Dirección de Integración';

const crearOfertas = (clave, inst, lista) =>
  lista.map(([carrera, area, tipo, duracion, modalidad, cupos], i) => ({
    id: `${clave}${i + 1}`,
    nombre: inst.nombre,
    carrera,
    area,
    tipo,
    duracion,
    modalidad,
    ubicacion: inst.ubicacion,
    direccion: inst.direccion,
    telefono: inst.telefono,
    contactoDirecto: inst.contactoDirecto,
    sitioWeb: inst.sitioWeb,
    comodidades: [BECA_DI, ...(inst.cupos || []), ...(cupos ? [`🎟️ Cupos de esta carrera: ${cupos}`] : [])],
    aceptaBeca: true,
    origen: 'DI',
    latitude: inst.latitude,
    longitude: inst.longitude
  }));

const heredarDe = (idBase, cupos) => {
  const b = DATA_BASE.find((u) => u.id === idBase);
  return {
    nombre: b?.nombre || '',
    ubicacion: b?.ubicacion || '',
    direccion: b?.direccion || '',
    telefono: b?.telefono || '',
    contactoDirecto: b?.contactoDirecto || '',
    sitioWeb: b?.sitioWeb || '',
    cupos,
    ...(COORDENADAS[idBase] || {})
  };
};

const OFERTAS_NUEVAS_INSTITUCIONES = [
  ...crearOfertas('upan', {
    nombre: 'Universidad Panamericana de El Salvador (UPAN)',
    ubicacion: 'San Salvador',
    direccion: 'Calle El Progreso #264, colonia Miramonte Poniente, San Salvador',
    telefono: '2527-2000',
    contactoDirecto: 'upan.edu.sv',
    sitioWeb: 'https://upan.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 155 presenciales (nivel departamental)'],
    latitude: 13.7085, longitude: -89.225
  }, [
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Bibliotecología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Contaduría Pública', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Mercadotecnia', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Trabajo Social', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('umoar', {
    nombre: 'Universidad Monseñor Oscar Arnulfo Romero (UMOAR)',
    ubicacion: 'Tejutla, Chalatenango',
    direccion: 'Km 53.5, carretera Longitudinal del Norte, desvío Las Aldeítas, Tejutla, Chalatenango',
    telefono: '2302-1800',
    contactoDirecto: 'facebook.com/umoarsv',
    sitioWeb: 'https://www.facebook.com/umoarsv',
    cupos: ['🎟️ Cupos de la institución: 400 presenciales (nivel departamental)'],
    latitude: 14.14, longitude: -89.085
  }, [
    ['Ingeniería en Agronomía', '🌱 Agro y Ambiente', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias de la Computación', '💻 Tecnología', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Contaduría Pública', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('esen', {
    nombre: 'Escuela Superior de Economía y Negocios (ESEN)',
    ubicacion: 'Comasagua',
    direccion: 'Km 12.5 carretera al Puerto de La Libertad, calle nueva a Comasagua, Santa Tecla, La Libertad',
    telefono: '7540-3977',
    contactoDirecto: 'www.esen.edu.sv',
    sitioWeb: 'https://www.esen.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 10 presenciales (nivel nacional)'],
    latitude: 13.65, longitude: -89.295
  }, [
    ['Ingeniería de Negocios', '💼 Administración', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Ingeniería de Software y Negocios Digitales', '💻 Tecnología', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Economía y Negocios', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('ecmh', {
    nombre: 'Escuela de Comunicación Mónica Herrera (ECMH)',
    ubicacion: 'Santa Tecla',
    direccion: 'Avenida Dr. Manuel Gallardo 3-3, Santa Tecla, La Libertad',
    telefono: '2507-6500',
    contactoDirecto: 'monicaherrera.edu.sv',
    sitioWeb: 'https://monicaherrera.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 5 presenciales (nivel departamental)'],
    latitude: 13.676, longitude: -89.28
  }, [
    ['Licenciatura en Comunicación y Estrategia Digital', '🎨 Diseño y Comunicación', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Comunicaciones Integradas de Marketing', '🎨 Diseño y Comunicación', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Diseño Estratégico', '🎨 Diseño y Comunicación', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('ugb', {
    nombre: 'Universidad Gerardo Barrios (UGB)',
    ubicacion: 'Usulután',
    direccion: 'Ruta Cañera, km 113, Santa María, Usulután',
    telefono: '2645-6500',
    contactoDirecto: 'www.ugb.edu.sv',
    sitioWeb: 'https://www.ugb.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 115 presenciales y 535 semipresenciales (nivel nacional)'],
    latitude: 13.36, longitude: -88.43
  }, [
    ['Ingeniería en Sistemas y Redes Informáticas', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Semipresencial', 100],
    ['Licenciatura en Idioma Inglés', '🗣️ Idiomas', 'Licenciatura', '5 Años', 'Semipresencial', null]
  ]),
  ...crearOfertas('uma', {
    nombre: 'Universidad Modular Abierta (UMA)',
    ubicacion: 'San Salvador',
    direccion: '1.ª calle poniente #2817, San Salvador',
    telefono: '2260-5320',
    contactoDirecto: 'www.uma.edu.sv',
    sitioWeb: 'https://www.uma.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 300 presenciales (nivel departamental)'],
    latitude: 13.701, longitude: -89.226
  }, [
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Contaduría Pública', '💼 Administración', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Informática', '💻 Tecnología', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Psicología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('ucad', {
    nombre: 'Universidad Cristiana de las Asambleas de Dios (UCAD)',
    ubicacion: 'San Salvador',
    direccion: '27 Calle Oriente N134, Barrio San Miguelito, San Salvador',
    telefono: '2520-7500',
    contactoDirecto: 'www.ucad.edu.sv',
    sitioWeb: 'https://www.ucad.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 325 semipresenciales'],
    latitude: 13.71, longitude: -89.211
  }, [
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Ingeniería en Ciencias de la Computación', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', null]
  ]),
  ...crearOfertas('upes', {
    nombre: 'Universidad Politécnica de El Salvador (UPES)',
    ubicacion: 'San Salvador',
    direccion: 'Frente al redondel José Martí, Boulevard Tutunichapa, San Salvador',
    telefono: '2231-8820',
    contactoDirecto: 'upes.edu.sv',
    sitioWeb: 'https://upes.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 75 presenciales y 1,025 semipresenciales'],
    latitude: 13.712, longitude: -89.206
  }, [
    ['Licenciatura en Psicología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Arquitectura', '🏗️ Ingeniería y Arquitectura', 'Arquitectura', '5 Años', 'Semipresencial', null],
    ['Ingeniería Civil', '🏗️ Ingeniería y Arquitectura', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Ingeniería en Ciencias de la Computación', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null]
  ]),
  ...crearOfertas('usam', {
    nombre: 'Universidad Salvadoreña Alberto Masferrer (USAM)',
    ubicacion: 'San Salvador',
    direccion: '19.ª avenida norte, San Salvador',
    telefono: '2231-9600',
    contactoDirecto: 'usam.edu.sv',
    sitioWeb: 'https://usam.edu.sv',
    cupos: ['🎟️ Cupos de la institución: 240 presenciales'],
    latitude: 13.701, longitude: -89.205
  }, [
    ['Doctorado en Medicina', '🩺 Medicina', 'Doctorado', '8 Años', 'Presencial', 25],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Licenciatura en Química y Farmacia', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', 25]
  ]),
  ...crearOfertas('unasa', {
    nombre: 'Universidad Autónoma de Santa Ana (UNASA)',
    ubicacion: 'Santa Ana',
    direccion: 'Autopista Sur Poniente, km 63½ carretera Panamericana, Santa Ana',
    telefono: '2240-0245',
    contactoDirecto: 'unasa.edu.sv',
    sitioWeb: 'https://unasa.edu.sv',
    cupos: [],
    latitude: 13.98, longitude: -89.57
  }, [
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', 30],
    ['Licenciatura en Fisioterapia', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', 10],
    ['Licenciatura en Laboratorio Clínico', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', 10]
  ]),
  ...crearOfertas('uso', {
    nombre: 'Universidad de Sonsonate (USO)',
    ubicacion: 'Sonsonate',
    direccion: 'Calle Ing. Jesús Adalberto Díaz Pineda, Sonsonate',
    telefono: '2429-9500',
    contactoDirecto: 'usonsonate.edu.sv',
    sitioWeb: 'https://usonsonate.edu.sv',
    cupos: [],
    latitude: 13.72, longitude: -89.715
  }, [
    ['Ingeniería en Sistemas', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', 15],
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Semipresencial', 20],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', 11]
  ]),
  ...crearOfertas('esintec', {
    nombre: 'Esintec Institute (ESINTEC)',
    ubicacion: 'San Salvador',
    direccion: 'Calle al Mirador, Torre Quattro, San Salvador',
    telefono: '2264-5000',
    contactoDirecto: 'www.esintec.edu.sv',
    sitioWeb: 'https://www.esintec.edu.sv',
    cupos: ['🎟️ Cupos: 200 semipresenciales'],
    latitude: 13.704, longitude: -89.238
  }, [
    ['Licenciatura en Informática y Ciberseguridad', '💻 Tecnología', 'Licenciatura', '5 Años', 'Semipresencial', null]
  ]),
  ...crearOfertas('ieproes', {
    nombre: 'Instituto Especializado de Profesionales de la Salud (IEPROES)',
    ubicacion: 'San Miguel',
    direccion: '10.ª avenida sur y 13 calle oriente #801, San Miguel',
    telefono: '2660-3288',
    contactoDirecto: 'ieproes.edu.sv',
    sitioWeb: 'https://ieproes.edu.sv',
    cupos: ['🎟️ Cupos: 900 presenciales'],
    latitude: 13.478, longitude: -88.174
  }, [
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', null],
    ['Tecnólogo en Enfermería', '💉 Salud', 'Tecnólogo', '3 Años', 'Presencial', null]
  ]),
  ...crearOfertas('iehes', {
    nombre: 'Instituto Especializado Hospital de El Salvador (IEHES)',
    ubicacion: 'San Salvador',
    direccion: 'Urbanización Lomas de San Francisco, San Salvador',
    telefono: '7264-2240',
    contactoDirecto: 'iehes.edu.sv',
    sitioWeb: 'https://iehes.edu.sv',
    cupos: ['🎟️ Cupos: 310 presenciales'],
    latitude: 13.689, longitude: -89.248
  }, [
    ['Ingeniería en Inteligencia Artificial e Informática en Salud', '💻 Tecnología', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', null]
  ])
];

const OFERTAS_NUEVAS_CARRERAS = [
  ...crearOfertas('ufg', heredarDe('l3', ['🎟️ Cupos de la institución: 819 presenciales']), [
    ['Arquitectura', '🏗️ Ingeniería y Arquitectura', 'Arquitectura', '5 Años', 'Presencial', null],
    ['Ingeniería Civil y Construcción', '🏗️ Ingeniería y Arquitectura', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Ingeniería en Sistemas y Ciberseguridad', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Psicología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('ujmd', heredarDe('m2', ['🎟️ Cupos de la institución: 490 presenciales']), [
    ['Arquitectura', '🏗️ Ingeniería y Arquitectura', 'Arquitectura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Psicología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Semipresencial', null]
  ]),
  ...crearOfertas('unicaes', heredarDe('g1', ['🎟️ Cupos de la institución: 559 presenciales']), [
    ['Doctorado en Medicina', '🩺 Medicina', 'Doctorado', '8 Años', 'Presencial', 50],
    ['Ingeniería Civil', '🏗️ Ingeniería y Arquitectura', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Ingeniería en Sistemas Informáticos', '💻 Tecnología', 'Ingeniería', '5 Años', 'Presencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Presencial', null]
  ]),
  ...crearOfertas('univo', heredarDe('m5', ['🎟️ Cupos de la institución: 100 presenciales']), [
    ['Ingeniería en Desarrollo de Software', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', 30],
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Presencial', 100],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', 30]
  ]),
  ...crearOfertas('unab', heredarDe('m4', ['🎟️ Cupos San Salvador: 644 semipresenciales']), [
    ['Ingeniería en Sistemas y Computación', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Ciencias Jurídicas', '⚖️ Leyes', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Enfermería', '💉 Salud', 'Licenciatura', '5 Años', 'Semipresencial', 40]
  ]),
  ...crearOfertas('utec', heredarDe('l2', ['🎟️ Cupos de la institución: 225 semipresenciales']), [
    ['Ingeniería en Sistemas y Computación', '💻 Tecnología', 'Ingeniería', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Administración de Empresas', '💼 Administración', 'Licenciatura', '5 Años', 'Semipresencial', null],
    ['Licenciatura en Psicología', '🧠 Ciencias Sociales', 'Licenciatura', '5 Años', 'Semipresencial', null]
  ])
];

const OFERTAS_NUEVAS = [...OFERTAS_NUEVAS_INSTITUCIONES, ...OFERTAS_NUEVAS_CARRERAS];

const DATA_UNIVERSIDADES = [...DATA_BASE, ...OFERTAS_NUEVAS].map((uni) => ({
  ...uni,
  ...(COORDENADAS[uni.id] || {})
}));

const SEDES_UNIVERSIDADES = {
  'Universidad de El Salvador (UES)': [
    { nombre: 'Sede Central (San Salvador)', direccion: 'Ciudad Universitaria, San Salvador', latitude: 13.7184, longitude: -89.2043 },
    { nombre: 'Facultad Multidisciplinaria de Occidente', direccion: 'Santa Ana, Santa Ana', latitude: 13.985, longitude: -89.56 },
    { nombre: 'Facultad Multidisciplinaria Oriental', direccion: 'San Miguel, San Miguel', latitude: 13.4586, longitude: -88.162 },
    { nombre: 'Facultad Multidisciplinaria Paracentral', direccion: 'San Vicente, San Vicente', latitude: 13.639, longitude: -88.787 }
  ],
  'ITCA-FEPADE': [
    { nombre: 'Sede Central (Santa Tecla)', direccion: 'Km 11.5, Carretera a Santa Tecla, La Libertad', latitude: 13.6747, longitude: -89.28 },
    { nombre: 'Regional Santa Ana', direccion: 'Carretera a San Salvador, Santa Ana', latitude: 13.964, longitude: -89.556 },
    { nombre: 'Regional San Miguel', direccion: 'Carretera a Santa Rosa de Lima, San Miguel', latitude: 13.465, longitude: -88.156 },
    { nombre: 'MEGATEC Zacatecoluca (La Paz)', direccion: 'Km 56.5 Carretera a Costa del Sol, Zacatecoluca, La Paz', latitude: 13.388, longitude: -88.878 },
    { nombre: 'MEGATEC La Unión', direccion: 'Carretera a Ruta Militar, La Unión', latitude: 13.336, longitude: -87.842 }
  ],
  'Universidad Católica de El Salvador (UNICAES)': [
    { nombre: 'Sede Central (Santa Ana)', direccion: 'Bypass carretera a Metapán, Santa Ana', latitude: 13.9906, longitude: -89.5517 },
    { nombre: 'Centro Regional de Ilobasco (Cabañas)', direccion: 'Carretera a Ilobasco, Cabañas', latitude: 13.841, longitude: -88.848 }
  ],
  'Universidad Gerardo Barrios (UGB)': [
    { nombre: 'Sede Usulután', direccion: 'Ruta Cañera, Usulután', latitude: 13.36, longitude: -88.43 },
    { nombre: 'Sede San Miguel', direccion: 'Colonia Escolán, San Miguel', latitude: 13.475, longitude: -88.17 },
    { nombre: 'Sede Morazán', direccion: 'Barrio El Carmen, San Francisco Gotera, Morazán', latitude: 13.695, longitude: -88.106 }
  ],
  'Universidad Luterana Salvadoreña (ULS)': [
    { nombre: 'Sede Central (San Salvador)', direccion: 'Barrio San Jacinto, San Salvador', latitude: 13.685, longitude: -89.198 },
    { nombre: 'Centro Universitario Cabañas', direccion: 'Sensuntepeque, Cabañas', latitude: 13.877, longitude: -88.632 }
  ],
  'Universidad Panamericana de El Salvador (UPAN)': [
    { nombre: 'Sede Central (San Salvador)', direccion: 'Colonia Miramonte, San Salvador', latitude: 13.7085, longitude: -89.225 },
    { nombre: 'Centro Regional Ahuachapán', direccion: 'Barrio El Calvario, Ahuachapán', latitude: 13.921, longitude: -89.845 },
    { nombre: 'Sede Cojutepeque (Cuscatlán)', direccion: 'Barrio San Nicolás, Cojutepeque', latitude: 13.723, longitude: -88.934 }
  ]
};

const UBICACIONES_SIN_OFERTA = {
  'Universidad Albert Einstein (UAE)': 'Universidad Albert Einstein, El Salvador',
  'Universidad Internacional Nehemías (NIU)': 'Universidad Internacional Nehemías, San Salvador, El Salvador',
  'Universidad Técnica Latinoamericana (UTLA)': 'Universidad Técnica Latinoamericana, La Libertad, El Salvador',
  'Escuela Superior Franciscana Especializada (ESFE/AGAPE)': 'Escuela Superior Franciscana Especializada AGAPE, San Salvador',
  'Escuela Nacional de Agricultura (ENA)': 'Escuela Nacional de Agricultura Roberto Quiñónez, La Libertad',
  'Escuela Militar Capitán General Gerardo Barrios (EMCGGB)': 'Escuela Militar Capitán General Gerardo Barrios, El Salvador'
};

const DEPARTAMENTOS = [
  'Ahuachapán', 'Santa Ana', 'Sonsonate', 'Chalatenango', 'La Libertad',
  'San Salvador', 'Cuscatlán', 'La Paz', 'Cabañas', 'San Vicente',
  'Usulután', 'San Miguel', 'Morazán', 'La Unión'
];

const CATALOGO_BASE = [
  {
    nombre: 'Universidad de El Salvador (UES)',
    departamentos: ['San Salvador', 'Santa Ana', 'San Miguel', 'San Vicente', 'Morazán', 'Ahuachapán', 'La Paz'],
    facultades: [
      { nombre: 'Ciencias Agronómicas', carreras: ['Ingeniería Agronómica', 'Medicina Veterinaria'] },
      { nombre: 'Ciencias Económicas', carreras: ['Administración de Empresas', 'Contaduría Pública'] },
      { nombre: 'Medicina', carreras: ['Doctorado en Medicina', 'Enfermería', 'Laboratorio Clínico'] },
      { nombre: 'Ingeniería y Arquitectura', carreras: ['Arquitectura', 'Ingeniería Civil', 'Ingeniería Industrial'] }
    ]
  },
  {
    nombre: 'Universidad Modular Abierta (UMA)',
    departamentos: ['San Salvador', 'San Miguel', 'Santa Ana', 'Sonsonate', 'Cuscatlán', 'Usulután'],
    facultades: [
      { nombre: 'Ciencias Económicas', carreras: ['Licenciatura en Administración de Empresas', 'Contaduría Pública'] },
      { nombre: 'Ciencias Jurídicas', carreras: ['Licenciatura en Ciencias Jurídicas'] }
    ]
  },
  {
    nombre: 'Universidad Dr. Andrés Bello (UNAB)',
    departamentos: ['San Salvador', 'Sonsonate', 'San Miguel', 'Chalatenango', 'Cuscatlán', 'Morazán'],
    facultades: [
      { nombre: 'Ciencias de la Salud', carreras: ['Enfermería', 'Doctorado en Medicina'] }
    ]
  },
  {
    nombre: 'ITCA-FEPADE',
    departamentos: ['La Libertad', 'Santa Ana', 'San Miguel', 'La Unión', 'La Paz', 'Usulután'],
    facultades: [
      { nombre: 'Escuela de Alimentos', carreras: ['Técnico en Gastronomía'] },
      { nombre: 'Escuela de Automotriz', carreras: ['Técnico en Mecánica Automotriz'] },
      { nombre: 'MEGATEC La Paz / La Unión', carreras: ['Técnico Superior en Logística Global', 'Técnico en Operación Portuaria'] }
    ]
  },
  {
    nombre: 'Universidad Católica de El Salvador (UNICAES)',
    departamentos: ['Santa Ana', 'Cabañas'],
    facultades: [
      { nombre: 'Gastronomía y Hostelería', carreras: ['Licenciatura en Gastronomía y Hostelería'] },
      { nombre: 'Técnicos Agroindustriales', carreras: ['Técnico en Lácteos y Cárnicos', 'Técnico en Enfermería'] }
    ]
  },
  {
    nombre: 'Universidad Luterana Salvadoreña (ULS)',
    departamentos: ['San Salvador', 'Cabañas'],
    facultades: [
      { nombre: 'Ciencias Sociales', carreras: ['Licenciatura en Trabajo Social', 'Licenciatura en Ciencias Jurídicas'] }
    ]
  },
  {
    nombre: 'Universidad Panamericana de El Salvador (UPAN)',
    departamentos: ['Ahuachapán', 'San Salvador', 'San Vicente', 'Cuscatlán'],
    facultades: [
      { nombre: 'Ciencias Empresariales', carreras: ['Licenciatura en Mercadotecnia', 'Administración de Empresas'] }
    ]
  },
  {
    nombre: 'Universidad Gerardo Barrios (UGB)',
    departamentos: ['San Miguel', 'Usulután', 'Morazán', 'La Unión'],
    facultades: [
      { nombre: 'Ciencias de la Salud', carreras: ['Licenciatura en Enfermería'] },
      { nombre: 'Tecnología', carreras: ['Ingeniería en Sistemas y Redes Informáticas'] }
    ]
  },
  {
    nombre: 'Universidad Autónoma de Santa Ana (UNASA)',
    departamentos: ['Santa Ana', 'Ahuachapán'],
    facultades: [
      { nombre: 'Ciencias de la Salud', carreras: ['Licenciatura en Enfermería', 'Licenciatura en Fisioterapia'] }
    ]
  },
  {
    nombre: 'Universidad Centroamericana (UCA)',
    departamentos: ['La Libertad'],
    facultades: [
      { nombre: 'Ciencias Jurídicas', carreras: ['Licenciatura en Ciencias Jurídicas'] }
    ]
  },
  {
    nombre: 'Universidad Dr. José Matías Delgado (UJMD)',
    departamentos: ['La Libertad'],
    facultades: []
  },
  {
    nombre: 'Universidad Tecnológica de El Salvador (UTEC)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Francisco Gavidia (UFG)',
    departamentos: ['San Salvador', 'Santa Ana'],
    facultades: []
  },
  {
    nombre: 'Universidad Don Bosco (UDB)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Evangélica de El Salvador (UEES)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Pedagógica de El Salvador (UPED)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad de Oriente (UNIVO)',
    departamentos: ['San Miguel', 'Morazán', 'La Unión'],
    facultades: []
  },
  {
    nombre: 'Universidad Nueva San Salvador (UNSSA)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Monseñor Oscar Arnulfo Romero (UMOAR)',
    departamentos: ['Chalatenango'],
    facultades: []
  },
  {
    nombre: 'Escuela Superior de Economía y Negocios (ESEN)',
    departamentos: ['La Libertad'],
    facultades: []
  },
  {
    nombre: 'Escuela de Comunicación Mónica Herrera (ECMH)',
    departamentos: ['La Libertad'],
    facultades: []
  },
  {
    nombre: 'Universidad Cristiana de las Asambleas de Dios (UCAD)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Politécnica de El Salvador (UPES)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad Salvadoreña Alberto Masferrer (USAM)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Universidad de Sonsonate (USO)',
    departamentos: ['Sonsonate'],
    facultades: []
  },
  {
    nombre: 'Esintec Institute (ESINTEC)',
    departamentos: ['San Salvador'],
    facultades: []
  },
  {
    nombre: 'Instituto Especializado de Profesionales de la Salud (IEPROES)',
    departamentos: ['San Salvador', 'San Miguel', 'Santa Ana'],
    facultades: []
  },
  {
    nombre: 'Instituto Especializado Hospital de El Salvador (IEHES)',
    departamentos: ['San Salvador'],
    facultades: []
  }
];

const sinEmoji = (texto) => texto.replace(/^\S+\s/, '');

const CATALOGO_UNIVERSIDADES = CATALOGO_BASE.map((uni) => {
  const ofertas = DATA_UNIVERSIDADES.filter((o) => o.nombre === uni.nombre);
  if (ofertas.length === 0) return uni;

  const sinCarreras = uni.facultades.length === 0 || uni.facultades.every((f) => f.carreras.length === 0);

  if (sinCarreras) {
    const grupos = {};
    ofertas.forEach((o) => {
      const clave = sinEmoji(o.area);
      grupos[clave] = grupos[clave] || [];
      if (!grupos[clave].includes(o.carrera)) grupos[clave].push(o.carrera);
    });
    return {
      ...uni,
      facultades: Object.keys(grupos).map((nombre) => ({ nombre, carreras: grupos[nombre] }))
    };
  }

  const todas = [];
  ofertas.forEach((o) => {
    if (!todas.includes(o.carrera)) todas.push(o.carrera);
  });
  return {
    ...uni,
    facultades: [...uni.facultades, { nombre: 'Oferta con beca de Integración', carreras: todas }]
  };
});

const CATEGORIAS = [
  { id: 'todas', label: '🌐 Todas' },
  { id: '🍳 Gastronomía', label: '🍳 Gastronomía' },
  { id: '🩺 Medicina', label: '🩺 Medicina' },
  { id: '⚖️ Leyes', label: '⚖️ Leyes' },
  { id: '🗣️ Idiomas', label: '🗣️ Idiomas' },
  { id: '✈️ Aeronáutica', label: '✈️ Aeronáutica' },
  { id: '🚗 Automotriz', label: '🚗 Automotriz' },
  { id: '💼 Administración', label: '💼 Administración' },
  { id: '💻 Tecnología', label: '💻 Tecnología' },
  { id: '💉 Salud', label: '💉 Salud' },
  { id: '🏗️ Ingeniería y Arquitectura', label: '🏗️ Ingeniería y Arquitectura' },
  { id: '🌱 Agro y Ambiente', label: '🌱 Agro y Ambiente' },
  { id: '🎓 Educación', label: '🎓 Educación' },
  { id: '🧠 Ciencias Sociales', label: '🧠 Ciencias Sociales' },
  { id: '🎨 Diseño y Comunicación', label: '🎨 Diseño y Comunicación' }
];

const LOGOS_UNIVERSIDADES = {
  'Universidad de El Salvador (UES)': 'https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20de%20la%20Universidad%20de%20El%20Salvador.svg?width=300',
  'Universidad Centroamericana (UCA)': 'https://www.utec.edu.sv/assets/img/a_nacionales/lg_uca.png',
  'Universidad Católica de El Salvador (UNICAES)': 'https://catolica.edu.sv/wp-content/uploads/2025/03/LOGO_UNICAES_1.png',
  'Universidad Don Bosco (UDB)': 'https://www.udb.edu.sv/udb/public/img/logos/logo_universidaddonbosco.png',
  'Universidad Francisco Gavidia (UFG)': 'https://commons.wikimedia.org/wiki/Special:FilePath/Francisco%20Gavidia%20University%20logo.svg?width=400',
  'ITCA-FEPADE': 'https://www.itca.edu.sv/wp-content/uploads/2025/01/LogoITCA_Web.png',
  'Universidad Dr. José Matías Delgado (UJMD)': 'https://www.ujmd.edu.sv/wp-content/uploads/2022/07/cropped-Logo-UJMD_Azul-2-270x270.png',
  'Universidad Evangélica de El Salvador (UEES)': 'https://www.uees.edu.sv/wp-content/uploads/2023/03/cropped-logo-uees.jpg',
  'Universidad Dr. Andrés Bello (UNAB)': 'https://www.unab.edu.sv/wp-content/uploads/2026/02/cropped-favicon-270x270.png',
  'Universidad de Oriente (UNIVO)': 'https://www.univo.edu.sv/wp-content/uploads/2022/01/cropped-LOGOESCUDO-1024x1024.png',
  'Universidad Tecnológica de El Salvador (UTEC)': 'https://www.utec.edu.sv/assets/img/commons/utec_brand.png',
  'Universidad Pedagógica de El Salvador (UPED)': 'https://www.pedagogica.edu.sv/wp-content/uploads/2026/01/favicon.png',
  'Universidad Luterana Salvadoreña (ULS)': 'https://uls.edu.sv/sitioweb/wp-content/uploads/2024/08/logo-ULS.png',
  'Universidad Panamericana de El Salvador (UPAN)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadpanamericana.png',
  'Universidad Monseñor Oscar Arnulfo Romero (UMOAR)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadmonsenoroscararnulforomero.png',
  'Escuela Superior de Economía y Negocios (ESEN)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/1789683910874-itksti7g05pz0fh9.webp',
  'Escuela de Comunicación Mónica Herrera (ECMH)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/1790365569317-yiwac79vlivt2wrn.webp',
  'Universidad Gerardo Barrios (UGB)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadgerardobarrios.png',
  'Universidad Modular Abierta (UMA)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadmodularabierta.png',
  'Universidad Cristiana de las Asambleas de Dios (UCAD)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidaddelasasambleasdedios.png',
  'Universidad Politécnica de El Salvador (UPES)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadpolitecnicadeelsalvador.png',
  'Universidad Salvadoreña Alberto Masferrer (USAM)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidadsalvadorenaalbertomasferrer.png',
  'Universidad Autónoma de Santa Ana (UNASA)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/1790297392090-il8eh87o900x1m5e.webp',
  'Universidad de Sonsonate (USO)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/universidaddesonsonate.png',
  'Esintec Institute (ESINTEC)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/1790011871421-o5o1czrb681lam4p.webp',
  'Instituto Especializado de Profesionales de la Salud (IEPROES)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/institutoespecializadodeprofesionalesdelasalud.png',
  'Instituto Especializado Hospital de El Salvador (IEHES)': 'https://ofertaacademica.culturadelaintegracion.com/uploads/institutoespecializadohospitaldeelsalvador_ppl.png'
};

const FOTOS_UNIVERSIDADES = {
  'Universidad de El Salvador (UES)': {
    portada: 'https://commons.wikimedia.org/wiki/Special:FilePath/Entrada%20principal%20de%20la%20sede%20central%20de%20la%20Universidad%20de%20El%20Salvador%2C%20vista%20suroeste%20(1).jpg',
    galeria: []
  },
  'Universidad Centroamericana (UCA)': {
    portada: 'https://commons.wikimedia.org/wiki/Special:FilePath/Universidad%20Centroamericana%20%E2%80%9CJos%C3%A9%20Sime%C3%B3n%20Ca%C3%B1as%E2%80%9D%20(cropped).jpg',
    galeria: []
  }
};

function LogoUniversidad({ nombre, size = 45, style }) {
  const [conError, setConError] = useState(false);
  const url = LOGOS_UNIVERSIDADES[nombre];
  const tieneUrlValida = url && typeof url === 'string' && url.trim().startsWith('http');
  const coincidencia = nombre.match(/\(([^)]+)\)/);
  const siglas = coincidencia ? coincidencia[1] : nombre.slice(0, 3);
  const caja = { width: size, height: size, borderRadius: size * 0.24 };

  return (
    <View style={[styles.logoCaja, caja, style]}>
      {!tieneUrlValida || conError ? (
        <Text style={[styles.logoSiglas, { fontSize: Math.max(8, size * 0.2) }]} numberOfLines={1}>
          {siglas}
        </Text>
      ) : (
        <Image
          source={{ uri: url }}
          style={styles.logoImagen}
          resizeMode="contain"
          onError={() => setConError(true)}
        />
      )}
    </View>
  );
}

function FotoUniversidad({ source, style, nombre }) {
  const [conError, setConError] = useState(false);
  const tieneFuenteValida = source && (typeof source === 'number' || (typeof source === 'string' && source.trim().startsWith('http')));

  if (!tieneFuenteValida || conError) {
    if (!nombre) return null;
    return (
      <View style={[style, styles.fotoPlaceholder]}>
        <LogoUniversidad nombre={nombre} size={70} />
        <Text style={styles.fotoPlaceholderTexto}>Foto próximamente</Text>
      </View>
    );
  }

  return (
    <Image
      source={typeof source === 'string' ? { uri: source } : source}
      style={style}
      resizeMode="cover"
      onError={() => setConError(true)}
    />
  );
}

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [porcentaje, setPorcentaje] = useState(0);
  const progresoAnim = useRef(new Animated.Value(0)).current;

  const [pantallaActual, setPantallaActual] = useState('bienvenida');
  const [tabActiva, setTabActiva] = useState('inicio');

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [uniSeleccionada, setUniSeleccionada] = useState(DATA_UNIVERSIDADES[0]);
  const [favoritos, setFavoritos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalSalirVisible, setModalSalirVisible] = useState(false);

  const [depSeleccionado, setDepSeleccionado] = useState(null);
  const [uniCatalogo, setUniCatalogo] = useState(null);

  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const guardados = await AsyncStorage.getItem('favoritosUniRoute');
        if (guardados) setFavoritos(JSON.parse(guardados));
      } catch (error) {
        console.log('Error al cargar favoritos:', error);
      }
    };

    cargarFavoritos();

    const suscripcion = progresoAnim.addListener(({ value }) => {
      setPorcentaje(Math.round(value));
    });

    Animated.timing(progresoAnim, {
      toValue: 100,
      duration: 1800,
      useNativeDriver: false
    }).start(() => {
      setTimeout(() => setCargando(false), 250);
    });

    return () => {
      if (suscripcion?.remove) {
        suscripcion.remove();
      } else if (progresoAnim?.removeListener) {
        progresoAnim.removeListener(suscripcion);
      }
    };
  }, []);

  const anchoBarra = progresoAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  useEffect(() => {
    const guardarFavoritos = async () => {
      try {
        await AsyncStorage.setItem('favoritosUniRoute', JSON.stringify(favoritos));
      } catch (error) {
        console.log('Error al guardar favoritos:', error);
      }
    };

    if (!cargando) guardarFavoritos();
  }, [favoritos, cargando]);

  const toggleFavorito = (id) => {
    setFavoritos((actuales) =>
      actuales.includes(id) ? actuales.filter((favId) => favId !== id) : [...actuales, id]
    );
  };

  const cambiarTab = (tab) => {
    setTabActiva(tab);
    if (tab === 'inicio') setPantallaActual('inicio');
    else if (tab === 'favoritos') setPantallaActual('favoritos');
    else if (tab === 'requisitos') setPantallaActual('requisitos');
  };

  const seleccionarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setPantallaActual('resultados');
  };

  const seleccionarDepartamento = (dep) => {
    setDepSeleccionado(dep);
    setPantallaActual('departamento');
  };

  const ejecutarSalida = () => {
    setModalSalirVisible(false);
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      setPantallaActual('bienvenida');
    }
  };

  const normalizarTexto = (texto) =>
    String(texto || '')
      .toLowerCase()
      .replace(/[áàäâã]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôõ]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const raizPalabra = (palabra) => {
    if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2);
    if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
    return palabra;
  };

  const palabrasBusqueda = useMemo(() => 
    normalizarTexto(busqueda).split(' ').filter(Boolean).map(raizPalabra),
  [busqueda]);

  const universidadesFiltradas = useMemo(() => {
    return DATA_UNIVERSIDADES.filter((uni) => {
      const coincideCategoria =
        categoriaSeleccionada === 'todas' || uni.area === categoriaSeleccionada;

      const textoOferta = normalizarTexto(
        [uni.carrera, uni.nombre, uni.area, uni.ubicacion, uni.tipo, uni.modalidad, uni.direccion].join(' ')
      );
      const palabrasOferta = textoOferta.split(' ').map(raizPalabra).join(' ');

      const coincideBusqueda =
        palabrasBusqueda.length === 0 ||
        palabrasBusqueda.every((palabra) => palabrasOferta.includes(palabra));

      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoriaSeleccionada, palabrasBusqueda]);

  const listaFavoritos = DATA_UNIVERSIDADES.filter((uni) => favoritos.includes(uni.id));

  const universidadesDelDepartamento = depSeleccionado
    ? CATALOGO_UNIVERSIDADES.filter((u) => u.departamentos.includes(depSeleccionado))
    : [];

  const abrirEnlace = async (url) => {
    try {
      if (url && await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error al abrir URL:', error);
    }
  };

  const abrirMapa = (uni, app, contexto) => {
    if (!uni) return;
    const { latitude, longitude } = uni;
    const tieneCoords = typeof latitude === 'number' && typeof longitude === 'number';
    const texto =
      uni.consultaMapa ||
      [contexto, uni.nombre, uni.direccion, 'El Salvador'].filter(Boolean).join(', ');
    const q = encodeURIComponent(texto);
    const url =
      app === 'waze'
        ? tieneCoords
          ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
          : `https://waze.com/ul?q=${q}&navigate=yes`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
    abrirEnlace(url);
  };

  if (cargando) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashIcono}>🎓</Text>
        <Text style={styles.splashSubtitulo}>TU GUÍA UNIVERSITARIA</Text>
        <Text style={styles.splashTitulo}>UniRoute SV</Text>
        <View style={styles.splashBarraFondo}>
          <Animated.View style={[styles.splashBarraProgreso, { width: anchoBarra }]} />
        </View>
        <Text style={styles.splashPorcentaje}>{porcentaje}%</Text>
        <Text style={styles.splashCargandoTexto}>
          {porcentaje < 100 ? 'Cargando universidades y carreras...' : '¡Listo!'}
        </Text>
      </View>
    );
  }

  const renderBienvenida = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.decoracionSuperior} />
      <Text style={styles.welcomeIcono}>🎓</Text>
      <Text style={styles.welcomeLogo}>
        UniRoute <Text style={styles.welcomeLogoAmarillo}>SV</Text>
      </Text>
      <Text style={styles.welcomeSubtitulo}>TU GUÍA UNIVERSITARIA</Text>
      <Text style={styles.welcomeSubtitulo}>EN EL SALVADOR</Text>
      <View style={styles.lineaAmarilla} />
      <Text style={styles.welcomeDescripcion}>
        Encuentra la carrera perfecta, explora universidades, conoce sus requisitos y toma el mejor camino hacia tu futuro profesional.
      </Text>
      <TouchableOpacity
        style={styles.welcomeBoton}
        onPress={() => setPantallaActual('inicio')}
      >
        <Text style={styles.welcomeBotonTexto}>Comenzar</Text>
        <Text style={styles.welcomeFlecha}>→</Text>
      </TouchableOpacity>
      <View style={styles.decoracionInferior} />
    </View>
  );

  const renderInicio = () => (
    <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerInicio}>
        <View>
          <Text style={styles.saludoPequeno}>¡Hola!</Text>
          <Text style={styles.saludoGrande}>¿Qué carrera te gustaría explorar hoy?</Text>
        </View>
        <TouchableOpacity
          style={styles.botonSalirHeader}
          onPress={() => setModalSalirVisible(true)}
        >
          <Text style={styles.iconoSalir}>🚪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.busquedaContainer}>
        <Text style={styles.busquedaIcono}>🔎</Text>
        <TextInput
          style={styles.inputBusqueda}
          placeholder="Buscar carrera o universidad..."
          placeholderTextColor="#AFC3D9"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda !== '' && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Text style={styles.limpiarBusqueda}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bannerPrincipal}>
        <View style={styles.bannerContenido}>
          <View style={styles.bannerEtiqueta}>
            <Text style={styles.bannerEtiquetaTexto}>TU FUTURO EMPIEZA AQUÍ</Text>
          </View>
          <Text style={styles.bannerTitulo}>Descubre las mejores opciones universitarias</Text>
        </View>
        <Text style={styles.bannerEmoji}>🎓</Text>
      </View>

      <Text style={styles.seccionTitulo}>Explorar por Departamento</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollCategorias}>
        {DEPARTAMENTOS.map((dep) => (
          <TouchableOpacity
            key={dep}
            style={styles.chipCategoria}
            onPress={() => seleccionarDepartamento(dep)}
          >
            <Text style={styles.chipIcono}>📍</Text>
            <Text style={styles.chipTexto}>{dep}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.seccionTitulo}>Categorías de Estudio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollCategorias}>
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chipCategoria, categoriaSeleccionada === cat.id && styles.chipCategoriaActiva]}
            onPress={() => seleccionarCategoria(cat.id)}
          >
            <Text style={styles.chipTexto}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.seccionTitulo}>Todas las Ofertas Académicas</Text>

      {universidadesFiltradas.map((item) => {
        const esFavorito = favoritos.includes(item.id);
        return (
          <View key={item.id} style={styles.cardResultado}>
            <View style={styles.cardHeaderResult}>
              <LogoUniversidad nombre={item.nombre} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardResultadoTitulo}>{item.carrera}</Text>
                <Text style={styles.cardResultadoSub}>{item.nombre}</Text>
                <View style={styles.datosCard}>
                  <Text style={styles.datoCard}>⏱️ {item.duracion}</Text>
                  <Text style={styles.datoCard}>📍 {item.ubicacion}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleFavorito(item.id)} style={styles.botonCorazon}>
                <Text style={styles.corazon}>{esFavorito ? '❤️' : '♡'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cardBotonVer}
              onPress={() => {
                setUniSeleccionada(item);
                setPantallaActual('detalle');
              }}
            >
              <Text style={styles.cardBotonVerTexto}>Ver información</Text>
              <Text style={styles.cardFlecha}>→</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {universidadesFiltradas.length === 0 && (
        <View style={styles.emptyBusqueda}>
          <Text style={styles.emptyIcono}>🔎</Text>
          <Text style={styles.emptyTexto}>No encontramos resultados</Text>
          <Text style={styles.emptySubtexto}>Intenta buscar otra carrera o universidad.</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderResultados = () => (
    <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.botonAtras}
        onPress={() => {
          setCategoriaSeleccionada('todas');
          setPantallaActual('inicio');
        }}
      >
        <Text style={styles.botonAtrasTexto}>← </Text>
      </TouchableOpacity>

      <Text style={styles.tituloPantallaHeader}>{categoriaSeleccionada}</Text>
      <Text style={styles.subtituloResultados}>{universidadesFiltradas.length} opciones encontradas</Text>

      {universidadesFiltradas.map((item) => {
        const esFavorito = favoritos.includes(item.id);
        return (
          <View key={item.id} style={styles.cardResultado}>
            <View style={styles.cardHeaderResult}>
              <LogoUniversidad nombre={item.nombre} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardResultadoTitulo}>{item.carrera}</Text>
                <Text style={styles.cardResultadoSub}>{item.nombre}</Text>
                <View style={styles.datosCard}>
                  <Text style={styles.datoCard}>⏱️ {item.duracion}</Text>
                  <Text style={styles.datoCard}>📍 {item.ubicacion}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleFavorito(item.id)}>
                <Text style={styles.corazon}>{esFavorito ? '❤️' : '♡'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cardBotonVer}
              onPress={() => {
                setUniSeleccionada(item);
                setPantallaActual('detalle');
              }}
            >
              <Text style={styles.cardBotonVerTexto}>Ver información</Text>
              <Text style={styles.cardFlecha}>→</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderDepartamento = () => (
    <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSecundario}>
        <TouchableOpacity style={styles.botonAtras} onPress={() => setPantallaActual('inicio')}>
          <Text style={styles.botonAtrasTexto}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerSecundarioCentro}>
          <Text style={styles.tituloPantallaHeader}>📍 {depSeleccionado}</Text>
          <Text style={styles.subtituloResultados}>
            {universidadesDelDepartamento.length} universidades con sede aquí
          </Text>
        </View>
      </View>

      {universidadesDelDepartamento.length === 0 ? (
        <View style={styles.emptyFavoritos}>
          <Text style={styles.emptyIcono}>🏫</Text>
          <Text style={styles.emptyTexto}>Aún no hay universidades registradas</Text>
          <Text style={styles.emptySubtexto}>
            Estamos agregando más sedes en {depSeleccionado}. Prueba con otro departamento.
          </Text>
        </View>
      ) : (
        universidadesDelDepartamento.map((uni) => (
          <View key={uni.nombre} style={styles.cardResultado}>
            <View style={styles.cardHeaderResult}>
              <LogoUniversidad nombre={uni.nombre} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardResultadoTitulo}>{uni.nombre}</Text>
                <Text style={styles.datoCard}>
                  {uni.facultades.length > 0
                    ? `🏛️ ${uni.facultades.length} facultades`
                    : '🏛️ Facultades por confirmar'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cardBotonVer}
              onPress={() => {
                setUniCatalogo(uni);
                setPantallaActual('facultades');
              }}
            >
              <Text style={styles.cardBotonVerTexto}>Ver facultades y carreras</Text>
              <Text style={styles.cardFlecha}>→</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderFacultades = () => {
    if (!uniCatalogo) return null;
    const fotos = FOTOS_UNIVERSIDADES[uniCatalogo.nombre];
    const base = DATA_UNIVERSIDADES.find((u) => u.nombre === uniCatalogo.nombre);
    const direccionFinal = base?.direccion || uniCatalogo?.direccion || 'Dirección por confirmar';
    const sitio = base?.sitioWeb || uniCatalogo?.sitioWeb;

    return (
      <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSecundario}>
          <TouchableOpacity
            style={styles.botonAtras}
            onPress={() => setPantallaActual(depSeleccionado ? 'departamento' : 'inicio')}
          >
            <Text style={styles.botonAtrasTexto}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerSecundarioCentro}>
            <Text style={styles.tituloPantallaHeader}>Facultades</Text>
            <Text style={styles.subtituloResultados}>{uniCatalogo.nombre}</Text>
          </View>
        </View>

        <FotoUniversidad
          key={uniCatalogo.nombre}
          source={fotos?.portada}
          nombre={uniCatalogo.nombre}
          style={styles.fotoPortada}
        />

        {uniCatalogo.facultades.length > 0 ? (
          uniCatalogo.facultades.map((fac, idx) => (
            <View key={idx} style={styles.cardResultado}>
              <Text style={styles.cardResultadoTitulo}>🏛️ {fac.nombre}</Text>
              {fac.carreras.length > 0 ? (
                fac.carreras.map((carrera, i) => (
                  <Text key={i} style={styles.datoCard}>• {carrera}</Text>
                ))
              ) : (
                <Text style={styles.datoCard}>Carreras por confirmar</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyFavoritos}>
            <Text style={styles.emptyIcono}>🏛️</Text>
            <Text style={styles.emptyTexto}>Facultades por confirmar</Text>
            <Text style={styles.emptySubtexto}>
              Estamos verificando la oferta académica de esta institución.
            </Text>
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <Text style={styles.seccionTitulo}>🗺️ Ubicación</Text>
          <Text style={styles.emptySubtexto}>{direccionFinal}</Text>
          <View style={styles.filaBotonesMapa}>
            <TouchableOpacity
              style={styles.botonMapa}
              onPress={() =>
                abrirMapa(
                  {
                    nombre: uniCatalogo.nombre,
                    direccion: direccionFinal,
                    consultaMapa: UBICACIONES_SIN_OFERTA[uniCatalogo.nombre],
                    latitude: base?.latitude,
                    longitude: base?.longitude
                  },
                  'google'
                )
              }
            >
              <Text style={styles.botonMapaTexto}>🗺️ Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonMapa}
              onPress={() =>
                abrirMapa(
                  {
                    nombre: uniCatalogo.nombre,
                    direccion: direccionFinal,
                    consultaMapa: UBICACIONES_SIN_OFERTA[uniCatalogo.nombre],
                    latitude: base?.latitude,
                    longitude: base?.longitude
                  },
                  'waze'
                )
              }
            >
              <Text style={styles.botonMapaTexto}>🚗 Waze</Text>
            </TouchableOpacity>
          </View>
        </View>

        {sitio && (
          <TouchableOpacity
            style={[styles.welcomeBoton, { marginTop: 16 }]}
            onPress={() => abrirEnlace(sitio)}
          >
            <Text style={styles.welcomeBotonTexto}>Visitar sitio web</Text>
            <Text style={styles.welcomeFlecha}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderFavoritos = () => (
    <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSecundario}>
        <TouchableOpacity style={styles.botonAtras} onPress={() => setPantallaActual('inicio')}>
          <Text style={styles.botonAtrasTexto}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerSecundarioCentro}>
          <Text style={styles.tituloPantallaHeader}>Mis Favoritos</Text>
          <Text style={styles.subtituloResultados}>Carreras que guardaste para consultar después</Text>
        </View>
      </View>

      {listaFavoritos.length === 0 ? (
        <View style={styles.emptyFavoritos}>
          <View style={styles.emptyFavoritosIcono}>
            <Text style={styles.emptyIcono}>♡</Text>
          </View>
          <Text style={styles.emptyTexto}>No tienes favoritos guardados</Text>
          <Text style={styles.emptySubtexto}>
            Explora las carreras y presiona el ícono de corazón para guardarlas aquí.
          </Text>
        </View>
      ) : (
        listaFavoritos.map((item) => (
          <View key={item.id} style={styles.cardResultado}>
            <View style={styles.cardHeaderResult}>
              <LogoUniversidad nombre={item.nombre} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardResultadoTitulo}>{item.carrera}</Text>
                <Text style={styles.cardResultadoSub}>{item.nombre}</Text>
                <View style={styles.datosCard}>
                  <Text style={styles.datoCard}>⏱️ {item.duracion}</Text>
                  <Text style={styles.datoCard}>📍 {item.ubicacion}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleFavorito(item.id)}>
                <Text style={styles.corazon}>❤️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cardBotonVer}
              onPress={() => {
                setUniSeleccionada(item);
                setPantallaActual('detalle');
              }}
            >
              <Text style={styles.cardBotonVerTexto}>Ver información</Text>
              <Text style={styles.cardFlecha}>→</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderDetalle = () => {
    const fotos = FOTOS_UNIVERSIDADES[uniSeleccionada.nombre];

    return (
      <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.botonAtras}
          onPress={() => setPantallaActual('inicio')}
        >
          <Text style={styles.botonAtrasTexto}>← </Text>
        </TouchableOpacity>

        <FotoUniversidad
          key={uniSeleccionada.nombre}
          source={fotos?.portada}
          nombre={uniSeleccionada.nombre}
          style={styles.fotoPortada}
        />

        <View style={styles.cardResultado}>
          <View style={styles.cardHeaderResult}>
            <LogoUniversidad nombre={uniSeleccionada.nombre} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardResultadoTitulo}>{uniSeleccionada.carrera}</Text>
              <Text style={styles.cardResultadoSub}>{uniSeleccionada.nombre}</Text>
            </View>
          </View>

          <Text style={styles.datoCard}>📚 Tipo: {uniSeleccionada.tipo}</Text>
          <Text style={styles.datoCard}>⏱️ Duración: {uniSeleccionada.duracion}</Text>
          <Text style={styles.datoCard}>🏫 Modalidad: {uniSeleccionada.modalidad}</Text>
          <Text style={styles.datoCard}>📍 Ubicación: {uniSeleccionada.ubicacion}</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.seccionTitulo}>📍 Dirección</Text>
            <Text style={styles.emptySubtexto}>{uniSeleccionada.direccion}</Text>
          </View>

          {(SEDES_UNIVERSIDADES[uniSeleccionada.nombre] || []).length > 1 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.seccionTitulo}>🏫 Sedes y ubicaciones</Text>
              {SEDES_UNIVERSIDADES[uniSeleccionada.nombre].map((sede, idx) => (
                <View key={idx} style={styles.sedeItem}>
                  <Text style={styles.sedeNombre}>{sede.nombre}</Text>
                  <Text style={styles.sedeDireccion}>📍 {sede.direccion}</Text>
                  <View style={styles.filaBotonesMapa}>
                    <TouchableOpacity
                      style={styles.botonMapa}
                      onPress={() => abrirMapa(sede, 'google', uniSeleccionada.nombre)}
                    >
                      <Text style={styles.botonMapaTexto}>🗺️ Google Maps</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.botonMapa}
                      onPress={() => abrirMapa(sede, 'waze', uniSeleccionada.nombre)}
                    >
                      <Text style={styles.botonMapaTexto}>🚗 Waze</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 16 }}>
            <Text style={styles.seccionTitulo}>🗺️ Ubicación en el mapa</Text>
            {Boolean(uniSeleccionada.latitude && Platform.OS !== 'web' && MapView) ? (
              <MapView
                key={uniSeleccionada.id}
                style={styles.mapa}
                initialRegion={{
                  latitude: uniSeleccionada.latitude,
                  longitude: uniSeleccionada.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
              >
                <Marker
                  coordinate={{
                    latitude: uniSeleccionada.latitude,
                    longitude: uniSeleccionada.longitude
                  }}
                  title={uniSeleccionada.nombre}
                  description={uniSeleccionada.ubicacion}
                />
              </MapView>
            ) : (
              <View style={styles.mapaPlaceholder}>
                <Text style={styles.mapaPlaceholderTexto}>
                  📍 Mapa disponible en dispositivos móviles / Expo Go
                </Text>
              </View>
            )}

            <View style={styles.filaBotonesMapa}>
              <TouchableOpacity
                style={styles.botonMapa}
                onPress={() => abrirMapa(uniSeleccionada, 'google')}
              >
                <Text style={styles.botonMapaTexto}>🗺️ Google Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonMapa}
                onPress={() => abrirMapa(uniSeleccionada, 'waze')}
              >
                <Text style={styles.botonMapaTexto}>🚗 Waze</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.seccionTitulo}>📞 Contacto</Text>
            <Text style={styles.emptySubtexto}>{uniSeleccionada.telefono}</Text>
            <Text style={styles.emptySubtexto}>{uniSeleccionada.contactoDirecto}</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.seccionTitulo}>⭐ Comodidades</Text>
            {uniSeleccionada.comodidades.map((comodidad, index) => (
              <Text key={index} style={styles.datoCard}>
                • {comodidad}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.welcomeBoton, { marginTop: 20 }]}
            onPress={() => abrirEnlace(uniSeleccionada.sitioWeb)}
          >
            <Text style={styles.welcomeBotonTexto}>Visitar sitio web</Text>
            <Text style={styles.welcomeFlecha}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderRequisitos = () => (
    <ScrollView style={styles.containerPantalla} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSecundario}>
        <TouchableOpacity
          style={styles.botonAtras}
          onPress={() => setPantallaActual('inicio')}
        >
          <Text style={styles.botonAtrasTexto}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerSecundarioCentro}>
          <Text style={styles.tituloPantallaHeader}>Requisitos de ingreso</Text>
          <Text style={styles.subtituloResultados}>Documentos y proceso de admisión</Text>
        </View>
      </View>

      {REQUISITOS_UNIVERSIDADES.map((universidad) => (
        <View key={universidad.sigla} style={styles.cardResultado}>
          <Text style={styles.cardResultadoTitulo}>{universidad.sigla}</Text>
          <Text style={styles.cardResultadoSub}>{universidad.nombre}</Text>

          <Text style={styles.seccionTitulo}>📄 Documentos necesarios</Text>
          {universidad.documentos.map((documento, index) => (
            <Text key={index} style={styles.datoCard}>
              • {documento}
            </Text>
          ))}

          <View style={{ marginTop: 14 }}>
            <Text style={styles.seccionTitulo}>📝 Proceso de ingreso</Text>
            {universidad.proceso.map((paso, index) => (
              <Text key={index} style={styles.datoCard}>
                {index + 1}. {paso}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {pantallaActual === 'bienvenida' && renderBienvenida()}
      {pantallaActual === 'inicio' && renderInicio()}
      {pantallaActual === 'resultados' && renderResultados()}
      {pantallaActual === 'departamento' && renderDepartamento()}
      {pantallaActual === 'facultades' && renderFacultades()}
      {pantallaActual === 'favoritos' && renderFavoritos()}
      {pantallaActual === 'detalle' && renderDetalle()}
      {pantallaActual === 'requisitos' && renderRequisitos()}

      {pantallaActual !== 'bienvenida' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, tabActiva === 'inicio' && styles.tabItemActivo]}
            onPress={() => cambiarTab('inicio')}
          >
            <Text style={styles.tabIcono}>🏠</Text>
            <Text style={[styles.tabTexto, tabActiva === 'inicio' && styles.tabTextoActivo]}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tabActiva === 'favoritos' && styles.tabItemActivo]}
            onPress={() => cambiarTab('favoritos')}
          >
            <Text style={styles.tabIcono}>❤️</Text>
            <Text style={[styles.tabTexto, tabActiva === 'favoritos' && styles.tabTextoActivo]}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tabActiva === 'requisitos' && styles.tabItemActivo]}
            onPress={() => cambiarTab('requisitos')}
          >
            <Text style={styles.tabIcono}>📋</Text>
            <Text style={[styles.tabTexto, tabActiva === 'requisitos' && styles.tabTextoActivo]}>Requisitos</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalSalirVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>¿Deseas salir de la aplicación?</Text>
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonCancelar]}
                onPress={() => setModalSalirVisible(false)}
              >
                <Text style={styles.modalBotonTextoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonAceptar]}
                onPress={ejecutarSalida}
              >
                <Text style={styles.modalBotonTextoAceptar}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#071B3A' },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#071B3A' },
  splashIcono: { fontSize: 64, marginBottom: 10 },
  splashSubtitulo: { color: '#FFCC00', fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  splashTitulo: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  splashBarraFondo: { width: '75%', height: 8, borderRadius: 4, marginTop: 34, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  splashBarraProgreso: { height: '100%', borderRadius: 4, backgroundColor: '#FFCC00' },
  splashPorcentaje: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 14 },
  splashCargandoTexto: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 30, backgroundColor: '#071B3A' },
  welcomeIcono: { fontSize: 72, marginBottom: 16 },
  welcomeLogo: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  welcomeLogoAmarillo: { color: '#FFCC00' },
  welcomeSubtitulo: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', marginTop: 4 },
  lineaAmarilla: { width: 65, height: 4, backgroundColor: '#FFCC00', borderRadius: 4, marginVertical: 20 },
  welcomeDescripcion: { color: '#E2E8F0', textAlign: 'center', fontSize: 15, lineHeight: 23, marginBottom: 32, maxWidth: 330 },
  welcomeBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: '#FFCC00', paddingHorizontal: 30, paddingVertical: 15, minWidth: 165, borderRadius: 30 },
  welcomeBotonTexto: { color: '#071B3A', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
  welcomeFlecha: { color: '#071B3A', fontSize: 19, fontWeight: 'bold' },
  decoracionSuperior: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(0, 102, 255, 0.18)' },
  decoracionInferior: { position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(0, 102, 255, 0.18)' },
  containerPantalla: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#071B3A' },
  headerInicio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  saludoPequeno: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  saludoGrande: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', maxWidth: 290 },
  botonSalirHeader: { width: 48, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#12345F', borderRadius: 13 },
  iconoSalir: { fontSize: 22 },
  busquedaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12345F', borderRadius: 14, paddingHorizontal: 13, height: 50, marginBottom: 18, borderWidth: 1, borderColor: '#24558B' },
  busquedaIcono: { fontSize: 17, marginRight: 9 },
  inputBusqueda: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  limpiarBusqueda: { color: '#CBD5E1', fontSize: 17, padding: 5 },
  bannerPrincipal: { flexDirection: 'row', backgroundColor: '#0756B5', borderRadius: 17, paddingHorizontal: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'space-between', marginBottom: 23, borderWidth: 1, borderColor: '#2B7DE0', minHeight: 105 },
  bannerContenido: { flex: 1, marginRight: 12 },
  bannerEtiqueta: { backgroundColor: '#FFCC00', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, alignSelf: 'flex-start', marginBottom: 8 },
  bannerEtiquetaTexto: { color: '#071B3A', fontSize: 10, fontWeight: 'bold' },
  bannerTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', lineHeight: 21 },
  bannerEmoji: { fontSize: 38 },
  seccionTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', marginBottom: 13 },
  scrollCategorias: { marginBottom: 23 },
  chipCategoria: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#12345F', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 21, marginRight: 8, borderWidth: 1, borderColor: '#24558B' },
  chipCategoriaActiva: { backgroundColor: '#FFCC00', borderColor: '#FFCC00' },
  chipIcono: { fontSize: 14, marginRight: 6 },
  chipTexto: { color: '#D5E2F2', fontSize: 13, fontWeight: '600' },
  cardResultado: { backgroundColor: '#12345F', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#24558B' },
  cardHeaderResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  logoCaja: { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: 4, marginRight: 12 },
  logoImagen: { width: '100%', height: '100%' },
  logoSiglas: { color: '#071B3A', fontWeight: 'bold', textAlign: 'center' },
  cardInfo: { flex: 1, marginRight: 8 },
  cardResultadoTitulo: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', lineHeight: 21, marginBottom: 3 },
  cardResultadoSub: { color: '#CBD5E1', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  datosCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datoCard: { color: '#D7E3F0', fontSize: 12, marginBottom: 4 },
  botonCorazon: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  corazon: { fontSize: 19 },
  cardBotonVer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#28547F', paddingTop: 11, marginTop: 4 },
  cardBotonVerTexto: { color: '#FFCC00', fontSize: 13, fontWeight: 'bold' },
  cardFlecha: { color: '#FFCC00', fontSize: 16, fontWeight: 'bold' },
  fotoPortada: { width: '100%', height: 190, borderRadius: 16, marginBottom: 16, backgroundColor: '#12345F' },
  fotoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#12345F' },
  fotoPlaceholderTexto: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6, fontWeight: '600' },
  mapa: { width: '100%', height: 180, borderRadius: 14, marginTop: 4 },
  mapaPlaceholder: { width: '100%', height: 100, borderRadius: 14, marginTop: 4, backgroundColor: '#0B2850', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#24558B' },
  mapaPlaceholderTexto: { color: '#AFC2D8', fontSize: 13, textAlign: 'center' },
  filaBotonesMapa: { flexDirection: 'row', gap: 10, marginTop: 10 },
  botonMapa: { flex: 1, backgroundColor: '#0756B5', borderWidth: 1, borderColor: '#2B7DE0', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  botonMapaTexto: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  emptyBusqueda: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
  emptyFavoritos: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyFavoritosIcono: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#12345F', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyIcono: { fontSize: 30 },
  emptyTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  emptySubtexto: { color: '#AFC2D8', fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 19 },
  botonAtras: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  botonAtrasTexto: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSecundario: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 },
  headerSecundarioCentro: { flex: 1, marginLeft: 10 },
  tituloPantallaHeader: { color: '#FFFFFF', fontSize: 21, fontWeight: 'bold' },
  subtituloResultados: { color: '#CBD5E1', fontSize: 13, marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#0B2850', borderTopWidth: 1, borderTopColor: '#24558B', height: 64 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', minWidth: 70 },
  tabItemActivo: { borderTopWidth: 3, borderTopColor: '#FFCC00' },
  tabIcono: { fontSize: 19, marginBottom: 3 },
  tabTexto: { color: '#AFC2D8', fontSize: 11 },
  tabTextoActivo: { color: '#FFCC00', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 8, 25, 0.72)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  modalContainer: { backgroundColor: '#173B70', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 25, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: '#376AA0' },
  modalTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 24, marginBottom: 22 },
  modalBotones: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, width: '100%' },
  modalBoton: { minWidth: 115, height: 44, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalBotonCancelar: { backgroundColor: '#31537D' },
  modalBotonAceptar: { backgroundColor: '#FFCC00' },
  modalBotonTextoCancelar: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  modalBotonTextoAceptar: { color: '#071B3A', fontSize: 15, fontWeight: 'bold' },
  sedeItem: { backgroundColor: '#0B2850', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#24558B' },
  sedeNombre: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  sedeDireccion: { color: '#D7E3F0', fontSize: 12, lineHeight: 18, marginBottom: 4 }
});