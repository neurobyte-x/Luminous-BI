import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';

const steps = [
  { label: 'Analyzing Query', duration: 1000 },
  { label: 'Processing Data', duration: 1500 },
  { label: 'Generating Charts', duration: 1200 },
  { label: 'Creating Insights', duration: 800 },
];

interface LoadingStateProps {
  onComplete?: () => void;
}

export function LoadingState({ onComplete }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let totalDuration = 0;
    const stepDurations = steps.map((step) => {
      const start = totalDuration;
      totalDuration += step.duration;
      return { ...step, start, end: totalDuration };
    });

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 2, 100);
        
        // Update current step based on progress
        const elapsed = (newProgress / 100) * totalDuration;
        const step = stepDurations.findIndex((s) => elapsed >= s.start && elapsed < s.end);
        if (step !== -1 && step !== currentStep) {
          setCurrentStep(step);
        }

        if (newProgress === 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 300);
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStep, onComplete]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{steps[currentStep].label}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary/20 text-primary animate-pulse'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
