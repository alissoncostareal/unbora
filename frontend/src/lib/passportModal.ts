export const OPEN_PASSPORT_MODAL_EVENT = 'unbora:open_passport_modal';
export const CLOSE_PASSPORT_MODAL_EVENT = 'unbora:close_passport_modal';

export function openPassportModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_PASSPORT_MODAL_EVENT));
  }
}

export function closePassportModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOSE_PASSPORT_MODAL_EVENT));
  }
}
