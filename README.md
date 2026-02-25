# FitTracker

Aplicación personal para llevar el seguimiento de entrenamientos, nutrición y progreso físico.

---

## Secciones

### Inicio
Resumen del día nada más abrir la app:
- Sesiones de gimnasio completadas esta semana
- Calorías consumidas hoy frente al objetivo
- Calendario mensual que marca los días entrenados y los días con registro de nutrición

---

### Gimnasio
Gestiona tus sesiones de entrenamiento con total flexibilidad.

**Sesiones**
- Crea, renombra y elimina sesiones (renombrar y eliminar requieren confirmación en modal para evitar borrados accidentales)
- Asigna un emoji a cada sesión
- Reordena las sesiones con los botones ◄/► en las pestañas
- El orden se guarda y se mantiene entre reinicios y dispositivos

**Ejercicios**
- Añade ejercicios con nombre, grupo muscular, número de series, esquema de repeticiones y técnica (Recta, Inclinado, Dropset)
- Los ejercicios aparecen contraídos por defecto mostrando solo el nombre y las series; pulsa para expandir
- Reordena los ejercicios dentro de una sesión con los botones ▲/▼
- Edita las notas de cada ejercicio directamente desde la vista expandida

**Registro de entrenamiento**
- Introduce el peso (kg) y las repeticiones de cada serie
- Añade o elimina series sobre la marcha
- Elige el día al guardar la sesión (puedes registrar entrenamientos de días anteriores)
- Al guardar, la sesión queda registrada en el historial

**Historial y progreso por ejercicio**
- Gráfica de evolución del peso máximo por ejercicio a lo largo del tiempo
- Tabla con las últimas sesiones mostrando el peso usado y la variación respecto a la anterior
- Calendario mensual con los días entrenados; pulsa un día para ver qué sesión se hizo

---

### Nutrición
Registro diario de macros con navegación semanal.

- Navega entre semanas con las flechas
- Por cada día introduce: proteínas, hidratos, grasas, pasos y peso corporal
- Las calorías se calculan automáticamente (hidratos×4 + proteínas×4 + grasas×9)
- Barras de progreso frente al objetivo del día
- Cambia entre objetivo día ON (entrenamiento) y día OFF (descanso)
- Resumen semanal: media de kcal, proteínas, pasos y peso
- Cuadrícula semanal con un vistazo rápido de cada día

---

### Progreso
Dos pestañas con el historial completo.

**Seguimiento semanal**
- Gráfica de evolución de calorías (últimos 30 días)
- Gráfica de barras de pasos diarios (últimos 14 días)
- Gráfica de evolución del peso corporal (últimos 60 días)
- Tabla semanal con todos los datos diarios: fecha, kcal, hidratos, proteínas, grasas, peso y pasos

**Medidas corporales**
- Registra cintura y peso mes a mes con notas opcionales
- Gráfica de evolución de cintura
- Gráfica de evolución del peso mensual
- Tabla con el historial de todas las mediciones

---

### Ajustes
- Edita tu nombre y perfil
- Configura los objetivos de macros para días ON y OFF
- Sincronización con la nube para acceder desde cualquier dispositivo
- Exporta todos los datos como archivo JSON (copia de seguridad)
- Importa una copia de seguridad previamente exportada
- Restablece todos los datos para empezar desde cero

---

## Tecnología

- **Svelte + Vite** — interfaz reactiva
- **localStorage** — persistencia local de todos los datos
- **Supabase** — autenticación y sincronización en la nube
