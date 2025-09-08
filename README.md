# 💰 Gestor de Gastos Personales

Una aplicación web moderna y completa para la gestión inteligente de finanzas personales, desarrollada con Angular 18, TypeScript y Tailwind CSS. Incluye **proyecciones de gastos** basadas en inteligencia artificial para planificación financiera avanzada.

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

### 🔮 Proyecciones de Gastos (NUEVO)

- 🤖 **5 Algoritmos de IA** para proyecciones precisas:
  - **Promedio Histórico**: Basado en gastos pasados
  - **Análisis de Tendencias**: Detecta patrones de crecimiento/decrecimiento
  - **Ajuste Estacional**: Considera variaciones por época del año
  - **Híbrido (Recomendado)**: Combina múltiples algoritmos
  - **Manual**: Permite ajustes personalizados
- 📊 **Métricas de Confianza** (0-100%) para evaluar precisión
- 📈 **Proyecciones por Categoría** con desglose detallado
- ⚠️ **Sistema de Alertas** para proyecciones con baja confianza
- 💡 **Recomendaciones Inteligentes** para mejorar planificación
- ⚙️ **Configuración Avanzada** personalizable
- 📅 **Períodos Flexibles** (1-24 meses de proyección)
- 🎯 **Comparación Histórica** vs proyectado

### 🚨 Alertas de Presupuesto (NUEVO)

- 💰 **Gestión Completa de Presupuestos** por categoría
- � **Umbrales Personalizables** (advertencia y peligro)
- 🚨 **Alertas Automáticas** cuando se superan límites
- 📊 **Dashboard de Estado** en tiempo real
- 📈 **Proyecciones de Gasto** para evitar excesos
- 🔔 **Notificaciones Inteligentes** configurables
- 📱 **Interfaz Intuitiva** con indicadores visuales
- ⚙️ **Configuración Avanzada** de notificaciones y reportes

### �🎨 Experiencia de Usuario

