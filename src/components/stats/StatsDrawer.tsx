import React, { useRef, useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { X, Download, Upload, RotateCcw, Flame, CheckCircle } from 'lucide-react';

export const StatsDrawer: React.FC = () => {
  const {
    isStatsOpen,
    setStatsOpen,
    items,
    categories,
    resetToSampleData,
    exportBackup,
    importBackup,
  } = usePlannerStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isStatsOpen) return null;

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'done').length;

  // Category counts
  const categoryStats = categories.map((cat) => {
    const catItems = items.filter((i) => i.categoryId === cat.id);
    const catDone = catItems.filter((i) => i.status === 'done').length;
    return {
      category: cat,
      total: catItems.length,
      done: catDone,
      percent: catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0,
    };
  });

  const handleExport = async () => {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asapp-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const ok = await importBackup(content);
      if (ok) {
        setImportStatus('Veriler başarıyla içe aktarıldı!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Hata: Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#101744] border-l border-white/10 h-full p-6 tablet-p:p-8 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-mint block mb-1">
                GENEL DURUM & AYARLAR
              </span>
              <h2 className="text-3xl font-black font-display text-white tracking-tight">
                İstatistikler
              </h2>
            </div>
            <button
              onClick={() => setStatsOpen(false)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 text-accent-pink mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Aktif Seri</span>
              </div>
              <span className="text-3xl font-black font-display text-white tabular-nums">7 Gün</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 text-accent-mint mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Tamamlanan</span>
              </div>
              <span className="text-3xl font-black font-display text-white tabular-nums">
                {completedItems}
                <span className="text-base text-text-muted font-normal"> / {totalItems}</span>
              </span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-[0.2em] font-extrabold text-text-muted mb-4">
              KATEGORİ DAĞILIMI
            </h3>
            <div className="space-y-3">
              {categoryStats.map((stat) => (
                <div key={stat.category.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stat.category.color }}
                      />
                      {stat.category.name}
                    </span>
                    <span className="text-xs font-bold text-accent-mint tabular-nums">
                      %{stat.percent} ({stat.done}/{stat.total})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${stat.percent}%`,
                        backgroundColor: stat.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backup & Data Actions */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] font-extrabold text-text-muted mb-2">
            VERİ VE YEDEKLEME
          </h3>

          {importStatus && (
            <div className="p-3 text-xs rounded-xl bg-accent-mint/20 text-accent-mint font-semibold mb-2">
              {importStatus}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="py-3 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-accent-pink" />
              <span>Yedek İndir</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-accent-mint" />
              <span>İçe Aktar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            onClick={() => {
              if (confirm('Örnek verilere sıfırlamak istediğinize emin misiniz?')) {
                resetToSampleData();
              }
            }}
            className="w-full py-2.5 px-3 rounded-2xl border border-white/5 hover:border-accent-coral/30 hover:bg-accent-coral/10 text-text-muted hover:text-accent-coral font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Örnek Verileri Yeniden Yükle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
