import { useMemo } from "react";
import zxcvbn from "zxcvbn";

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  isStrong: boolean; // score >= 3
  feedback?: {
    warning?: string;
    suggestions?: string[];
  };
};

export function usePasswordStrength(password: string): PasswordStrength {
  const result = useMemo(() => (password ? zxcvbn(password) : null), [password]);
  const score = (result?.score ?? 0) as 0 | 1 | 2 | 3 | 4;
  return {
    score,
    isStrong: password.length > 0 ? score >= 3 : false,
    feedback: result?.feedback,
  };
}
