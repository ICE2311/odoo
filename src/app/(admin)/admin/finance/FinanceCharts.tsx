'use client'

export function FinanceCharts({ inByCategory, outByCategory, monthlyTrend }: { 
  inByCategory: {category: string, total: number}[],
  outByCategory: {category: string, total: number}[],
  monthlyTrend: {month: string, in: number, out: number}[]
}) {
  const maxIn = Math.max(...inByCategory.map(i => i.total), 1);
  const maxOut = Math.max(...outByCategory.map(o => o.total), 1);
  const maxTrend = Math.max(...monthlyTrend.map(m => Math.max(m.in, m.out)), 1);

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">Money In (by source)</h3>
          <div className="space-y-2">
            {inByCategory.map(c => (
              <div key={c.category}>
                <div className="flex justify-between text-sm">
                  <span>{c.category}</span>
                  <span>₹{(c.total / 100).toFixed(2)}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(c.total / maxIn) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {inByCategory.length === 0 && <div className="text-sm text-gray-500">No income</div>}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Money Out (by type)</h3>
          <div className="space-y-2">
            {outByCategory.map(c => (
              <div key={c.category}>
                <div className="flex justify-between text-sm">
                  <span>{c.category}</span>
                  <span>₹{(c.total / 100).toFixed(2)}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(c.total / maxOut) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {outByCategory.length === 0 && <div className="text-sm text-gray-500">No expenses</div>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Monthly Trend</h3>
        <div className="flex items-end space-x-2 h-40 border-b border-l border-gray-300 p-2 overflow-x-auto">
          {monthlyTrend.map(m => (
            <div key={m.month} className="flex flex-col items-center justify-end h-full w-12 flex-shrink-0 group relative">
              <div className="flex items-end w-full h-full justify-center space-x-1">
                <div className="w-4 bg-green-500" style={{ height: `${(m.in / maxTrend) * 100}%` }}></div>
                <div className="w-4 bg-red-500" style={{ height: `${(m.out / maxTrend) * 100}%` }}></div>
              </div>
              <span className="text-xs mt-1 transform -rotate-45 origin-top-left translate-y-2">{m.month}</span>
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                In: ₹{(m.in / 100).toFixed(2)} | Out: ₹{(m.out / 100).toFixed(2)}
              </div>
            </div>
          ))}
          {monthlyTrend.length === 0 && <div className="text-sm text-gray-500">No data</div>}
        </div>
      </div>
    </div>
  );
}
