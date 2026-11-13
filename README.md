# Salva al Muñeco 🎯📐 (Ahorcado Inverso de Matrices y Transformaciones Lineales)

**Salva al muñeco** es una aplicación web educativa multijugador en tiempo real diseñada para el aprendizaje dinámico y riguroso de matrices $2\times 2$ y transformaciones lineales (rotaciones, reflexiones, escalamientos y composiciones).

Diseñado con una mecánica de **ahorcado inverso**: cada jugador comienza con **3 piezas de peligro**. Un acierto retira una pieza (con 0 piezas el muñeco queda **¡Salvado!** con expresión feliz). Un error o tiempo agotado añade una pieza (con 6 piezas el muñeco muere y el jugador queda eliminado).

---

## 🚀 Despliegue Rápido en 3 Pasos (Supabase + GitHub + Vercel)

### Paso 1: Configurar Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto gratuito.
2. Dirígete a la sección **SQL Editor** en el panel izquierdo.
3. Copia todo el contenido del archivo [`supabase/schema.sql`](file:///c:/Users/leon-/Documents/juego%20ahorcado/supabase/schema.sql) y pégalo en el editor SQL. Haz clic en **Run**.
4. Ve a **Project Settings -> API** y copia tus credenciales:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

### Paso 2: Subir el Proyecto a GitHub
1. Abre tu terminal en este directorio y sube el repositorio:
   ```bash
   git add .
   git commit -m "feat: Salva al muñeco juego multijugador completo"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/salva-al-muneco.git
   git push -u origin main
   ```

### Paso 3: Desplegar Gratis en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New -> Project** e importa el repositorio `salva-al-muneco`.
3. En la sección **Environment Variables**, añade las siguientes 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anon de Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu clave secreta de service role de Supabase.
4. Haz clic en **Deploy**. ¡Tu aplicación estará en vivo con dominio HTTPS gratuito en menos de 2 minutos!

---

## 🕹️ Reglas Oficiales y Criterio de Victoria

1. **Multijugador:** Hasta **30 jugadores simultáneos** por sala con código de 6 caracteres y reconexión automática mediante token guardado en `localStorage`.
2. **Mecánica de Supervivencia:**
   - 10 preguntas por partida (tiempo configurable de 60s a 90s).
   - Inicia con `3/6` piezas de peligro.
   - **Respuesta Correcta:** `+1 punto`, `+1 acierto`, retira 1 pieza (`Math.max(0, piezas - 1)`). Si llega a `0`, ¡el muñeco queda a salvo!
   - **Respuesta Incorrecta o Tiempo Agotado:** `-1 punto`, `+1 error`, añade 1 pieza (`Math.min(6, piezas + 1)`).
   - **Eliminación:** Si alcanza `6/6` piezas, el muñeco muere y el jugador queda fuera de la partida.
3. **Criterio de Desempate en el Podio:**
   - **1º Supervivencia:** Quien no haya dejado morir al muñeco (`piezas < 6`). Los eliminados siempre quedan por debajo.
   - **2º Mayor cantidad de aciertos.**
   - **3º Desempate por velocidad:** Menor `tiempoTotalMs` calculado estrictamente en el servidor.

---

## 🧪 Pruebas Unitarias y Compilación

Para ejecutar las pruebas del motor matemático (con 100 generaciones por nivel y validación de fracciones):
```bash
npm test
```

Para compilar el proyecto en modo producción:
```bash
npm run build
```

---

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Renderizado Matemático:** KaTeX (`katex.min.css`).
- **Motor Matemático:** Aritmética exacta de fracciones y matrices $2\times 2$ con evaluación de equivalencias.
- **Backend & Base de Datos:** Next.js Route Handlers + Supabase Database & Realtime con políticas de seguridad Zero-Trust.
- **Exportación:** Generación y descarga en PNG del gráfico del podio oficial y comparativa de jugadores.
