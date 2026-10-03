import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "Upper & lower case", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A symbol (!@#…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const isPasswordValid = (p: string) => passwordRules.slice(0, 3).every(r => r.test(p));

const levels = [
  { label: "Too weak", cls: "bg-destructive" },
  { label: "Weak", cls: "bg-destructive" },
  { label: "Fair", cls: "bg-amber-500" },
  { label: "Good", cls: "bg-primary" },
  { label: "Strong", cls: "bg-green-600" },
];

const PasswordInput = ({ value, onChange, showStrength = true }: { value: string; onChange: (v: string) => void; showStrength?: boolean }) => {
  const [show, setShow] = useState(false);
  const score = passwordRules.filter(r => r.test(value)).length;
  const lvl = levels[Math.max(0, score - 1)];
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input type={show ? "text" : "password"} placeholder="At least 8 characters" value={value}
          onChange={e => onChange(e.target.value)} required minLength={8} className="pr-10" autoComplete="new-password" />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? lvl.cls : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground">Strength: {lvl.label}</p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {passwordRules.map(r => {
              const ok = r.test(value);
              return (
                <li key={r.label} className={`flex items-center gap-1 text-xs ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
