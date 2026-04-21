import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartComponentProps {
  data: any[];
  xKey: string;
  lines: { key: string; color: string; name: string }[];
}

export function LineChartComponent({ data, xKey, lines }: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis 
          key="xAxis"
          dataKey={xKey} 
          stroke="currentColor"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          key="yAxis"
          stroke="currentColor"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          key="tooltip"
          contentStyle={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
          }}
        />
        <Legend key="legend" />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            name={line.name}
            dot={{ fill: line.color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}