# 💰 Gestor de Gastos Personales

Una aplicación web moderna y completa para la gestión inteligente de finanzas personales, desarrollada con Angular 18, TypeScript y Tailwind CSS.

## 🌟 Características Principales

### 📊 Dashboard Intuitivo
- **Resumen financiero en tiempo real** con balance actual
- **Métricas clave** (ingresos, gastos, ahorros)
- **Navegación por pestañas** intuitiva y responsive
- **Estado de carga optimizado** con spinners animados

### 💸 Gestión de Gastos
- ✅ **CRUD completo** (Crear, Leer, Actualizar, Eliminar)
- 🏷️ **Categorización automática** con iconos visuales
- 📅 **Filtros por fecha, categoría y monto**
- 📝 **Validación de formularios** con Zod
- 🔍 **Búsqueda y ordenamiento** avanzado

### 💰 Gestión de Ingresos
- ✅ **CRUD completo** para todas las fuentes de ingreso
- 💼 **Múltiples fuentes** (salario, freelance, inversiones, etc.)
- 📈 **Seguimiento de tendencias** de ingresos
- 📊 **Análisis de diversificación** de fuentes

### 📈 Estadísticas y Visualizaciones
- 📊 **Gráficos interactivos** con Chart.js 4.5.0
- 🥧 **Gráficos de pastel** para distribución por categorías
- 📊 **Gráficos de barras** para comparaciones temporales
- 📉 **Gráficos de líneas** para tendencias
- 🎨 **Colores consistentes** y accesibles

### 🔄 Comparación de Períodos
- ⚡ **Comparaciones rápidas** predefinidas
- 📅 **Períodos personalizados** con selector de fechas
- 📊 **Métricas de cambio** con porcentajes y diferencias
- 🎯 **Estados claramente diferenciados** (selección → carga → resultados)
- 🖱️ **Navegación mejorada** con botón "cambiar períodos"

### 🎨 Experiencia de Usuario
- 🎨 **Diseño moderno** con Tailwind CSS
- 📱 **Completamente responsive** para móvil, tablet y desktop
- 🌙 **Iconos intuitivos** para todas las funciones
- ⚡ **Transiciones suaves** y animaciones
- ♿ **Accesibilidad** con soporte para screen readers

### 🔔 Sistema de Notificaciones
- 🎯 **Notificaciones optimizadas** (reducidas de ~20 a ~8-10 por sesión)
- ⏱️ **Duraciones inteligentes**: 2s éxito, 3s info, 8s errores
- ✅ **Solo notificaciones importantes** (CRUD, errores, PWA)
- 🎨 **Diseño visual atractivo** con colores de estado

### 📱 PWA (Progressive Web App)
- 📱 **Instalable** en dispositivos móviles y desktop
- 🔄 **Actualizaciones automáticas** con service worker
- 📶 **Detección de estado de red** online/offline
- 💾 **Almacenamiento local** con persistencia de datos

## 🏗️ Arquitectura Técnica

### 🛠️ Stack Tecnológico
- **Frontend**: Angular 18 con Standalone Components
- **Styling**: Tailwind CSS + PostCSS
- **Charts**: Chart.js 4.5.0 con ng2-charts
- **Forms**: Angular Reactive Forms + Zod validation
- **State**: Signals-based reactive state management
- **Build**: Angular CLI con optimizaciones de producción
- **PWA**: Angular Service Worker

### 🏛️ Arquitectura de Componentes
```
src/app/
├── components/           # Componentes de UI
│   ├── dashboard/       # Dashboard principal
│   ├── expense-form/    # Formulario de gastos
│   ├── expense-list/    # Lista de gastos
│   ├── income-form/     # Formulario de ingresos
│   ├── income-list/     # Lista de ingresos
│   ├── period-comparison/ # Comparación de períodos
│   ├── stats/          # Estadísticas y gráficos
│   └── charts/         # Componentes de gráficos
├── core/               # Servicios principales
│   ├── state.service.ts      # Estado global
│   ├── notification.service.ts # Notificaciones
│   ├── chart.service.ts      # Gráficos
│   ├── export.service.ts     # Exportación
│   ├── loading.service.ts    # Estados de carga
│   ├── storage.service.ts    # Almacenamiento
│   └── pwa.service.ts        # PWA features
├── models/             # Interfaces y tipos
├── shared/             # Componentes compartidos
└── utils/              # Utilidades
```

### 🔧 Servicios Principales

#### StateService
- **Gestión centralizada** del estado de la aplicación
- **Signals reactivos** para cambios en tiempo real
- **CRUD operations** para gastos e ingresos
- **Cálculos automáticos** de balance y métricas

#### ChartService  
- **Configuraciones** reutilizables para gráficos
- **Paleta de colores** consistente
- **Formateo** automático de divisas
- **Responsividad** y accesibilidad

#### NotificationService
- **Queue system** para múltiples notificaciones  
- **Auto-dismiss** configurable por tipo
- **Estados visuales** (success, error, info, warning)
- **Track by function** para performance

#### PwaService
- **Instalación** automática de PWA
- **Actualizaciones** en background
- **Network detection** para funcionalidad offline
- **Prompt de instalación** inteligente

