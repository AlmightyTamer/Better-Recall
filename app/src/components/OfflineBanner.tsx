import StudioIcon from './StudioIcon';

export default function OfflineBanner() {
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <StudioIcon name="warning" size={18} />
      <span>You're offline — local features still work. AI features need internet.</span>
    </div>
  );
}
