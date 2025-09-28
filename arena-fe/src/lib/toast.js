let listeners = [];
let toasts = [];

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function emit() {
  for (const l of listeners) l(toasts);
}

export function addToast({ message, type = 'info', timeout = 5000 }) {
  const id = Math.random().toString(36).slice(2);
  const toast = { id, message, type };
  toasts = [...toasts, toast];
  emit();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  }, timeout);
}

export function getToasts() {
  return toasts;
}
