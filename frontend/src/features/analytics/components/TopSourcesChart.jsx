import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TopSourcesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#c1c7ce" vertical={false} />
        <XAxis dataKey="source" tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="yield" fill="#3e7ca6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
