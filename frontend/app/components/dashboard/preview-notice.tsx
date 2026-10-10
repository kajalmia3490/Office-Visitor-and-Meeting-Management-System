export function PreviewNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="preview-notice">
      Preview data is shown while the API is unavailable or you are not signed in
      with a backend session. Connect Better Auth to load live data.
    </div>
  );
}
