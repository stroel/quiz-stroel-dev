import Icon from '@/components/Icon';

/**
 * One option in a panel: a full-width row with a check box at the right, or a
 * radio dot when the options exclude each other.
 */
export default function CheckRow({
  on,
  label,
  detail,
  count,
  radio = false,
  onClick,
}: {
  on: boolean;
  label: string;
  /** A second, smaller line under the label. */
  detail?: string;
  count?: number;
  radio?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role={radio ? 'radio' : 'checkbox'}
        aria-checked={on}
        onClick={onClick}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
      >
        <span className="flex flex-1 flex-col">
          <span className="font-medium">{label}</span>
          {detail && <span className="text-sm text-slate-500">{detail}</span>}
        </span>
        {count !== undefined && (
          <span className="text-sm text-slate-400 tabular-nums">{count}</span>
        )}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
            radio ? 'rounded-full' : 'rounded-md'
          } ${on ? 'border-accent-700 bg-accent-700 text-white' : 'border-slate-300 bg-white'}`}
        >
          {on &&
            (radio ? (
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            ) : (
              <Icon name="check" className="h-4 w-4" />
            ))}
        </span>
      </button>
    </li>
  );
}
