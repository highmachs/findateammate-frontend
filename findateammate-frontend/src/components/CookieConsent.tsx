import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Card className="max-w-4xl mx-auto p-6 glass-panel border-border/50 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <h3 className="font-bold text-lg mb-2">🍪 Cookie Notice</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use essential cookies to ensure the website functions properly and optional cookies to improve your experience. 
              By clicking "Accept", you consent to our use of cookies. You can manage your preferences anytime.
            </p>
            <div className="flex gap-3">
              <Button onClick={acceptCookies} size="sm" className="bg-primary">
                Accept All
              </Button>
              <Button onClick={declineCookies} size="sm" variant="outline">
                Essential Only
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={declineCookies}
            className="shrink-0"
            aria-label="Dismiss cookie notice"
          >
            <X size={20} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
