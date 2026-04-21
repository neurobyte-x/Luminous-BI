// Mock data for demonstration

export const mockChartData = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
  { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 },
];

export const mockSalesData = [
  { category: 'Electronics', value: 35, sales: 125000 },
  { category: 'Clothing', value: 25, sales: 89000 },
  { category: 'Food', value: 20, sales: 71000 },
  { category: 'Books', value: 12, sales: 43000 },
  { category: 'Other', value: 8, sales: 29000 },
];

export const mockGrowthData = [
  { quarter: 'Q1 2025', customers: 1200, growth: 15 },
  { quarter: 'Q2 2025', customers: 1580, growth: 31.7 },
  { quarter: 'Q3 2025', customers: 2100, growth: 32.9 },
  { quarter: 'Q4 2025', customers: 2650, growth: 26.2 },
  { quarter: 'Q1 2026', customers: 3200, growth: 20.8 },
];

export const mockTableData = [
  { id: 1, product: 'Laptop Pro', category: 'Electronics', sales: 245, revenue: 294000, status: 'Active' },
  { id: 2, product: 'Smart Watch', category: 'Electronics', sales: 412, revenue: 123600, status: 'Active' },
  { id: 3, product: 'Wireless Headphones', category: 'Electronics', sales: 356, revenue: 89000, status: 'Active' },
  { id: 4, product: 'Office Chair', category: 'Furniture', sales: 189, revenue: 56700, status: 'Active' },
  { id: 5, product: 'Standing Desk', category: 'Furniture', sales: 145, revenue: 87000, status: 'Low Stock' },
  { id: 6, product: 'Monitor 4K', category: 'Electronics', sales: 278, revenue: 139000, status: 'Active' },
];

export const mockInsights = [
  {
    icon: '📈',
    title: 'Revenue Growth',
    description: 'Revenue increased by 32% compared to last quarter, driven by strong performance in Electronics.',
    confidence: 94,
    type: 'positive' as const,
  },
  {
    icon: '💡',
    title: 'Category Performance',
    description: 'Electronics category shows the highest profit margin at 38%, suggesting optimization opportunities.',
    confidence: 89,
    type: 'insight' as const,
  },
  {
    icon: '⚠️',
    title: 'Inventory Alert',
    description: 'Standing Desk inventory is running low. Consider restocking to maintain sales momentum.',
    confidence: 91,
    type: 'warning' as const,
  },
  {
    icon: '📉',
    title: 'Seasonal Trend',
    description: 'Q1 typically shows 15-20% lower sales. Plan promotional campaigns accordingly.',
    confidence: 87,
    type: 'neutral' as const,
  },
];

export const mockSQL = `SELECT 
  p.category,
  SUM(s.quantity) as total_sales,
  SUM(s.revenue) as total_revenue,
  AVG(s.revenue / s.quantity) as avg_price
FROM sales s
JOIN products p ON s.product_id = p.id
WHERE s.date >= '2026-01-01'
  AND s.date <= '2026-04-16'
GROUP BY p.category
ORDER BY total_revenue DESC;`;

export const mockHistory = [
  { id: '1', query: 'Show me revenue trends for Q1 2026', timestamp: '2026-04-16T10:30:00', type: 'chart' },
  { id: '2', query: 'Which products have low inventory?', timestamp: '2026-04-16T09:15:00', type: 'table' },
  { id: '3', query: 'Compare sales by category', timestamp: '2026-04-15T16:45:00', type: 'chart' },
  { id: '4', query: 'What are the top performing products?', timestamp: '2026-04-15T14:20:00', type: 'insight' },
  { id: '5', query: 'Show customer growth over time', timestamp: '2026-04-14T11:00:00', type: 'chart' },
];

export const mockDashboards = [
  {
    id: '1',
    title: 'Q1 Revenue Analysis',
    description: 'Quarterly revenue breakdown by category',
    createdAt: '2026-04-10',
    thumbnail: 'chart',
  },
  {
    id: '2',
    title: 'Sales Performance',
    description: 'Top products and sales trends',
    createdAt: '2026-04-08',
    thumbnail: 'chart',
  },
  {
    id: '3',
    title: 'Customer Growth',
    description: 'Customer acquisition and retention metrics',
    createdAt: '2026-04-05',
    thumbnail: 'chart',
  },
];

export const exampleQueries = [
  'Show me revenue trends for the last 6 months',
  'Which products are selling the most?',
  'Compare Q1 vs Q4 performance',
  'What categories have the highest profit margin?',
];