### 🎯 Optimizaciones de Rendimiento

#### Lazy Loading
- **Componentes por ruta** con lazy loading
- **Chunk splitting** automático
- **Tree shaking** para eliminar código no usado
- **Bundle size optimizado**: ~194KB inicial

#### SSR Compatibility  
- **Platform detection** con isPlatformBrowser
- **Chart.js protection** para server-side rendering
- **Configuración dual**: SSR y no-SSR builds
- **Fallbacks** para funcionalidades browser-only

#### Memory Management
- **OnPush** change detection strategy
- **Computed signals** para cálculos eficientes
- **Proper cleanup** en componentes
- **Memoization** para operaciones costosas

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Angular CLI 18

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/OscarHinjosLopez/gestor-gastos-personales.git

# Instalar dependencias
cd gestor-gastos-personales
npm install

# Iniciar servidor de desarrollo
npm start

# La aplicación estará disponible en http://localhost:4200
```

### Scripts Disponibles
```bash
npm start          # Servidor de desarrollo sin SSR
npm run start:ssr  # Servidor de desarrollo con SSR
npm run build      # Build de producción
npm run test       # Ejecutar tests
npm run lint       # Linter de código
```

## 📖 Guía de Uso

### 1. Dashboard Inicial
- Accede a la **visión general** de tus finanzas
- Revisa tu **balance actual** en tiempo real
- **Agrega gastos e ingresos** directamente desde el dashboard

### 2. Gestión de Gastos
- Ve a la pestaña **"📝 Gastos"**
- **Agrega nuevos gastos** con categoría, monto y descripción
- **Filtra y busca** gastos específicos
- **Edita o elimina** gastos existentes

### 3. Gestión de Ingresos  
- Ve a la pestaña **"💰 Ingresos"**
- **Registra todas tus fuentes** de ingreso
- **Categoriza por tipo** (salario, freelance, etc.)
- **Analiza diversificación** de ingresos

### 4. Visualización de Estadísticas
- Ve a la pestaña **"📊 Estadísticas"**
- Explora **gráficos interactivos** de tus datos
- **Ajusta períodos de tiempo** con filtros
- **Analiza tendencias** y patrones

### 5. Comparación de Períodos
- Ve a la pestaña **"🔄 Comparación"** 
- Selecciona **períodos predefinidos** o **fechas personalizadas**
- **Compara métricas** entre diferentes períodos
- **Visualiza cambios** con gráficos y porcentajes

## 🎨 Paleta de Colores

### Estados Financieros
- **Balance Positivo**: Verde (#10B981)
- **Balance Negativo**: Rojo (#EF4444)  
- **Ingresos**: Verde (#10B981)
- **Gastos**: Rojo (#EF4444)
- **Ahorro**: Azul (#3B82F6)

### UI Elements
- **Primario**: Púrpura (#7C3AED)
- **Secundario**: Azul (#3B82F6)
- **Éxito**: Verde (#10B981)
- **Advertencia**: Amarillo (#F59E0B)
- **Error**: Rojo (#EF4444)
- **Información**: Azul (#3B82F6)

## 🔒 Seguridad y Privacidad

### Almacenamiento Local
- **Datos en localStorage** del navegador
- **Sin envío de datos** a servidores externos
- **Privacidad total** - tus datos permanecen en tu dispositivo
- **Exportación/importación** para respaldos

### Validación de Datos
- **Validación client-side** con Zod schemas
- **Sanitización** de inputs
- **Type safety** con TypeScript
- **Manejo de errores** robusto

## 📊 Métricas del Proyecto

### Tamaño de Bundle
- **Bundle inicial**: ~194KB
- **Lazy chunks**: Optimizados por ruta
- **Gzip compression**: Habilitado
- **Tree shaking**: Activo

### Performance
- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

### Compatibilidad
- ✅ **Chrome 90+**
- ✅ **Firefox 88+**
- ✅ **Safari 14+**
- ✅ **Edge 90+**
- ✅ **Mobile browsers**

## 🤝 Contribuir

### Estructura de Commits
```
feat: nueva característica
fix: corrección de bug
docs: cambios en documentación  
style: cambios de formato
refactor: refactorización de código
test: agregar tests
chore: tareas de mantenimiento
```

### Proceso de Desarrollo
1. **Fork** del repositorio
2. **Crear branch** para tu feature
3. **Commit** con mensajes descriptivos
4. **Push** a tu fork
5. **Crear Pull Request**

## 📄 Licencia

Este proyecto está licenciado bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Oscar Hinjos López**
- GitHub: [@OscarHinjosLopez](https://github.com/OscarHinjosLopez)
- Email: [contacto](mailto:oscar.hinjos@example.com)

## 🙏 Agradecimientos

- **Angular Team** por el excelente framework
- **Chart.js** por las visualizaciones
- **Tailwind CSS** por el sistema de diseño
- **Community** por feedback y sugerencias

---

**Estado del Proyecto**: ✅ **Producción Ready** (Septiembre 2025)

*Una herramienta moderna para tomar control de tus finanzas personales* 💰