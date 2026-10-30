// Permanent series code of a toolbox talk / inspection / NC / CC record, e.g. ABC/INS/001.
export default function SeriesCode({ code, className = '' }) {
    if (!code) return null;
    return <span className={`font-mono text-[11px] font-bold tracking-wide text-brand-800 ${className}`}>{code}</span>;
}
