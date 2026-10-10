export function StatusBadge({ children }: { children: string }) {
  const slug = children.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`badge badge-${slug}`}>
      <i />
      {children}
    </span>
  );
}
