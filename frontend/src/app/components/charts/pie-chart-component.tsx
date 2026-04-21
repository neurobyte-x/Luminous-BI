import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartComponentProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors: string[];
}

export function PieChartComponent({ data, nameKey, valueKey, colors }: PieChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          key="pie"
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  );
}