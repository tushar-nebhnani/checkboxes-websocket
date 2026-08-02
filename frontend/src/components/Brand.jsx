import "./Brand.css";

export function Brand({ size = "md" }) {
  return (
    <div className={`brand brand-${size}`}>
      <span className="brand-mark" />
      <span className="brand-name">Checkboxes</span>
    </div>
  );
}
