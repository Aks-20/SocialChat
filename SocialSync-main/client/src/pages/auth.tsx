import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const otpSchema = z.string().length(6, "OTP must be 6 digits");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
    "Username can contain letters, numbers, dots, and underscores. Cannot start/end with dots or have consecutive dots"
  )
  .refine(
    (val) => !val.includes(".."),
    "Username cannot have consecutive dots"
  );

type AuthStep = "email" | "otp" | "signup";

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null
  );

  const { sendOTP, login } = useAuth();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(email);
      setStep("otp");
      toast({
        title: "OTP sent!",
        description: "Check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      otpSchema.parse(otp);
    } catch (error) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await login(email, otp);

      if (data.needsDetails) {
        // New user needs to provide details
        setNeedsSignup(true);
        setStep("signup");
        setVerificationToken(data.verificationToken);
        toast({
          title: "Welcome!",
          description: "Please complete your profile to continue",
        });
      } else if (data.isNewUser === false) {
        // Returning user - logged in successfully
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        // Redirect to home page (main dashboard)
        window.location.href = "/";
      } else if (data.user) {
        // New user with details provided - logged in successfully
        toast({
          title: "Welcome!",
          description: "Account created successfully",
        });
        // Redirect to home page (main dashboard)
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(name);
      // Check if username ends with dot before validation
      if (username.endsWith(".")) {
        throw new Error("Username cannot end with a dot");
      }
      usernameSchema.parse(username);
    } catch (error: any) {
      toast({
        title: "Invalid input",
        description:
          error.message || error.issues?.[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await login(email, otp, name, username, verificationToken);
      if (data.user) {
        toast({
          title: "Welcome!",
          description: "Account created successfully",
        });
        // Redirect to home page (main dashboard)
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setName("");
    setUsername("");
    setNeedsSignup(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(210,36%,96%)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[hsl(221,44%,41%)]">
            SocialConnect
          </CardTitle>
          <p className="text-muted-foreground">
            Connect with friends and the world around you
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full facebook-blue"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Continue with Email"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We'll send you a secure code to sign in
              </p>
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => (window.location.href = "/")}
                >
                  ← Back to explore
                </Button>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to {email}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full facebook-blue"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToEmail}
                disabled={isLoading}
              >
                Back to email
              </Button>
            </form>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Complete your profile to get started
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => {
                    let value = e.target.value.toLowerCase();
                    // Allow only letters, numbers, dots, and underscores
                    value = value.replace(/[^a-z0-9._]/g, "");
                    // Prevent starting with dot
                    if (value.startsWith(".")) {
                      value = value.substring(1);
                    }
                    // Prevent ending with dot (will be handled during typing)
                    // Prevent consecutive dots
                    value = value.replace(/\.{2,}/g, ".");
                    setUsername(value);
                  }}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, dots, and underscores allowed. Cannot
                  start/end with dots.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full facebook-blue"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToEmail}
                disabled={isLoading}
              >
                Back to email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
