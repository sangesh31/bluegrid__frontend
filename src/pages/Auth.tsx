import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Droplets } from "lucide-react";
import { sendOTP, verifyOTPSignup } from "@/lib/api";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signIn: authSignIn, signUp: authSignUp } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    console.log('Auth useEffect triggered:', { user: !!user, profile: !!profile, role: profile?.role });
    if (user && profile) {
      console.log('Redirecting user with role:', profile.role);
      // Redirect based on role
      switch (profile.role) {
        case 'panchayat_officer':
          navigate("/panchayat-officer");
          break;
        case 'maintenance_technician':
          navigate("/maintenance-technician");
          break;
        case 'water_flow_controller':
          navigate("/water-controller");
          break;
        case 'resident':
        default:
          navigate("/resident");
      }
    }
  }, [user, profile, navigate]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authSignIn(loginEmail, loginPassword);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Navigation will be handled by useEffect when user/profile updates
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !signupEmail || !phone || !address || !signupPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await sendOTP(signupEmail, fullName, phone, address);
      setShowOtpInput(true);
      setOtpTimer(600); // 10 minutes
      toast({
        title: "OTP Sent!",
        description: "Please check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const session = await verifyOTPSignup(signupEmail, otp, signupPassword, fullName, phone, address);
      localStorage.setItem('auth_token', session.token);
      toast({
        title: "Account created!",
        description: "Welcome to BlueGrid",
      });
      // Reload to trigger auth context
      window.location.href = '/resident';
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await sendOTP(signupEmail, fullName, phone, address);
      setOtpTimer(600);
      toast({
        title: "OTP Resent!",
        description: "A new OTP has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-2">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">BlueGrid</CardTitle>
          <CardDescription className="text-center">
            Water Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!showOtpInput ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Mobile Number</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Address</Label>
                      <Input
                        id="signup-address"
                        type="text"
                        placeholder="Your complete address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Enter your password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        required
                        className="text-center text-2xl tracking-widest"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        OTP sent to {signupEmail}
                      </p>
                      {otpTimer > 0 ? (
                        <p className="text-sm text-center text-blue-600">
                          Expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                        </p>
                      ) : (
                        <p className="text-sm text-center text-red-600">
                          OTP expired
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || otpTimer === 0}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleResendOtp}
                      disabled={isLoading || otpTimer > 540}
                    >
                      Resend OTP
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtp("");
                        setOtpTimer(0);
                      }}
                    >
                      Change Email
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
