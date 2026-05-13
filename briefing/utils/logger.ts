const ts = () => new Date().toISOString();

export const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`[INFO] ${ts()} ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`[WARN] ${ts()} ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`[ERROR] ${ts()} ${msg}`, ...args),
};
