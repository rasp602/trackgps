import { writable } from 'svelte/store';

export const alertStore = writable({
  message: '',
  visible: false
});

/**
 * @param {any} message
 */
export function showAlert(message) {
  alertStore.set({ message, visible: true });
  setTimeout(() => {
    alertStore.set({ message: '', visible: false });
  }, 3000); // Oculta la alerta después de 3 segundos
}
