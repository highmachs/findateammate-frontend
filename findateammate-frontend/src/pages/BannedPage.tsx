import { Shield, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function BannedPage() {
  const { user, isLoading } = useAuth();
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    // Try to get ban reason from user object first, then localStorage
    if (user?.banReason) {
      setBanReason(user.banReason);
    } else {
      const storedReason = localStorage.getItem("banReason");
      if (storedReason) {
        setBanReason(storedReason);
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleContactSupport = () => {
    const email = user?.email || "unknown";
    window.location.href = `mailto:findateammate.ahilight@gmail.com?subject=Appeal%20Account%20Ban&body=Email: ${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Account Banned</CardTitle>
          <CardDescription>
            Your account has been suspended due to policy violation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ban Reason Section */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Ban Reason
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">
              {banReason || "Your account has violated our community guidelines and terms of service."}
            </p>
          </div>

          {/* Information Section */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-700">What This Means</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>You cannot access your account or any features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>You cannot create new accounts with the same email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>All your previous posts and connections remain hidden</span>
              </li>
            </ul>
          </div>

          {/* Appeal Section */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
            <h3 className="font-semibold text-blue-700">Appeal Your Ban</h3>
            <p className="text-sm text-slate-600">
              If you believe this is a mistake or want to appeal the ban, please contact our support team with your email address and reason for appeal.
            </p>
            <Button
              onClick={handleContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              For urgent matters, please email findateammate.ahilight@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
