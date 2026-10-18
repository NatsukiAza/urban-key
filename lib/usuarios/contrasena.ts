const SILABAS = ['Kasa', 'Luna', 'Mate', 'Roca', 'Vela', 'Nube', 'Pino', 'Sol', 'Rio', 'Faro', 'Cima', 'Brisa'];

// Contraseña temporal fácil de dictar, con el formato "Kasa-7392".
export const generarContrasenaTemporal = (): string => {
    const buffer = new Uint32Array(2);
    crypto.getRandomValues(buffer);
    return `${SILABAS[buffer[0] % SILABAS.length]}-${String(1000 + (buffer[1] % 9000))}`;
};
