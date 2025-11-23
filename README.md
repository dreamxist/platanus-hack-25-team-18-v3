
# MiCandida.top

Plataforma web interactiva que ayuda a los ciudadanos chilenos a descubrir qué candidato presidencial se alinea mejor con sus valores políticos mediante una experiencia tipo Tinder.

## Características

- Swipe interactivo para expresar acuerdo/desacuerdo con posturas políticas
- Cálculo de match en tiempo real con candidatos
- Chat interactivo con tu candidato match
- Sistema de revelación de resultados con porcentajes de coincidencia
- Compartir resultados en redes sociales

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (Database + Edge Functions)
- **Estado**: Zustand
- **Animaciones**: Framer Motion

## Instalación

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias del frontend
cd web && npm install
```

## Desarrollo

```bash
# Ejecutar solo el frontend
npm run dev:web

# Ejecutar solo las funciones de Supabase
npm run dev:functions

# Ejecutar todo simultáneamente
npm run dev:all
```

## Estructura del Proyecto

```
.
├── web/              # Aplicación React
├── supabase/         # Funciones y configuración de Supabase
├── read-programs/    # Scripts de análisis de documentos
└── public/           # Archivos estáticos
```

## Deployment

```bash
# Desplegar funciones de Supabase
npm run deploy:functions
```

## Licencia

Proyecto desarrollado para Platanus Hack 2025 - Team 18
