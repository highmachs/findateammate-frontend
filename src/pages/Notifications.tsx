import { useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash2, UserPlus, MessageSquare, Bell, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const getIcon = (type: string) => {
  switch (type) {
    case "connection_request": return <UserPlus className="h-5 w-5 text-blue-500" />;
    case "request_accepted": return <Check className="h-5 w-5 text-green-500" />;
    case "message": return <MessageSquare className="h-5 w-5 text-indigo-500" />;
    default: return <Bell className="h-5 w-5 text-orange-500" />;
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, fetchNotifications, markAsRead, clearNotifications } = useStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleMarkAllRead = () => markAsRead('all');
  const handleClearAll = () => clearNotifications('all');

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your latest activity.</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <Check className="h-4 w-4" /> Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-muted"
            >
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No notifications yet</h3>
              <p className="text-sm text-muted-foreground/70">When you get requests or messages, they'll show up here.</p>
            </motion.div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group relative"
              >
                <Card className={`p-4 border shadow-sm transition-all duration-200 
                  ${notification.isRead ? 'bg-card/50 border-border/50' : 'bg-card border-primary/20 shadow-md shadow-primary/5'}
                  hover:shadow-lg hover:border-primary/40`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-bold ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Action Link */}
                      {notification.link && (
                        <div className="mt-3">
                            <Link href={notification.link}>
                                <Button variant="link" className="p-0 h-auto font-bold text-xs text-primary gap-1">
                                    View Details <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm rounded-lg p-1 absolute right-2 top-2 sm:static sm:bg-transparent sm:p-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                          title="Mark as read"
                          onClick={() => markAsRead([notification.id])}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        title="Delete"
                        onClick={() => clearNotifications([notification.id])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
