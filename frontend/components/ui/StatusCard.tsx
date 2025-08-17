"use client";

interface StatusCardProps {
  title: string;
  status: "operational" | "degraded" | "running" | "error";
  metrics?: Array<{
    label: string;
    value: string;
  }>;
  statusIcon?: string;
}

export function StatusCard({ title, status, metrics, statusIcon = "●" }: StatusCardProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "operational":
      case "running":
        return "terminal-bright";
      case "degraded":
        return "system-message";
      case "error":
        return "text-red-400";
      default:
        return "terminal-dim";
    }
  };

  return (
    <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="terminal-command text-sm">{title}</div>
          <div className={`text-xs ${getStatusColor(status)}`}>
            {statusIcon} {status.toUpperCase()}
          </div>
        </div>
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {metrics.map((metric, index) => (
              <div key={index}>
                <div className="terminal-dim">{metric.label.toUpperCase()}</div>
                <div className="terminal-text">{metric.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}