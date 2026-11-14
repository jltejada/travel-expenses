# Travel Expenses — primera implementación (fase 1)

Este repositorio contiene un prototipo funcional de captura manual de tickets y consulta, preparado para Supabase. **Todavía no incluye IA, edición, liquidaciones, PDF, Excel, archivado ni instalación PWA offline.**

## Puesta en marcha
1. Crear un proyecto gratuito en https://supabase.com y guardar la URL y la clave pública `anon` (o publishable key).
2. Abrir Supabase → SQL Editor y ejecutar `supabase/schema.sql`.
3. En Authentication → Providers → Email, mantener el acceso email/contraseña. Para uso privado, desactivar los registros públicos y crear el usuario en Authentication → Users → Add user, con contraseña.
4. Copiar `.env.example` como `.env` y completar las dos variables. **Nunca introducir una clave `service_role` ni `secret` en el frontend.**
5. Ejecutar `npm install` y `npm run dev` con Node.js 20.19+ o 22.12+.
6. Acceder desde el navegador y probar una foto, guardado y consulta.

## Publicación en GitHub Pages
- Subir el proyecto a un repositorio GitHub **sin el archivo `.env`**.
- Configurar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub Actions (Variables), y generar el build con ellas.
- Publicar la carpeta `dist` mediante GitHub Actions/Pages. `vite.config.ts` calcula la ruta base del repositorio en Actions.
- Añadir el dominio público en Supabase → Authentication → URL Configuration si se usa confirmación de correo o recuperación de contraseña.

## Límites y precauciones
- La aplicación no es todavía un MVP completo: es el **primer incremento ejecutable**.
- No hay IA ni reconocimiento automático: introducir datos manualmente.
- No se habilita edición de gastos procesados ni liquidaciones hasta implementar transacciones seguras.
- La eliminación de imágenes tras eliminar el registro puede fallar por problemas de red; implementar reconciliación en fase posterior.
- Los controles de la interfaz móvil no constituyen controles de autorización. RLS protege cada usuario, pero la gestión exclusiva de escritorio es una decisión de experiencia de uso, no una frontera de seguridad.
- No subir fotografías reales a GitHub. Mantener Supabase Storage privado.
- Antes de utilizarla con datos empresariales reales, revisar privacidad, condiciones de tratamiento y retención.
