/** Leitura/escrita de JSON no Web Storage, tolerante a dados corrompidos ou storage bloqueado. */
export function readJson<T>(storage: Storage, key: string, isValid: (v: unknown) => v is T): T | undefined {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return undefined;
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writeJson(storage: Storage, key: string, value: unknown) {
  try {
    if (value === undefined) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage indisponível (modo privado, cota esgotada): o app segue funcionando sem persistir.
  }
}
