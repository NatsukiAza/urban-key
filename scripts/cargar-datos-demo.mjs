import { readFileSync } from 'node:fs';

const CONTACTOS = [
    { nombre: 'Marta', apellido: 'Ruiz', email: 'marta.ruiz@mail.com', telefono: '11-5555-1001', estado: 'CLIENTE', es_propietario: true, es_interesado: false },
    { nombre: 'Jorge', apellido: 'Sosa', email: 'jorge.sosa@mail.com', telefono: '11-5555-1002', estado: 'POTENCIAL', es_propietario: true, es_interesado: false },
    { nombre: 'Lucía', apellido: 'Díaz', email: 'lucia.diaz@mail.com', telefono: '11-5555-1003', estado: 'POTENCIAL', es_propietario: false, es_interesado: true },
    { nombre: 'Pablo', apellido: 'Molina', email: 'pablo.molina@mail.com', telefono: '11-5555-1004', estado: 'POTENCIAL', es_propietario: false, es_interesado: true },
    { nombre: 'Sofía', apellido: 'Vega', email: 'sofia.vega@mail.com', telefono: '11-5555-1005', estado: 'CLIENTE', es_propietario: true, es_interesado: true },
    { nombre: 'Diego', apellido: 'Acuña', email: 'diego.acuna@mail.com', telefono: '11-5555-1006', estado: 'POTENCIAL', es_propietario: false, es_interesado: true },
];

const INMUEBLES = [
    { propietario: 'marta.ruiz@mail.com', direccion: 'Av. Rivadavia 18500, Morón', tipo_operacion: 'VENTA', tipo_inmueble: 'DEPARTAMENTO', ambientes: 3, m2: 78, precio: 145000, moneda: 'USD' },
    { propietario: 'jorge.sosa@mail.com', direccion: 'Bolívar 240, Ramos Mejía', tipo_operacion: 'ALQUILER', tipo_inmueble: 'DEPARTAMENTO', ambientes: 2, m2: 55, precio: 420000, moneda: 'ARS' },
    { propietario: 'sofia.vega@mail.com', direccion: 'Güemes 1120, Castelar', tipo_operacion: 'VENTA', tipo_inmueble: 'CASA', ambientes: 4, m2: 120, precio: 210000, moneda: 'USD' },
    { propietario: 'sofia.vega@mail.com', direccion: 'Marconi 875, Haedo', tipo_operacion: 'ALQUILER', tipo_inmueble: 'DEPARTAMENTO', ambientes: 1, m2: 38, precio: 310000, moneda: 'ARS' },
];

function leerEnv(archivo) {
    const vars = {};
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
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

let env;
try {
    env = leerEnv('.env.local');
} catch {
    fallar('No existe .env.local.');
}

const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!base || !key) fallar('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.');
if (!env.DEV_USER_EMAIL || !env.DEV_USER_PASSWORD) {
    fallar('Faltan DEV_USER_EMAIL y DEV_USER_PASSWORD en .env.local.', 'Este script escribe con esa sesión porque RLS no deja escribir de forma anónima.');
}

const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.DEV_USER_EMAIL, password: env.DEV_USER_PASSWORD }),
});
const sesion = await login.json();
if (!login.ok) fallar(`No se pudo abrir sesión: ${sesion.error_description ?? sesion.msg ?? login.status}`);

const headers = { apikey: key, Authorization: `Bearer ${sesion.access_token}`, 'Content-Type': 'application/json' };
console.log(`→ Sesión abierta como ${env.DEV_USER_EMAIL}`);

async function pedir(ruta, opciones = {}) {
    const r = await fetch(`${base}/rest/v1/${ruta}`, { ...opciones, headers: { ...headers, ...opciones.headers } });
    const texto = await r.text();
    if (!r.ok) {
        let detalle = texto;
        try {
            detalle = JSON.parse(texto).message;
        } catch {}
        fallar(`${opciones.method ?? 'GET'} ${ruta} → ${r.status}: ${detalle}`);
    }
    return texto ? JSON.parse(texto) : null;
}

const existentes = await pedir('contactos?select=id,email');
const porEmail = new Map(existentes.map((c) => [c.email, c.id]));

const faltantes = CONTACTOS.filter((c) => !porEmail.has(c.email));
if (faltantes.length) {
    const creados = await pedir('contactos?select=id,email', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(faltantes),
    });
    creados.forEach((c) => porEmail.set(c.email, c.id));
}
console.log(`✓ Contactos: ${faltantes.length} nuevos, ${CONTACTOS.length - faltantes.length} ya estaban`);

const direcciones = new Set((await pedir('inmuebles?select=direccion')).map((i) => i.direccion));

const nuevosInmuebles = INMUEBLES.filter((i) => !direcciones.has(i.direccion)).map(({ propietario, ...resto }) => ({
    ...resto,
    contacto_id: porEmail.get(propietario),
}));

if (nuevosInmuebles.length) {
    await pedir('inmuebles', { method: 'POST', body: JSON.stringify(nuevosInmuebles) });
}
console.log(`✓ Inmuebles: ${nuevosInmuebles.length} nuevos, ${INMUEBLES.length - nuevosInmuebles.length} ya estaban`);

console.log('\nListo. Ya podés crear oportunidades desde /oportunidades/nuevo.');
