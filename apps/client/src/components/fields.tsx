interface ChoiceOption {
  value: string;
  label: string;
}

export function ChoiceField({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: ChoiceOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="field">
      <label>
        {label} {hint ? <span className="hint">— {hint}</span> : null}
      </label>
      <div className="choice-grid">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`choice${value === opt.value ? " selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="field">
      <label>
        {label} {hint ? <span className="hint">— {hint}</span> : null}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? "any"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="slider-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="slider-value">{format ? format(value) : value}</span>
      </div>
    </div>
  );
}

export function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="field">
      <div className="toggle-row">
        <label style={{ marginBottom: 0 }}>{label}</label>
        <div className="choice-grid" style={{ minWidth: 140 }}>
          <button
            type="button"
            className={`choice${value ? " selected" : ""}`}
            onClick={() => onChange(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`choice${!value ? " selected" : ""}`}
            onClick={() => onChange(false)}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>
        {label} {hint ? <span className="hint">— {hint}</span> : null}
      </label>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`step-dot${i <= step ? " done" : ""}`} />
      ))}
    </div>
  );
}
