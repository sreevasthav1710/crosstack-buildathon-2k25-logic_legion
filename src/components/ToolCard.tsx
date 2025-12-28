import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  isActive: boolean;
  index: number;
}

const ToolCard = ({ icon: Icon, title, description, color, onClick, isActive, index }: ToolCardProps) => {
  const colorClasses: Record<string, string> = {
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30 hover:border-purple-500/60",
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30 hover:border-blue-500/60",
    pink: "from-pink-600/20 to-pink-600/5 border-pink-500/30 hover:border-pink-500/60",
    teal: "from-teal-600/20 to-teal-600/5 border-teal-500/30 hover:border-teal-500/60",
    orange: "from-orange-600/20 to-orange-600/5 border-orange-500/30 hover:border-orange-500/60",
    green: "from-green-600/20 to-green-600/5 border-green-500/30 hover:border-green-500/60",
    cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-500/60",
    rose: "from-rose-600/20 to-rose-600/5 border-rose-500/30 hover:border-rose-500/60",
  };

  const iconColorClasses: Record<string, string> = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    pink: "text-pink-400",
    teal: "text-teal-400",
    orange: "text-orange-400",
    green: "text-green-400",
    cyan: "text-cyan-400",
    rose: "text-rose-400",
  };

  const glowClasses: Record<string, string> = {
    purple: "shadow-purple-500/20",
    blue: "shadow-blue-500/20",
    pink: "shadow-pink-500/20",
    teal: "shadow-teal-500/20",
    orange: "shadow-orange-500/20",
    green: "shadow-green-500/20",
    cyan: "shadow-cyan-500/20",
    rose: "shadow-rose-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-gradient-to-br ${colorClasses[color]} ${
        isActive ? `ring-2 ring-offset-2 ring-offset-background ring-${color}-500 shadow-lg ${glowClasses[color]}` : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color].split(" ")[0]} bg-opacity-50`}>
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute top-3 right-3 w-3 h-3 rounded-full bg-${color}-400`}
        />
      )}
    </motion.div>
  );
};

export default ToolCard;
