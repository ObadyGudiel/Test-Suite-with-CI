# Nexo · Workspace

Plataforma de gestión de proyectos y tareas con una interfaz adaptable en español. Unifica el seguimiento del trabajo, prioridades, responsables, fechas límite y actividad del equipo en un tablero Kanban y una vista de lista.

## Inicio rápido

Requiere **Node.js 24 o superior** y npm.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. El backend funciona en http://127.0.0.1:3001. Vite redirige `/api` al backend durante el desarrollo.

**Acceso local de demostración:** `admin@nexo.local` / `NexoDemo2026!`. Los proyectos y tareas de ejemplo se crean al iniciar en desarrollo. Los cambios se conservan en `data/nexo.db`; no se regeneran al recargar la página. No es necesario instalar un servidor de base de datos.

## Funcionalidades

- Autenticación con sesiones de 24 horas y cierre de sesión.
- Dashboard con proyectos, tareas completadas, trabajo activo y vencimientos.
- Creación de proyectos con descripción y color.
- Creación, edición y eliminación confirmada de tareas.
- Cuatro estados: por hacer, en progreso, en revisión y completado.
- Prioridad, responsable, fecha límite y descripción por tarea.
- Búsqueda por título o responsable y filtros por proyecto y prioridad.
- Tablero Kanban, vista de lista y registro de actividad persistente.
- Diseño adaptable, formularios etiquetados, estados vacíos y mensajes de error.

## Tecnologías y estructura

React 19 y Vite para la interfaz; Lucide para iconos; Express 5 para la API; SQLite mediante el módulo nativo de Node.js para persistencia; Zod para validación. Las contraseñas usan scrypt con sal aleatoria, las cookies son HttpOnly y SameSite Strict y los tokens se almacenan mediante SHA-256. Helmet agrega cabeceras de seguridad y el acceso tiene límite de intentos.

```text
frontend/             Interfaz React y estilos
backend/              API, base de datos y reglas de negocio
backend/tests/        Pruebas unitarias y de integración
cypress/e2e/          Flujos completos de usuario
tests/load.js         Escenario de carga con k6
.github/workflows/    Automatización de calidad
```

SQLite simplifica la instalación y permite probar una base real. Es adecuado para esta aplicación de un único workspace y un solo servidor. El diseño de la interfaz tiene orientación empresarial; no implica certificaciones, soporte multiempresa, control de roles, alta disponibilidad ni preparación automática para una operación corporativa a gran escala. Los responsables son nombres de asignación; no representan cuentas adicionales. Los proyectos se crean y consultan; no se editan ni eliminan desde la interfaz.

## Pruebas

```sh
npm test                  # Unitarias e integración
npm run test:unit
npm run test:integration
npx cypress install       # Instala el navegador de pruebas la primera vez
npm run test:e2e          # Inicia frontend/backend y ejecuta Cypress
npm run test:load         # Requiere k6 y el backend iniciado
npm run build            # Compilación del frontend
```

No ejecutes `test:e2e` con otra instancia en los puertos 3001/5173. E2E crea una base temporal aislada y la elimina al finalizar, sin modificar tus datos locales. Ejecuta la carga sobre un entorno de pruebas. En CI cada suite usa un entorno independiente.

**Unitarias:** validación de entradas, fechas, cálculo de métricas y verificación de contraseñas.

**Integración:** peticiones HTTP reales sobre Express y una base SQLite en memoria: acceso, autenticación fallida, proyectos, rechazo de datos inválidos, integridad de referencias, creación/edición/eliminación de tareas, auditoría y cierre de sesión. Supertest comprueba respuestas y se consulta directamente la base para verificar persistencia de la edición durante la sesión de prueba.

**E2E:** Cypress inicia sesión, crea un proyecto y una tarea, cambia su estado, recarga para comprobar persistencia, elimina la tarea, busca, cambia la vista y cierra sesión.

**Carga:** k6 autentica una sesión y aumenta la carga de 10 a 20 usuarios virtuales durante 40 segundos. Comprueba el contrato del workspace; exige menos del 1% de errores, más del 99% de comprobaciones exitosas y p95 inferior a 500 ms. Instala k6 desde https://grafana.com/docs/k6/latest/set-up/install-k6/. Las variables `BASE_URL`, `LOAD_EMAIL` y `LOAD_PASSWORD` permiten apuntar a un entorno de pruebas diferente. Los umbrales son objetivos de esta suite, no una garantía de capacidad en cualquier equipo.

## API

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| POST | `/api/login` | Autenticar con email y password |
| POST | `/api/logout` | Revocar sesión |
| GET | `/api/workspace` | Usuario, proyectos, tareas, métricas y actividad |
| POST | `/api/projects` | Crear proyecto |
| POST | `/api/tasks` | Crear tarea |
| PATCH | `/api/tasks/:id` | Editar campos de tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |

Salvo health y login, las rutas exigen una cookie de sesión. Las respuestas de error tienen forma `{ "error": "mensaje" }`. Los campos obligatorios de una tarea son `title` y `projectId`; `status` acepta `todo`, `progress`, `review`, `done`; `priority` acepta `low`, `medium`, `high`. `dueDate` acepta una fecha ISO `YYYY-MM-DD` o cadena vacía. Un proyecto exige `name` y acepta `description` y `color` hexadecimal.

## GitHub Actions y bloqueo de cambios

Cada `push` y `pull_request` ejecuta tres trabajos independientes: **Unit & Integration**, **Cypress E2E** y **k6 Load**. El check final **Quality Gate** solo es exitoso si todos terminan correctamente. Cypress conserva capturas de fallos como artefactos.

Para impedir la integración de cambios fallidos debes publicar este repositorio en GitHub y configurar una regla para `main` en **Settings → Rules → Rulesets** (o Branch protection): exigir pull request, exigir el check **Quality Gate**, exigir que la rama esté actualizada y bloquear bypass y pushes directos. El archivo de Actions por sí solo no configura estas restricciones del repositorio. Selecciona el check después de la primera ejecución. No se incluyen resultados ni capturas simuladas de GitHub Actions.

## Compilación y ejecución de producción

```sh
npm ci
npm run build
npm start
```

El servidor sirve la interfaz compilada y la API en el puerto 3001. Para producción configura `NODE_ENV=production`, `ADMIN_EMAIL` y una `ADMIN_PASSWORD` de al menos 12 caracteres **antes del primer arranque**. En producción no se crean datos de ejemplo salvo que `SEED_DEMO=true`. Usa HTTPS mediante un proxy inverso: las cookies de producción llevan `Secure` y requieren HTTPS. No uses la clave de demostración en un servidor público.

`.env.example` sirve como referencia; la aplicación lee variables del proceso, no carga `.env` automáticamente. Cambiar `ADMIN_PASSWORD` después del primer arranque no cambia la contraseña ya guardada. Respalda el directorio `data` con el servicio detenido o con una herramienta compatible con SQLite. Mantén una sola instancia de servidor por archivo de base de datos. Las tipografías se cargan opcionalmente desde Google Fonts y tienen fuentes locales de respaldo.
