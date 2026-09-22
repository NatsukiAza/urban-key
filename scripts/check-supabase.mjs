// Verifica que .env.local apunte a un proyecto de Supabase real y que la key pública sirva.
// Uso: npm run check:supabase
// Sin dependencias: lee el .env.local a mano porque corre fuera de Next.

import { readFileSync } from 'node:fs';

function leerEnv(archivo) {
    let contenido;
    try {
        contenido = readFileSync(archivo, 'utf8');
    } catch {
        return null;
    }
    const vars = {};
    for (const linea of contenido.split('\n')) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;
        const i = limpia.indexOf('=');
        if (i === -1) continue;
        vars[limpia.slice(0, i).trim()] = limpia.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return vars;
}

function fallar(mensaje, ...pistas) {
    console.error(`✗ ${mensaje}`);
    pistas.forEach((p) => console.error(`  ${p}`));
    process.exit(1);
}

const env = leerEnv('.env.local');
if (!env) fallar('No existe .env.local.', 'Copiá .env.example a .env.local y completá los valores.');

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key || url.includes('TU-PROYECTO') || key.includes('TU_ANON_KEY')) {
    fallar('.env.local todavía tiene los placeholders.', 'Project URL: Settings → Data API. Key: Settings → API Keys.');
}

// El Project URL es solo el origen. En el dashboard, justo al lado, está el "RESTful endpoint"
// (`.../rest/v1`), que es el error fácil de cometer: con él todas las rutas quedan duplicadas.
let origen;
try {
    origen = new URL(url);
} catch {
    fallar(`NEXT_PUBLIC_SUPABASE_URL no es una URL válida: ${url}`);
}

if (origen.pathname !== '/' && origen.pathname !== '') {
    fallar(`NEXT_PUBLIC_SUPABASE_URL tiene una ruta de más: ${origen.pathname}`, `Pegaste el RESTful endpoint. Va solo el Project URL: ${origen.origin}`);
}

const base = origen.origin;
console.log(`→ Proyecto: ${base}`);

// 1. ¿Existe el proyecto y está despierto?
try {
    const salud = await fetch(`${base}/auth/v1/health`, { headers: { apikey: key } });
    if (!salud.ok) throw new Error(`HTTP ${salud.status}`);
    console.log('✓ El proyecto responde');
} catch (err) {
    fallar(`No se pudo llegar al proyecto: ${err.message}`, 'Revisá el Project URL, y que el proyecto no esté pausado en el dashboard.');
}

// 2. ¿La key sirve? Se consulta una tabla que no existe a propósito:
//    con una key válida PostgREST contesta 404 (no encuentra la tabla); con una inválida, 401.
//    No se usa `GET /rest/v1/` porque ese endpoint exige una secret key, que nunca va en la app.
try {
    const sonda = await fetch(`${base}/rest/v1/__chequeo_de_conexion?select=*&limit=1`, { headers: { apikey: key } });
    if (sonda.status === 401 || sonda.status === 403) {
        const cuerpo = await sonda.json().catch(() => ({}));
        fallar(`La key fue rechazada: ${cuerpo.message ?? `HTTP ${sonda.status}`}`, 'Copiá de nuevo la anon/publishable key desde Settings → API Keys.');
    }
    console.log('✓ La key pública es válida');
} catch (err) {
    fallar(`Falló la llamada a la Data API: ${err.message}`);
}

// 3. Sesión de desarrollo (opcional). Si está configurada, se prueba de punta a punta:
//    login real → fila en usuarios (la crea el trigger) → lectura con RLS puesto.
const devEmail = env.DEV_USER_EMAIL;
const devPass = env.DEV_USER_PASSWORD;

if (!devEmail || !devPass) {
    console.log('\nTodo listo: la app puede hablar con Supabase.');
    console.log('ℹ Sin DEV_USER_EMAIL / DEV_USER_PASSWORD no se probó la sesión: los listados van a venir vacíos porque RLS bloquea al anónimo.');
    process.exit(0);
}

let token;
try {
    const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail, password: devPass }),
    });
    const cuerpo = await login.json();
    if (!login.ok) {
        fallar(
            `No se pudo abrir sesión como ${devEmail}: ${cuerpo.error_description ?? cuerpo.msg ?? `HTTP ${login.status}`}`,
            'Creá el usuario en Authentication → Users → Add user, tildando "Auto Confirm User".'
        );
    }
    token = cuerpo.access_token;
    console.log(`✓ Sesión abierta como ${devEmail}`);
} catch (err) {
    fallar(`Falló el login de desarrollo: ${err.message}`);
}

const autenticado = { apikey: key, Authorization: `Bearer ${token}` };

// El trigger on_auth_user_created tiene que haber creado el perfil.
const perfil = await fetch(`${base}/rest/v1/usuarios?select=nombre,apellido,rol&limit=1`, { headers: autenticado }).then((r) => r.json());
const yo = Array.isArray(perfil) ? perfil[0] : null;

if (!yo) {
    fallar('La sesión funciona pero no hay fila en public.usuarios.', 'El trigger on_auth_user_created no corrió: revisá que la migración del esquema se haya aplicado.');
}

console.log(`✓ Perfil en usuarios: ${yo.nombre || '(sin nombre)'} ${yo.apellido || ''} · rol ${yo.rol}`);

if (yo.rol !== 'ADMINISTRADOR') {
    console.log(`  ⚠ Con rol ${yo.rol} no vas a poder configurar nada ni ver oportunidades de otros.`);
    console.log(`     SQL Editor: update public.usuarios set rol = 'ADMINISTRADOR' where email = '${devEmail}';`);
}

// Datos de configuración de la tercera migración.
const contar = async (tabla) => {
    const r = await fetch(`${base}/rest/v1/${tabla}?select=id`, { headers: { ...autenticado, Prefer: 'count=exact', Range: '0-0' } });
    return Number((r.headers.get('content-range') ?? '/0').split('/')[1]);
};

const funnels = await contar('funnels');
const etapas = await contar('etapas');
const origenes = await contar('origenes');
const motivos = await contar('motivos_perdida');

console.log(`✓ Configuración: ${funnels} funnels · ${etapas} etapas · ${origenes} orígenes · ${motivos} motivos de pérdida`);

if (funnels !== 4 || etapas !== 29) {
    console.log('  ⚠ Se esperaban 4 funnels y 29 etapas. Revisá que la migración de datos de configuración se haya aplicado.');
}

console.log('\nTodo listo: la app puede hablar con Supabase y hay sesión con RLS puesto.');
