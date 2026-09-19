/**
 * TickerSection Component
 * Edit ticker items for the animated bar below hero
 */

import { useConfig } from '@/hooks/useConfig';
import { ItemActions } from '../components/ItemActions';
import { AddButton } from '../components/AddButton';
import { Icon } from '@/components/ui/Icon';
import { useDragReorder } from '../hooks/useDragReorder';
import type { LangKey } from '@/types';

interface TickerSectionProps {
  lang: LangKey;
}

export function TickerSection({ lang }: TickerSectionProps) {
  const { config, setConfig } = useConfig();

  const hero = config.translations[lang]?.hero;
  const ticker = hero?.ticker ?? [];

  const setTicker = (items: string[]) => {
    setConfig({
      ...config,
      translations: {
        ...config.translations,
        [lang]: {
          ...config.translations[lang],
          hero: { ...hero, ticker: items },
        },
      },
    });
  };

  const addTickerItem = () => setTicker([...ticker, 'Nuevo ítem']);
  const updateTickerItem = (i: number, val: string) => {
    const updated = [...ticker];
    updated[i] = val;
    setTicker(updated);
  };
  const removeTickerItem = (i: number) => setTicker(ticker.filter((_, idx) => idx !== i));

  const {
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragReorder(ticker, setTicker);

  return (
    <div className="space-y-4">
      <AddButton onClick={addTickerItem} label="Agregar ítem" />
      <div className="space-y-2">
        {ticker.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-3 rounded-md border transition ${
              draggedIndex === i
                ? 'border-primary bg-primary/5 opacity-50'
                : 'border-border bg-background'
            }`}
          >
            <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <Icon name="Menu" size={16} />
            </button>
            <input
              type="text"
              value={item}
              onChange={(e) => updateTickerItem(i, e.target.value)}
              className="flex-1 h-9 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:border-primary"
              placeholder="Factura electrónica 4.4"
            />
            {/* `index`/`total` are required and the delete prop is `onDelete` —
                this passed a lone `onRemove`, which the component has never had.
                Every other call site (BenefitCard, TestimonialCard, FeatureGroup)
                passes the full set. */}
            <ItemActions
              index={i}
              total={ticker.length}
              onDelete={() => removeTickerItem(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
