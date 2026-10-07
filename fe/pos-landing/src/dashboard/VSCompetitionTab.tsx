import { useState } from 'react';
import { useConfig } from '@/hooks/useConfig';
import { Icon } from '@/components/ui/Icon';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { 
  AutoTranslateWrapper, 
  LangToggle, 
  TextField, 
  ItemActions, 
  AddButton 
} from './components';

interface VsRow {
  feature: string;
  jm: string;
  alt1: string;
  alt2: string;
}

export function VSCompetitionTab() {
  const { config, setConfig } = useConfig();
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const rows = (config.translations[lang]?.vs?.rows as VsRow[]) ?? [];

  const updateRows = (newRows: VsRow[]) => {
    setConfig({
      ...config,
      translations: {
        ...config.translations,
        [lang]: {
          ...config.translations[lang],
          vs: {
            ...config.translations[lang]?.vs,
            rows: newRows,
          },
        },
      },
    });
  };

  const handleAddRow = () => {
    updateRows([
      ...rows,
      {
        feature: 'New feature',
        jm: 'Tsuru value',
        alt1: 'Competitor 1 value',
        alt2: 'Competitor 2 value',
      },
    ]);
  };

  const updateRow = (index: number, updates: Partial<VsRow>) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], ...updates };
    updateRows(newRows);
  };

  const handleDeleteRow = (index: number) => {
    updateRows(rows.filter((_, i) => i !== index));
    setPendingDelete(null);
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newRows = [...rows];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
    updateRows(newRows);
  };

  const handleAutoTranslate = (translatedData: any) => {
    if (translatedData.rows) {
      setConfig({
        ...config,
        translations: {
          ...config.translations,
          [lang]: {
            ...config.translations[lang],
            vs: {
              ...config.translations[lang]?.vs,
              ...translatedData,
            },
          },
        },
      });
    }
  };

  const sourceLang = lang === 'en' ? 'es' : 'en';
  const sourceData = config.translations[sourceLang]?.vs;
  const targetData = config.translations[lang]?.vs;

  return (
    <AutoTranslateWrapper
      sourceData={sourceData}
      targetData={targetData}
      sourceLang={sourceLang}
      targetLang={lang}
      onTranslated={handleAutoTranslate}
      enabled={true}
    >
      <div className="space-y-6">
        <LangToggle value={lang} onChange={setLang} />

        {/* Info */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            <Icon name="Info" size={14} className="inline mr-1" />
            Esta sección compara tu producto (Tsuru POS) contra dos tipos de competidores.
          </p>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="border border-border rounded-lg bg-card p-4">
              <div className="flex items-start gap-4">
                {/* Row number */}
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 font-display font-bold text-sm">
                  {i + 1}
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-3">
                  <TextField
                    label="Nombre de Característica"
                    value={row.feature}
                    onChange={(feature) => updateRow(i, { feature })}
                    placeholder="ej., Modelo de pago"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label={
                        <span className="text-primary">
                          <Icon name="BadgeCheck" size={12} className="inline mr-1" />
                          Tsuru POS
                        </span>
                      }
                      value={row.jm}
                      onChange={(jm) => updateRow(i, { jm })}
                      placeholder="Tu valor"
                      inputClassName="text-sm"
                    />
                    <TextField
                      label={<span className="text-muted-foreground">Competidor 1</span>}
                      value={row.alt1}
                      onChange={(alt1) => updateRow(i, { alt1 })}
                      placeholder="Valor del competidor"
                      inputClassName="text-sm"
                    />
                    <TextField
                      label={<span className="text-muted-foreground">Competidor 2</span>}
                      value={row.alt2}
                      onChange={(alt2) => updateRow(i, { alt2 })}
                      placeholder="Valor del competidor"
                      inputClassName="text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <ItemActions
                  index={i}
                  total={rows.length}
                  onMove={(dir) => moveRow(i, dir)}
                  onDelete={() => setPendingDelete(i)}
                />
              </div>
            </div>
          ))}
        </div>

        <AddButton
          onClick={handleAddRow}
          label="Agregar Fila de Comparación"
          variant="outline"
        />

        {/* Confirm modal */}
        {pendingDelete !== null && (
          <ConfirmModal
            title="¿Eliminar fila de comparación?"
            description={`Eliminar característica: "${rows[pendingDelete]?.feature}"`}
            confirmLabel="Eliminar"
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => handleDeleteRow(pendingDelete)}
          />
        )}
      </div>
    </AutoTranslateWrapper>
  );
}
