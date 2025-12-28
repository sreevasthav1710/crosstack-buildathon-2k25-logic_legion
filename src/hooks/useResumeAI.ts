import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseResumeAIProps {
  resumeText: string;
  jobRole: string;
  experienceLevel: string;
  industry: string;
  selectedTool: string;
}

export const useResumeAI = () => {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const improveResume = useCallback(
    async ({ resumeText, jobRole, experienceLevel, industry, selectedTool }: UseResumeAIProps) => {
      if (!resumeText.trim()) {
        toast({
          title: "No resume content",
          description: "Please paste or upload your resume first.",
          variant: "destructive",
        });
        return;
      }

      if (!selectedTool) {
        toast({
          title: "No tool selected",
          description: "Please select an AI tool to use.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setOutput("");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/improve-resume`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              resume: resumeText,
              jobRole: jobRole || "General",
              experienceLevel: experienceLevel || "professional",
              industry: industry || "Technology",
              tool: selectedTool,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            toast({
              title: "Rate limit exceeded",
              description: "Please wait a moment and try again.",
              variant: "destructive",
            });
            return;
          }
          
          if (response.status === 402) {
            toast({
              title: "Credits exhausted",
              description: "AI credits have been used up. Please add more credits to continue.",
              variant: "destructive",
            });
            return;
          }

          // Handle validation errors (corrupted PDF text)
          if (response.status === 400 && errorData.validationError) {
            setOutput(
              "PDF extraction failed\n\nResume text could not be extracted correctly from the uploaded PDF.\n\nPlease upload a different PDF, a DOCX file, or paste the resume text manually."
            );
            toast({
              title: "PDF could not be read",
              description: "Please paste the resume text manually or try a different file.",
              variant: "destructive",
            });
            return;
          }

          throw new Error(errorData.error || "Failed to process resume");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullOutput = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullOutput += content;
                setOutput(fullOutput);
              }
            } catch {
              // Incomplete JSON, put it back
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Handle any remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullOutput += content;
                setOutput(fullOutput);
              }
            } catch {
              // Ignore
            }
          }
        }

        toast({
          title: "Analysis complete!",
          description: "Your resume has been enhanced by AI.",
        });
      } catch (error) {
        console.error("Error improving resume:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process resume",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    output,
    isLoading,
    improveResume,
    setOutput,
  };
};
