import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Bell,
  Trash2,
  Clock11,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext/Authcontext";
import { Navigate } from "react-router-dom";
import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";

/* -------------------------------------------------------
   Utility: cn()
------------------------------------------------------- */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------
   Card Component (local)
------------------------------------------------------- */
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = "Card";

/* -------------------------------------------------------
   Badge Component (local)
   - variants: default | secondary | destructive | outline
------------------------------------------------------- */
function Badge({ variant = "default", className, children, ...props }) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "bg-transparent border text-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------
   Button Component (local)
------------------------------------------------------- */
const Button = React.forwardRef(({ variant = "default", size = "default", className, children, ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "bg-transparent hover:bg-accent",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

/* -------------------------------------------------------
   Tabs (fixed, working)
------------------------------------------------------- */
function Tabs({ value, onValueChange, children }) {
  return <div>{React.Children.map(children, (child) => React.cloneElement(child, { value, onValueChange }))}</div>;
}

function TabsList({ value, onValueChange, children }) {
  return (
    <div className="inline-flex h-10 w-full max-w-md items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground">
      {React.Children.map(children, (child) => React.cloneElement(child, { selectedValue: value, onValueChange }))}
    </div>
  );
}

function TabsTrigger({ value: triggerValue, selectedValue, onValueChange, children }) {
  const isActive = triggerValue === selectedValue;
  return (
    <button
      onClick={() => onValueChange?.(triggerValue)}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------
   Priority config (explicit classes)
------------------------------------------------------- */
const priorityConfig = {
  high: { badgeVariant: "destructive", icon: AlertCircle, iconClass: "text-destructive" },
  medium: { badgeVariant: "default", icon: Clock, iconClass: "text-warning" },
  low: { badgeVariant: "secondary", icon: CheckCircle2, iconClass: "text-success" },
};

/* -------------------------------------------------------
   Main Component
   - details visible directly
   - delete per-notification
   - dynamic (simulated fetch)
------------------------------------------------------- */
export default function Alerts() {
  const { currentUser, userLoggedIn } = useAuth();

  // alerts stored by type (dynamic)
  const [alerts, setAlerts] = useState({
    daily: [],
    weekly: [],
    biweekly: [],
  });

  // selected tab
  const [selectedType, setSelectedType] = useState("daily");

  // load simulated data (replace with real fetch)
  useEffect(() => {
    // simulate API fetch
    const timer = setTimeout(() => {
      setAlerts({
        daily: [
          {
            id: "d1",
            title: "System Backup Pending",
            description: "Daily system backup has not been completed. Critical data may be at risk.",
            priority: "high",
            actions: ["Run backup now", "Check backup logs", "Verify storage space"],
            timestamp: "2 hours ago",
          },
          {
            id: "d2",
            title: "User Activity Spike",
            description: "Unusual increase in user activity detected in the last 24 hours.",
            priority: "medium",
            actions: ["Review analytics", "Check server capacity", "Monitor performance"],
            timestamp: "5 hours ago",
          },
          {
            id: "d3",
            title: "Certificate Expiring Soon",
            description: "SSL certificate will expire in 7 days. Renewal required to maintain security.",
            priority: "medium",
            actions: ["Renew certificate", "Update DNS records", "Test new certificate"],
            timestamp: "8 hours ago",
          },
        ],
        weekly: [
          {
            id: "w1",
            title: "Performance Report Available",
            description: "Weekly performance metrics are ready for review. Overall system health is good.",
            priority: "low",
            actions: ["View full report", "Compare with last week", "Share with team"],
            timestamp: "1 day ago",
          },
          {
            id: "w2",
            title: "Security Patch Required",
            description: "New security updates available for critical system components.",
            priority: "high",
            actions: ["Review patch notes", "Schedule maintenance", "Apply updates"],
            timestamp: "2 days ago",
          },
          {
            id: "w3",
            title: "Database Cleanup Recommended",
            description: "Database has accumulated temporary data. Cleanup will improve performance.",
            priority: "medium",
            actions: ["Analyze database size", "Schedule cleanup", "Create backup first"],
            timestamp: "3 days ago",
          },
        ],
        biweekly: [
          {
            id: "b1",
            title: "Subscription Renewal Due",
            description: "Multiple service subscriptions require renewal in the next billing cycle.",
            priority: "high",
            actions: ["Review subscriptions", "Update payment method", "Confirm renewals"],
            timestamp: "5 days ago",
          },
          {
            id: "b2",
            title: "Team Access Review",
            description: "Biweekly security audit: Review and update team member access permissions.",
            priority: "medium",
            actions: ["Audit user roles", "Remove inactive accounts", "Update permissions"],
            timestamp: "1 week ago",
          },
          {
            id: "b3",
            title: "Compliance Report Needed",
            description: "Biweekly compliance documentation is due for regulatory requirements.",
            priority: "low",
            actions: ["Generate report", "Review compliance checklist", "Submit documentation"],
            timestamp: "10 days ago",
          },
        ],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // derived current alerts
  const currentAlerts = useMemo(() => alerts[selectedType] ?? [], [alerts, selectedType]);

  // delete a notification by id (search across all types to be safe)
  const deleteAlert = (id) => {
    setAlerts((prev) => {
      const next = { ...prev };
      for (const t of Object.keys(next)) {
        next[t] = next[t].filter((a) => a.id !== id);
      }
      return next;
    });
  };

  // optionally, function to append fetched items (dynamic support)
  const addAlertsForType = (type, newAlerts) => {
    setAlerts((prev) => ({
      ...prev,
      [type]: [...(prev[type] ?? []), ...newAlerts],
    }));
  };

  if (!userLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <Navbar currentUser={currentUser} />
      <Sidebar />

      <main className="pt-20 lg:ml-64 px-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6 py-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Alert Dashboard</h1>
              <p className="text-sm text-muted-foreground">Monitor and manage your system alerts</p>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList value={selectedType} onValueChange={setSelectedType}>
                <TabsTrigger value="daily">
                  <Clock11 className="h-4 w-4" /> <span>Daily</span>
                </TabsTrigger>
                <TabsTrigger value="weekly">
                  <Clock className="h-4 w-4" /> <span>Weekly</span>
                </TabsTrigger>
                <TabsTrigger value="biweekly">
                  <Clock className="h-4 w-4" /> <span>Biweekly</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Alerts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentAlerts.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No alerts for {selectedType}.</p>
                </Card>
              </div>
            ) : null}

            {currentAlerts.map((alert, idx) => {
              const conf = priorityConfig[alert.priority] ?? priorityConfig.medium;
              const Icon = conf.icon;

              return (
                <Card
                  key={alert.id}
                  className="group p-6 border-2 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* decorative circle */}
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5 transition-all duration-300 group-hover:scale-125 pointer-events-none" />

                  <div className="relative space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted/40 p-1.5 flex items-center justify-center">
                          <Icon className={cn("h-5 w-5", conf.iconClass)} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground leading-tight">{alert.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{alert.timestamp}</p>
                        </div>
                      </div>

                      <Badge variant={conf.badgeVariant} className="capitalize shrink-0">
                        {alert.priority}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>

                    {/* Details (VISIBLE DIRECTLY) */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Required Actions</p>
                      <ul className="space-y-1.5 mt-2">
                        {alert.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span className="text-muted-foreground">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex gap-3 pt-3">
                      <Button variant="outline" className="flex-1">
                        View Details
                      </Button>

                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                        onClick={() => deleteAlert(alert.id)}
                        aria-label={`Delete alert ${alert.title}`}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary Card */}
          <Card className="p-6 border-2 bg-card/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total {selectedType} alerts</p>
                <p className="text-3xl font-bold text-foreground">{currentAlerts.length}</p>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">High Priority</p>
                  <p className="text-xl font-semibold text-destructive">{currentAlerts.filter(a => a.priority === "high").length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Medium</p>
                  <p className="text-xl font-semibold text-warning">{currentAlerts.filter(a => a.priority === "medium").length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Low</p>
                  <p className="text-xl font-semibold text-success">{currentAlerts.filter(a => a.priority === "low").length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
