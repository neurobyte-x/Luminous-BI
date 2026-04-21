# Luminous BI - Conversational Business Intelligence

A modern, production-ready SaaS frontend for conversational business intelligence. Ask your data questions in natural language and get instant insights, charts, and dashboards.

## Features

### 🎨 Design System
- **Pure black/white theme** with elegant white glow effects
- **Dark/Light mode** with persistent theme switching
- **Typography**: Outfit for headings, Inter for body text
- **Glassmorphism effects** for modern UI feel
- Inspired by Notion, Linear, and Stripe

### 🔍 Core Features

#### Query Explorer
- Natural language query input
- Example query chips for quick start
- Multi-stage loading animation with progress tracking
- Tabbed results view:
  - 📊 **Charts**: Line, Bar, and Pie charts with vibrant colors
  - 📋 **Data Table**: Scrollable, sortable data views
  - 💡 **Insights**: AI-generated insights with confidence scores
  - 🧾 **SQL**: Generated SQL queries with copy functionality

#### Dashboard
- Overview statistics with trend indicators
- Multiple chart visualizations
- Real-time data presentation

#### Upload Data
- Drag & drop CSV upload
- File preview before import
- Success state handling

#### Saved Dashboards
- Grid layout of saved analyses
- Quick access to previous work
- Delete and view actions

#### Comparison Mode
- Side-by-side query comparison
- Split-screen results
- Shared filtering capabilities

#### History
- Chronological query history
- Quick result reload
- Query type indicators

#### Settings
- Theme customization
- API configuration status
- User preferences

### 📊 Advanced Chart Features
- **Vibrant color palette**: Blue, Purple, Green, Orange, Red
- **Smooth animations**: Chart load and interaction animations
- **Interactive tooltips**: Detailed data on hover
- **Responsive legends**: Clickable category filters
- **Smart coloring**: Context-aware color assignment

### 🎯 User Experience
- **Feedback system**: Star rating with comments
- **Toast notifications**: Success/error messaging
- **Loading skeletons**: Smooth loading states
- **Responsive design**: Mobile and desktop optimized
- **Smooth transitions**: Motion-powered animations

## Technology Stack

- **React** with TypeScript
- **React Router** for navigation
- **Recharts** for data visualization
- **Motion** (Framer Motion) for animations
- **Tailwind CSS v4** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Sonner** for toast notifications

## Project Structure

```
/src
  /app
    /components         # Reusable UI components
      /charts          # Chart components
      /ui              # Base UI components
      app-layout.tsx   # Main app layout
      app-navbar.tsx   # Top navigation
      app-sidebar.tsx  # Side navigation
      theme-toggle.tsx # Theme switcher
    /contexts          # React contexts
      theme-context.tsx
    /data              # Mock data
      mock-data.ts
    /pages             # Route pages
      dashboard-page.tsx
      query-explorer-page.tsx
      upload-page.tsx
      saved-dashboards-page.tsx
      comparison-page.tsx
      history-page.tsx
      settings-page.tsx
    routes.tsx         # Route configuration
    App.tsx            # Root component
  /styles              # Global styles
    fonts.css
    theme.css
    index.css
```

## API Integration Ready

The frontend is prepared to integrate with the following endpoints:

- `POST /upload` - Upload datasets
- `POST /analyze` - Analyze queries
- `GET /history` - Fetch query history
- `POST /dashboard` - Save dashboards
- `GET /dashboard` - Retrieve dashboards
- `POST /feedback` - Submit user feedback

Currently using mock data for demonstration purposes.

## Color System

### Light Mode
- Background: Pure white (#ffffff)
- Foreground: Black (#000000)
- Charts: Vibrant professional colors

### Dark Mode
- Background: Pure black (#000000)
- Foreground: White (#ffffff)
- Charts: Slightly muted vibrant colors

### Chart Colors
- Blue: #3B82F6 / #60A5FA
- Purple: #8B5CF6 / #A78BFA
- Green: #10B981 / #34D399
- Orange: #F59E0B / #FBBF24
- Red: #EF4444 / #F87171

## Development

The application is built with modern web development best practices:

- Component-based architecture
- Type-safe with TypeScript
- Responsive and accessible
- Performance optimized
- Production-ready code

## License

Built with precision and care for Luminous BI.