- 🎨 **Diseño moderno** con Tailwind CSS
- 📱 **Completamente responsive** para móvil, tablet y desktop
- 🌙 **Iconos intuitivos** para todas las funciones
- ⚡ **Transiciones suaves** y animaciones
- ♿ **Accesibilidad** con soporte para screen readers
- 🗑️ **Modales de confirmación** elegantes para acciones destructivas

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
├── core/                    # Servicios transversales y configuración
│   ├── loading.service.ts
│   ├── notification.service.ts
│   ├── storage.service.ts
│   ├── state.service.ts
│   ├── performance.service.ts
│   ├── pwa.service.ts
│   └── http.interceptors.ts
│
├── features/                # Características/módulos funcionales
│   ├── expenses/           # Todo lo relacionado con gastos
│   │   ├── expense-form/
│   │   ├── expense-list/
│   │   ├── expense.service.ts
│   │   └── index.ts
│   │
│   ├── income/             # Todo lo relacionado con ingresos
│   │   ├── income-form/
│   │   ├── income-list/
│   │   ├── income.service.ts
│   │   └── index.ts
│   │
│   ├── budget/             # Presupuestos y alertas
│   │   ├── budget-alerts/
│   │   ├── budget.service.ts
│   │   └── index.ts
│   │
│   ├── dashboard/          # Panel principal
│   │   ├── dashboard.component.*
│   │   └── index.ts
│   │
│   ├── projections/        # Proyecciones de gastos
│   │   ├── projections.component.*
│   │   ├── projection-settings.component.*
│   │   ├── projection.service.ts
│   │   └── index.ts
│   │
│   └── stats/              # Estadísticas y comparaciones
│       ├── stats.component.*
│       ├── period-comparison/
│       ├── period-comparison.service.*
│       └── index.ts
│
├── shared/                 # Recursos compartidos
│   ├── components/         # Componentes reutilizables
│   │   ├── charts/        # Gráficos y visualizaciones
│   │   ├── confirm-modal.component.*
│   │   ├── edit-*-modal.component.*
│   │   ├── notification-container.component.*
│   │   ├── filter-*.pipe.ts
│   │   └── index.ts
│   │
│   ├── models/            # Interfaces y tipos
│   │   ├── expense.model.ts
│   │   ├── income.model.ts
│   │   ├── budget.model.ts
│   │   ├── projection.model.ts
│   │   └── index.ts
│   │
│   └── utils/             # Utilidades y validaciones
│       ├── id.ts
│       ├── export.service.ts
│       ├── *-validation.utils.ts
│       └── index.ts
│
├── app.component.*
├── app.config.*
├── app.routes.ts
└── main.ts
```

### 🔧 Servicios Principales

#### StateService

- **Gestión centralizada** del estado de la aplicación
- **Signals reactivos** para cambios en tiempo real
- **CRUD operations** para gastos e ingresos
- **Cálculos automáticos** de balance y métricas

#### ProjectionService (NUEVO)

- **5 Algoritmos de IA** para proyecciones inteligentes
- **Análisis de tendencias** con regresión lineal
- **Ajustes estacionales** automáticos
- **Cálculo de confianza** basado en variabilidad
- **Configuraciones personalizables** por usuario
- **Validación con Zod** para integridad de datos
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

### 6. Proyecciones de Gastos

- Ve a la pestaña **"📈 Proyecciones"**
- **Configura algoritmos de IA** para predicciones precisas
- **Selecciona períodos** de proyección (1-24 meses)
- **Analiza confianza** de las proyecciones
- **Ajusta configuración** avanzada según tus necesidades

### 7. Alertas de Presupuesto (NUEVO)

- Ve a la pestaña **"🚨 Alertas"**
- **Crea presupuestos** para diferentes categorías de gastos
- **Configura umbrales** de advertencia (80%) y peligro (95%)
- **Monitorea en tiempo real** el estado de tus presupuestos
- **Recibe alertas automáticas** cuando te acerques a los límites
- **Gestiona notificaciones** y configuraciones avanzadas

#### Gestión de Presupuestos:

- **Crear presupuesto**: Define nombre, categoría, límite mensual y umbrales
- **Monitoreo automático**: Sistema detecta automáticamente gastos por categoría
- **Estados visuales**: Seguro (verde), Advertencia (amarillo), Peligro (rojo), Excedido (rojo oscuro)
- **Proyecciones inteligentes**: Predicción de sobregasto basada en tendencias actuales
- **Alertas configurables**: Personaliza notificaciones y reportes

### 6. Proyecciones de Gastos (NUEVO)

- Ve a la pestaña **"📈 Proyecciones"**
- **Crea nuevas proyecciones** con diferentes algoritmos:
  - **Promedio Histórico**: Para gastos estables
  - **Tendencias**: Para detectar cambios progresivos
  - **Estacional**: Para gastos que varían por época
  - **Híbrido**: Combina múltiples factores (recomendado)
- **Configura parámetros avanzados**:
  - Período base (3-24 meses de historial)
  - Umbrales de confianza personalizados
  - Habilitación de análisis estacionales
- **Analiza resultados detallados**:
  - Gráficos de distribución por categorías
  - Métricas de confianza y advertencias
  - Recomendaciones para mejorar precisión
- **Gestiona proyecciones**:
  - Activa/desactiva proyecciones según necesidad
  - Elimina proyecciones obsoletas con confirmación
  - Exporta resultados para planificación externa

## 🎨 Paleta de Colores

### Estados Financieros

- **Balance Positivo**: Verde (#10B981)
- **Balance Negativo**: Rojo (#EF4444)
- **Ingresos**: Verde (#10B981)
- **Gastos**: Rojo (#EF4444)
- **Ahorro**: Azul (#3B82F6)

### Proyecciones y Confianza

- **Alta Confianza (80%+)**: Verde (#10B981)
- **Confianza Media (60-79%)**: Amarillo (#F59E0B)
- **Baja Confianza (<60%)**: Rojo (#EF4444)
- **Proyecciones**: Naranja (#F97316)

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
- **Proyecciones persistentes** con configuraciones personalizadas

### Validación de Datos

- **Validación client-side** con Zod schemas
- **Sanitización** de inputs para gastos, ingresos y proyecciones
- **Type safety** con TypeScript
- **Manejo de errores** robusto
- **Validación de rangos** para fechas y montos en proyecciones

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

## 🔮 Algoritmos de Proyección

### 1. Promedio Histórico

```typescript
proyecciónMensual = totalGastos / númeroMeses
proyecciónTotal = proyecciónMensual × mesesFuturos
```

**Ideal para**: Gastos estables sin variaciones significativas

### 2. Análisis de Tendencias

```typescript
// Regresión lineal simple
tendencia = (n × ΣXY - ΣX × ΣY) / (n × ΣX² - (ΣX)²)
proyecciónAjustada = baseAmount + (tendencia × tiempoFuturo)
```

**Ideal para**: Detectar patrones de crecimiento o decrecimiento

### 3. Ajustes Estacionales

```typescript
multiplicadores = [1.1, 0.9, 1.0, 1.0, 1.0, 1.0, 1.1, 1.0, 1.0, 1.0, 1.2, 1.3]
// Enero y julio: +10%, febrero: -10%, noviembre: +20%, diciembre: +30%
proyecciónEstacional = proyecciónBase × multiplicadorMes
```

**Ideal para**: Gastos que varían según la época del año

### 4. Híbrido (Recomendado)

```typescript
resultado = aplicarTendencia(aplicarEstacionalidad(promedioHistórico))
confianza = confianzaBase × factorCombinado
```

**Ideal para**: Máxima precisión combinando múltiples factores

### 5. Manual

Permite ajustes personalizados sobre cualquier base calculada.
**Ideal para**: Situaciones específicas o cambios de vida planificados

### Cálculo de Confianza

```typescript
coeficienteVariación = desviacionEstandar / media
confianza = Math.max(0, 100 - (coeficienteVariación × 100))
```

## 🎯 Casos de Uso para Proyecciones

### 📅 Planificación Mensual

- **Algoritmo recomendado**: Promedio Histórico
- **Período**: 1-3 meses
- **Uso**: Presupuesto mensual, gastos recurrentes

### 🎯 Planificación Anual

- **Algoritmo recomendado**: Híbrido
- **Período**: 6-12 meses
- **Uso**: Objetivos anuales, planificación de ahorros

### 🔍 Análisis de Tendencias

- **Algoritmo recomendado**: Basado en Tendencias
- **Período**: 3-6 meses
- **Uso**: Identificar cambios en patrones de gasto

### 🎄 Gastos Estacionales

- **Algoritmo recomendado**: Estacional o Híbrido
- **Período**: 12 meses
- **Uso**: Planificar gastos de navidad, vacaciones, etc.

### ⚠️ Detección de Anomalías

- **Métrica clave**: Nivel de confianza
- **Umbral**: < 70% genera alertas
- **Uso**: Identificar cambios significativos en patrones

---

**Estado del Proyecto**: ✅ **Producción Ready** (Septiembre 2025)

_Una herramienta moderna para tomar control de tus finanzas personales con proyecciones inteligentes_ 💰📈
