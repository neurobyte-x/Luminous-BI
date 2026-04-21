import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartComponentProps {
  data: any[];
  xKey: string;
  bars: { key: string; color: string; name: string }[];
}

export function BarChartComponent({ data, xKey, bars }: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.name}
            radius={[8, 8, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}