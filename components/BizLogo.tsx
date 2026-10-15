import '../app/logo.css';
// Shows a business's logo when it has one, otherwise a tidy initial. `v` is the logo's updated_at (null when there is no logo).
export default function BizLogo({ id, v, name, size = 56 }: { id: string; v?: string | null; name: string; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (!v) return <span className="biz-logo initial" style={style} aria-hidden="true">{(name.trim()[0] || '?').toUpperCase()}</span>;
  return <span className="biz-logo" style={style}><img src={'/api/logo/' + id + '?v=' + encodeURIComponent(v)} alt={name + ' logo'} width={size} height={size} loading="lazy"/></span>;
}
