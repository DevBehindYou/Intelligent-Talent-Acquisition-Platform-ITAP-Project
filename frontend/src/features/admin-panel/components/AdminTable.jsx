// Minimal, horizontally-scrollable table for the admin management lists.
export default function AdminTable({ columns, rows, keyField = "id", empty = "No results." }) {
  if (!rows || rows.length === 0) {
    return <p className="text-body-sm text-on-surface-variant py-2xl text-center">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-paper">
      <table className="w-full text-body-sm">
        <thead className="hairline-b">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-md py-sm whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="hairline-b last:border-0 hover:bg-surface-container-low">
              {columns.map((c) => (
                <td key={c.key} className="px-md py-sm text-on-surface align-middle">
                  {c.render ? c.render(row) : (row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
