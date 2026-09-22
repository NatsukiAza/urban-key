'use client';

interface Props {
    value: number;
    options: number[];
    onChange: (size: number) => void;
    suffix?: string;
    label?: string;
}

const PageSizeSelect = ({ value, options, onChange, suffix = '/ pág.', label = 'Registros por página' }: Props) => (
    <select className="form-select w-auto" value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} title={label}>
        {options.map((n) => (
            <option key={n} value={n}>
                {`${n} ${suffix}`}
            </option>
        ))}
    </select>
);

export default PageSizeSelect;
