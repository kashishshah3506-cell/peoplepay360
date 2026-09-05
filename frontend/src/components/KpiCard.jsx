const KpiCard = ({ label, value, subtext, accent }) => (
  <div className="bg-white rounded-lg shadow p-5">
    <div className="text-sm text-slate-500">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${accent || 'text-slate-800'}`}>{value}</div>
    {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
  </div>
);

export default KpiCard;