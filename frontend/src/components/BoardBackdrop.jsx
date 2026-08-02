import "../pages/BoardPage.css";
import "./BoardBackdrop.css";

const TOTAL = 1008;
const COLUMNS = 42;

// Deterministic pseudo-random fill so the backdrop looks lived-in without
// depending on live (authenticated) board data.
function seededPattern(total) {
  const arr = new Array(total).fill(false);
  let seed = 42;
  for (let i = 0; i < total; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    arr[i] = seed / 233280 < 0.22;
  }
  return arr;
}

const PATTERN = seededPattern(TOTAL);
const MARKED = PATTERN.filter(Boolean).length;
const PCT = ((MARKED / TOTAL) * 100).toFixed(1);

export function BoardBackdrop() {
  return (
    <div className="board-backdrop" aria-hidden="true">
      <div className="board">
        <div className="board-grid-bg" />

        <header className="board-header">
          <div className="board-header-left">
            <span className="brand-mark" />
            <span className="board-brand-name">Checkboxes</span>
          </div>
        </header>

        <section className="board-hero">
          <div className="board-hero-copy">
            <h1>Checkboxes</h1>
            <p>One thousand and eight boxes, kept in common. Every mark is seen at once, by everyone present.</p>
          </div>
          <div className="board-hero-stats">
            <div className="board-hero-figure">
              <span className="board-hero-marked">{MARKED}</span>
              <span className="board-hero-total">/ {TOTAL.toLocaleString()}</span>
            </div>
            <div className="board-hero-bar">
              <div className="board-hero-fill" style={{ width: `${PCT}%` }} />
            </div>
            <span className="board-hero-pct">{PCT}% marked</span>
          </div>
        </section>

        <section className="board-panel-wrap">
          <div className="board-panel">
            <div className="board-cells" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 16px)` }}>
              {PATTERN.map((checked, idx) => (
                <div key={idx} className={`board-cell ${checked ? "board-cell-on" : ""}`} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
