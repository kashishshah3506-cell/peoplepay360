const SimpleBarChart = ({ data, labelKey, valueKey, color = 'bg-slate-800' }) => {
  const safeData = Array.isArray(data) ? data : [];
  const max = Math.max(...safeData.map((d) => parseFloat(d[valueKey]) || 0), 1);

  if (safeData.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-3">
      {safeData.map((d, i) => {
        const value = parseFloat(d[valueKey]) || 0;
        const widthPct = (value / max) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>{d[labelKey]}</span>
              <span className="font-medium">₹{value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded h-2.5">
              <div className={`${color} h-2.5 rounded`} style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SimpleBarChart;