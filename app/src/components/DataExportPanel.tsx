import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { exportPatientData, downloadJson } from '../lib/notifications';
import StudioIcon from './StudioIcon';

export default function DataExportPanel() {
  const { user } = useAppStore();
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    if (!user?.id) return;
    setExporting(true);
    try {
      const json = await exportPatientData(user.id);
      const slug = user.name.replace(/\s+/g, '-').toLowerCase();
      downloadJson(`recall-${slug}-${new Date().toISOString().slice(0, 10)}.json`, json);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card data-export">
      <div className="data-export__header">
        <StudioIcon name="export" size={22} />
        <div>
          <p className="studio-section-title" style={{ margin: 0 }}>Export care data</p>
          <p className="studio-text-muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
            Download a JSON backup of events, medications, scores, and journal entries.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="studio-btn studio-btn--primary tap-feedback"
        style={{ width: '100%', marginTop: 12 }}
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        {done ? 'Downloaded ✓' : exporting ? 'Preparing…' : 'Download backup'}
      </button>
    </div>
  );
}
