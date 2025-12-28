import { motion } from "framer-motion";
import { Sparkles, FileText, Wand2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStartClick: () => void;
}

const HeroSection = ({ onStartClick }: HeroSectionProps) => {
  const floatingIcons = [
    { Icon: FileText, delay: 0, x: -120, y: -80 },
    { Icon: Wand2, delay: 0.2, x: 140, y: -60 },
    { Icon: Target, delay: 0.4, x: -100, y: 60 },
    { Icon: Sparkles, delay: 0.6, x: 120, y: 80 },
  ];

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-pink-600/20 via-transparent to-teal-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.6, 
              scale: 1,
              y: [y, y - 10, y],
            }}
            transition={{ 
              delay,
              duration: 0.5,
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          >
            <div className="p-4 glass-card">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass-card mb-6"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">AI-Powered Resume Enhancement</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="gradient-text">AI Resume</span>
            <br />
            <span className="text-foreground">Improver Pro</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your resume with AI-powered tools. Get higher ATS scores, 
            better wording, and land your dream job.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={onStartClick}
              className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 glow-purple transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Improving
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300"
            >
              See How It Works
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8"
        >
          {[
            { value: "8+", label: "AI Tools" },
            { value: "95%", label: "ATS Score Boost" },
            { value: "10k+", label: "Resumes Enhanced" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
