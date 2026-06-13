# Art Unfolded

Visualización interactiva de arte y arquitectura mediante "unfolded pictures" generadas por fotogrametría, bake projection y ortofotos.

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue

El proyecto se despliega en Vercel sobre el dominio `artunfolded.com`.
Es una aplicación estática (sin backend), funciona igual en local que online.

## Estructura de assets

- `/public/models` — modelos 3D (.glb, Draco/KTX2)
- `/public/tiles` — pirámides de tiles DZI para el visor 2D (OpenSeadragon)
- `/src/data` — JSON con metadatos y anotaciones

## Hoja de ruta

Ver `Plan de proyecto` para el detalle de fases. Estado actual: **Fase 0 — Preparación del terreno** ✅
