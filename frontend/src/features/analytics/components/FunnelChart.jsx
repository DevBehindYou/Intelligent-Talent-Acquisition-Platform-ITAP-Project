import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function FunnelChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#c1c7ce" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} width={100} />
        <Tooltip />
        <Bar dataKey="count" fill="#1d4e6b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
