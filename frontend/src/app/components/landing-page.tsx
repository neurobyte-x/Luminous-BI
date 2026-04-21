import { ArrowRight, BarChart3, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { motion } from 'motion/react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-semibold">Luminous BI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Create Account</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium"
          >
            ✨ AI-Powered Analytics
          </motion.div>
          
          <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Ask Your Data Anything
          </h1>
          <p className="mb-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered dashboards instantly. Transform your data into insights with natural language queries.
          </p>
          <Link to="/signup">
            <Button size="lg" className="group gap-2 text-lg glow-effect">
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful features to transform how you interact with your data
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-effect rounded-lg p-8 transition-all hover:glow-effect"
          >
            <MessageSquare className="mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Conversational Queries</h3>
            <p className="text-muted-foreground">
              Ask questions in plain English. No SQL knowledge required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-lg p-8 transition-all hover:glow-effect"
          >
            <BarChart3 className="mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Instant Dashboards</h3>
            <p className="text-muted-foreground">
              Generate beautiful charts and visualizations automatically.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-effect rounded-lg p-8 transition-all hover:glow-effect"
          >
            <Zap className="mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">AI Insights</h3>
            <p className="text-muted-foreground">
              Discover patterns and trends you might have missed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-effect rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Luminous BI to make data-driven decisions.
          </p>
          <Link to="/signup">
            <Button size="lg" className="glow-effect">
              Start Free Trial
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Luminous BI. Built with precision and care.
        </div>
      </footer>
    </div>
  );
}