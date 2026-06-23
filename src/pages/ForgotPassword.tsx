import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Send, CheckCircle2, RefreshCw, MessageCircle, KeyRound, ClipboardPaste, Eye, EyeOff } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/PhoneInput";

type Step = "request" | "verify" | "done";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("request");
  const [method, setMethod] = useState<"email" | "whatsapp">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const startResendTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", description: "Enter your account email.", variant: "destructive" });
      return;
    }
    if (method === "whatsapp" && !phone) {
      toast({ title: "Phone required", description: "Enter the WhatsApp number on your account.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password-otp", {
        body: { action: "send", email: email.trim(), method, phone },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Failed");
      toast({ title: "Code sent", description: method === "whatsapp" ? `WhatsApp code sent to ${phone}` : `Check inbox at ${email}` });
      setStep("verify");
      startResendTimer();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndReset = async () => {
    if (otp.length !== 6) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast({ title: "Weak password", description: "Use 8+ characters with letters and numbers.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password-otp", {
        body: { action: "verify", email: email.trim(), otp_code: otp, new_password: newPassword },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Failed");
      setStep("done");
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pasteOtp = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (digits.length === 6) {
        setOtp(digits);
        toast({ title: "Pasted", description: "Code pasted from clipboard." });
      } else {
        toast({ title: "No 6-digit code", description: "Clipboard doesn't contain a valid code.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Clipboard blocked", description: "Allow clipboard access or paste manually.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card shadow-lg border-2 border-primary/20 mb-4">
            <img src={schoolLogo} alt="St. Mary's High School" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">St. Mary's High School</h1>
          <p className="text-xs text-muted-foreground italic mt-1">Excellence & Integrity</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-8">
            {step === "done" ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h2>
                  <p className="text-muted-foreground text-sm">Redirecting you to login…</p>
                </div>
              </div>
            ) : step === "verify" ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Enter Code</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sent via {method === "whatsapp" ? "WhatsApp" : "email"} to{" "}
                    <span className="font-semibold text-foreground">{method === "whatsapp" ? phone : email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">6-Digit Code</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14 flex-1"
                      autoFocus
                    />
                    {otp.length === 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-14 w-14"
                        title="Copy code"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(otp);
                            toast({ title: "Copied!", description: "Code copied to clipboard." });
                          } catch {
                            toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
                          }
                        }}
                      >
                        <ClipboardPaste className="h-5 w-5" />
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="icon" className="h-14 w-14" onClick={pasteOtp} title="Paste from clipboard">
                      <ClipboardPaste className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, letters + numbers"
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button onClick={verifyAndReset} disabled={loading} className="w-full h-12 gap-2">
                  {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Resetting…</> : <>Reset Password</>}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sendCode}
                    disabled={resendTimer > 0 || loading}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </Button>
                </div>

                <button
                  onClick={() => { setStep("request"); setOtp(""); setNewPassword(""); }}
                  className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
                >
                  ← Use a different account
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
                  <p className="text-muted-foreground text-sm">Choose where to receive your reset code.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${method === "email" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("whatsapp")}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${method === "whatsapp" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  {method === "whatsapp" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">WhatsApp Number</label>
                      <PhoneInput value={phone} onChange={setPhone} />
                      <p className="text-xs text-muted-foreground">Must match the number on your account.</p>
                    </div>
                  )}
                </div>

                <Button onClick={sendCode} disabled={loading} className="w-full h-12 gap-2 text-base font-semibold">
                  {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send Code</>}
                </Button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} St. Mary's High School. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
