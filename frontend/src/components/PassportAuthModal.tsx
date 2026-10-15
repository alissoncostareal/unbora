import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { OPEN_PASSPORT_MODAL_EVENT, CLOSE_PASSPORT_MODAL_EVENT } from '../lib/passportModal';

interface PassportAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PassportAuthModal({ isOpen: controlledIsOpen, onClose }: PassportAuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    const handleGlobalOpen = () => {
      setInternalOpen(true);
    };
    const handleGlobalClose = () => {
      setInternalOpen(false);
    };

    window.addEventListener(OPEN_PASSPORT_MODAL_EVENT, handleGlobalOpen);
    window.addEventListener(CLOSE_PASSPORT_MODAL_EVENT, handleGlobalClose);

    return () => {
      window.removeEventListener(OPEN_PASSPORT_MODAL_EVENT, handleGlobalOpen);
      window.removeEventListener(CLOSE_PASSPORT_MODAL_EVENT, handleGlobalClose);
    };
  }, []);

  // Bloqueio do scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-none bg-[#faf8f5] border border-[#eadfd4] p-8 sm:p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        {/* Botao Fechar */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-none text-[#73685e] hover:bg-[#e7e0d8] hover:text-[#1c1917] transition-colors cursor-pointer"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Ícone Editorial do Passaporte */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-[#7c2f1d]/10 text-[#7c2f1d]">
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>

        {/* Título e Descrição */}
        <h2 id="passport-modal-title" className="mt-5 text-2xl sm:text-3xl font-light tracking-tight text-[#1c1917]">
          Crie seu Passaporte Urbano
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-[#6b625b] leading-relaxed max-w-md mx-auto">
          Faça login ou cadastre-se no Unbora para registrar onde você esteve, ver locais visitados no mês passado e receber convites para revisitar seus favoritos.
        </p>

        {/* Ações: Entrar e Criar Conta */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            onClick={handleClose}
            className="flex-1 rounded-none bg-[#7c2f1d] hover:bg-[#602416] py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors text-center"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            onClick={handleClose}
            className="flex-1 rounded-none border border-[#1c1917] bg-white hover:bg-[#1c1917] hover:text-white py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[#1c1917] shadow-xs transition-colors text-center"
          >
            Criar Conta
          </Link>
        </div>

        {/* Dispensar / Continuar sem salvar */}
        <div className="mt-6 pt-4 border-t border-[#eadfd4]/60">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-medium text-[#73685e] hover:text-[#1c1917] underline decoration-[#eadfd4] underline-offset-4 cursor-pointer transition-colors"
          >
            Continuar navegando sem salvar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
