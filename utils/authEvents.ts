let listeners: (() => void)[] = [];

export const subscribeAuth = (fn: () => void) => {
  listeners.push(fn);
};

export const notifyAuthChange = () => {
  listeners.forEach((fn) => fn());
};
