import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Briefcase, GraduationCap, Building2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ResumeInputPanelProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobRole: string;
  setJobRole: (role: string) => void;
  experienceLevel: string;
  setExperienceLevel: (level: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
}

const jobRoles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Project Manager",
  "Business Analyst",
  "DevOps Engineer",
  "Full Stack Developer",
  "Other",
];

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Media & Entertainment",
  "Real Estate",
  "Other",
];

const experienceLevels = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "fresher", label: "Fresher", icon: FileText },
  { value: "professional", label: "Professional", icon: Briefcase },
];

const ResumeInputPanel = ({
  resumeText,
  setResumeText,
  jobRole,
  setJobRole,
  experienceLevel,
  setExperienceLevel,
  industry,
  setIndustry,
}: ResumeInputPanelProps) => {
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Handle text files directly
    if (file.type === "text/plain") {
      const text = await file.text();
      setResumeText(text);
      setUploadedFileName(file.name);
      toast({
        title: "File uploaded!",
        description: `${file.name} has been loaded successfully.`,
      });
      return;
    }

    // Handle PDF and DOCX files via edge function
    if (file.type === "application/pdf" || 
        file.name.toLowerCase().endsWith('.pdf') ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith('.docx')) {
      setIsParsingPdf(true);
      setUploadedFileName(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to parse document');
        }

        setResumeText(data.text);
        setUploadedFileName(file.name);
        toast({
          title: "Document parsed successfully!",
          description: `Extracted ${data.charCount} characters from ${file.name}`,
        });
      } catch (error) {
        console.error('Error parsing document:', error);
        toast({
          title: "Document parsing failed",
          description: error instanceof Error ? error.message : "Please try copying and pasting your resume text instead.",
          variant: "destructive",
        });
      } finally {
        setIsParsingPdf(false);
      }
      return;
    }

    toast({
      title: "Unsupported file type",
      description: "Please upload a PDF, DOCX, or TXT file.",
      variant: "destructive",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Resume Input</h2>
          <p className="text-sm text-muted-foreground">Paste or upload your resume</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Resume Text Area */}
        <div className="space-y-2">
          <Label htmlFor="resume">Resume Content</Label>
          <Textarea
            id="resume"
            placeholder="Paste your resume content here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="min-h-[200px] bg-muted/50 border-border/50 focus:border-primary resize-none"
          />
        </div>

        {/* File Upload */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isParsingPdf}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              className="flex items-center gap-2"
              disabled={isParsingPdf}
            >
              {isParsingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">Supports PDF, DOCX & TXT</span>
          </div>
          
          {uploadedFileName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400">{uploadedFileName} loaded</span>
            </div>
          )}
        </div>

        {/* Job Role Select */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Target Job Role
          </Label>
          <Select value={jobRole} onValueChange={setJobRole}>
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue placeholder="Select job role" />
            </SelectTrigger>
            <SelectContent>
              {jobRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label>Experience Level</Label>
          <div className="grid grid-cols-3 gap-3">
            {experienceLevels.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setExperienceLevel(value)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  experienceLevel === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Industry Select */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Industry
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeInputPanel;
