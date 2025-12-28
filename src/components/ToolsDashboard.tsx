import { motion } from "framer-motion";
import { 
  Wand2, 
  Target, 
  Search, 
  SpellCheck, 
  List, 
  FileText, 
  Lightbulb, 
  Sparkles 
} from "lucide-react";
import ToolCard from "./ToolCard";

interface ToolsDashboardProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
}

const tools = [
  {
    id: "wording",
    icon: Wand2,
    title: "Resume Wording Improver",
    description: "Rewrite with powerful action verbs",
    color: "purple",
  },
  {
    id: "ats",
    icon: Target,
    title: "ATS Score Analyzer",
    description: "Get your ATS compatibility score",
    color: "blue",
  },
  {
    id: "keywords",
    icon: Search,
    title: "Keyword Optimizer",
    description: "Find and add missing keywords",
    color: "pink",
  },
  {
    id: "grammar",
    icon: SpellCheck,
    title: "Grammar & Clarity Enhancer",
    description: "Polish your writing",
    color: "teal",
  },
  {
    id: "bullets",
    icon: List,
    title: "Bullet Point Strengthener",
    description: "Create impactful bullet points",
    color: "orange",
  },
  {
    id: "summary",
    icon: FileText,
    title: "Resume Summary Generator",
    description: "Craft compelling summaries",
    color: "green",
  },
  {
    id: "skills",
    icon: Lightbulb,
    title: "Skills Recommendation",
    description: "Discover skills to add",
    color: "cyan",
  },
  {
    id: "matching",
    icon: Sparkles,
    title: "Job Role Matching",
    description: "See how well you match",
    color: "rose",
  },
];

const ToolsDashboard = ({ selectedTool, setSelectedTool }: ToolsDashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600/20 to-teal-600/20">
          <Sparkles className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Tools</h2>
          <p className="text-sm text-muted-foreground">Select a tool to enhance your resume</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            icon={tool.icon}
            title={tool.title}
            description={tool.description}
            color={tool.color}
            onClick={() => setSelectedTool(tool.id)}
            isActive={selectedTool === tool.id}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ToolsDashboard;
