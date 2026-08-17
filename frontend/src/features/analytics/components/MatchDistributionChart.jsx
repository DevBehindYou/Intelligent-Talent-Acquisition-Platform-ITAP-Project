import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function MatchDistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#c1c7ce" vertical={false} />
        <XAxis dataKey="scoreRange" tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#5b6b7c" }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#b59e54" fill="#f8bc5e" fillOpacity={0.35} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
