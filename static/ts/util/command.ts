type Command = (...args: any) => void;

let registry = new Map<string, Command>();

export function register(name: string, func: Command) {
    registry.set(name, func);
}

export function execute(name: string, ...args: any) {
    let func = registry.get(name);
    if (!func) { throw new Error(`Command "${name}" does not exist`); }

    return func(...args);
}
