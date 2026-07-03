import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    // Penalize common patterns
    if (/^(123|abc|qwe|password)/i.test(password)) score = Math.max(0, score - 2);
    
    // Normalize to 0-4 scale
    const normalizedScore = Math.min(4, Math.floor(score / 1.5));
    
    const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = [
      "bg-destructive",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-emerald-500",
      "bg-green-600"
    ];
    
    return {
      score: normalizedScore,
      label: labels[normalizedScore] || "",
      color: colors[normalizedScore] || ""
    };
  }, [password]);
  
  if (!password) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "flex-1 transition-all duration-300",
                index <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      <p className={cn("text-xs font-medium", strength.score >= 3 ? "text-emerald-600" : "text-muted-foreground")}>
        Password strength: {strength.label}
      </p>
      {strength.score < 3 && password.length >= 4 && (
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          {password.length < 12 && <p>• Use at least 12 characters</p>}
          {!/[A-Z]/.test(password) && <p>• Include uppercase letters</p>}
          {!/[a-z]/.test(password) && <p>• Include lowercase letters</p>}
          {!/[0-9]/.test(password) && <p>• Include numbers</p>}
          {!/[^a-zA-Z0-9]/.test(password) && <p>• Include special characters (!@#$%)</p>}
        </div>
      )}
    </div>
  );
}
