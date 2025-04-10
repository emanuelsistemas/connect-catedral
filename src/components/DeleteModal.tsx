import React, { useState } from 'react';

interface DeleteModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ title, description, onConfirm, onCancel }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmEnabled = confirmText.toLowerCase() === 'deletar';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
            <p>
              Atenção! Esta ação não pode ser desfeita. Ao deletar este item:
            </p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Todas as visualizações serão removidas</li>
              <li>Todos os cliques no WhatsApp serão removidos</li>
              <li>Todas as avaliações serão removidas</li>
              <li>Os dados serão removidos do dashboard</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Digite "deletar" para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="deletar"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-input rounded-lg hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
            className="flex-1 py-2 px-4 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}