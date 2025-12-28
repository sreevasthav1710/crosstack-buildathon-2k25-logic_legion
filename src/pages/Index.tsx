import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import ResumeInputPanel from "@/components/ResumeInputPanel";
import ToolsDashboard from "@/components/ToolsDashboard";
import OutputSection from "@/components/OutputSection";
import { Button } from "@/components/ui/button";
import { useResumeAI } from "@/hooks/useResumeAI";

const Index = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("professional");
  const [industry, setIndustry] = useState("");
  const [selectedTool, setSelectedTool] = useState("");
  const toolsRef = useRef<HTMLDivElement>(null);

  const { output, isLoading, improveResume } = useResumeAI();

  const handleStartClick = () => {
    toolsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunAnalysis = () => {
    improveResume({
      resumeText,
      jobRole,
      experienceLevel,
      industry,
      selectedTool,
    });
  };

  const toolNames: Record<string, string> = {
    wording: "Resume Wording Improver",
    ats: "ATS Score Analyzer",
    keywords: "Keyword Optimizer",
    grammar: "Grammar & Clarity Enhancer",
    bullets: "Bullet Point Strengthener",
    summary: "Resume Summary Generator",
    skills: "Skills Recommendation",
    matching: "Job Role Matching",
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fixed background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-pink-600/10 via-transparent to-teal-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <nav className="glass-card px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">AI Resume Pro</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">Features</Button>
                <Button variant="ghost" size="sm">Pricing</Button>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <HeroSection onStartClick={handleStartClick} />

        {/* Main App Section */}
        <section ref={toolsRef} className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">Powerful AI Tools</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose from 8 specialized AI tools to transform your resume into a job-winning document
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Input + Tools */}
              <div className="space-y-8">
                <ResumeInputPanel
                  resumeText={resumeText}
                  setResumeText={setResumeText}
                  jobRole={jobRole}
                  setJobRole={setJobRole}
                  experienceLevel={experienceLevel}
                  setExperienceLevel={setExperienceLevel}
                  industry={industry}
                  setIndustry={setIndustry}
                />
                <ToolsDashboard
                  selectedTool={selectedTool}
                  setSelectedTool={setSelectedTool}
                />
              </div>

              {/* Right Column - Output */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <OutputSection
                  output={output}
                  isLoading={isLoading}
                  originalResume={resumeText}
                />
              </div>
            </div>

            {/* Run Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <Button
                size="lg"
                onClick={handleRunAnalysis}
                disabled={isLoading || !resumeText || !selectedTool}
                className="text-lg px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 glow-purple transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run {selectedTool ? toolNames[selectedTool] : "Analysis"}
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="gradient-text">AI Resume Pro</span>?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "ATS Optimized",
                  description: "Our AI ensures your resume passes through Applicant Tracking Systems with flying colors.",
                  color: "from-purple-600/20 to-purple-600/5",
                },
                {
                  title: "Industry Tailored",
                  description: "Get recommendations specific to your target industry and role for maximum impact.",
                  color: "from-blue-600/20 to-blue-600/5",
                },
                {
                  title: "Instant Results",
                  description: "See your enhanced resume in seconds with real-time AI streaming.",
                  color: "from-pink-600/20 to-pink-600/5",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card p-8 bg-gradient-to-br ${feature.color}`}
                >
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-border/30">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">AI Resume Improver Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform your career with AI-powered resume enhancement
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
