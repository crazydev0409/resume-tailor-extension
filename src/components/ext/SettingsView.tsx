import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Download, Bell, BellOff, Keyboard, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { testConnection } from "@/services/supabaseHistory";

interface SettingsViewProps {
  apiKey: string;
  apiUrl: string;
  model: string;
  baseResume: string;
  notificationsEnabled: boolean;
  notifyOnStart: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onApiKeyChange: (v: string) => void;
  onApiUrlChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onBaseResumeChange: (v: string) => void;
  onNotificationsEnabledChange: (v: boolean) => void;
  onNotifyOnStartChange: (v: boolean) => void;
  onSupabaseUrlChange: (v: string) => void;
  onSupabaseAnonKeyChange: (v: string) => void;
  onBack: () => void;
}

const SETUP_SQL = `create table resume_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text,
  role text,
  job_description text not null,
  original_resume text not null,
  tailored_resume text not null,
  model text,
  api_url text,
  source_url text,
  keywords jsonb
);

alter table resume_generations enable row level security;

create policy "anon insert" on resume_generations
  for insert to anon with check (true);

create policy "anon select" on resume_generations
  for select to anon using (true);`;

export const SettingsView = ({
  apiKey,
  apiUrl,
  model,
  baseResume,
  notificationsEnabled,
  notifyOnStart,
  supabaseUrl,
  supabaseAnonKey,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange,
  onBaseResumeChange,
  onNotificationsEnabledChange,
  onNotifyOnStartChange,
  onSupabaseUrlChange,
  onSupabaseAnonKeyChange,
  onBack,
}: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<"api" | "resume" | "database">("api");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const normalizeApiKey = (value: string) =>
    value.trim().replace(/^['"]+|['"]+$/g, "").replace(/\s+/g, "");

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try {
      await testConnection({ url: supabaseUrl, anonKey: supabaseAnonKey });
      setTestStatus("success");
      toast.success("Connected! Your cloud archive is ready.");
    } catch (err: any) {
      setTestStatus("error");
      toast.error(err?.message || "Connection failed");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    toast.success("SQL copied to clipboard!");
  };

  const handleExportSettings = () => {
    const settings = {
      apiKey,
      apiUrl,
      model,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-tailor-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported!");
  };

  const handleImportSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (parsed.apiKey) onApiKeyChange(normalizeApiKey(parsed.apiKey));
          if (parsed.apiUrl) onApiUrlChange(parsed.apiUrl);
          if (parsed.model) onModelChange(parsed.model);
          toast.success("Settings imported!");
        } catch {
          toast.error("Invalid settings file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-7 text-xs gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <h2 className="text-sm font-semibold">Settings</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b px-4 shrink-0">
        <button
          onClick={() => setActiveTab("api")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "api"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          API Settings
        </button>
        <button
          onClick={() => setActiveTab("resume")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "resume"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Base Resume
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "database"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Database
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "database" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 border rounded-lg text-xs text-muted-foreground">
              <Database className="w-4 h-4 shrink-0 text-primary" />
              <span>
                Every successfully tailored resume + job description is permanently archived to your
                own free Supabase database, separate from the "Done" list above (which you can still
                edit or clear anytime).
              </span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Supabase Project URL</Label>
              <Input
                placeholder="https://xxxxxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => { onSupabaseUrlChange(e.target.value); setTestStatus("idle"); }}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Supabase anon (public) API Key</Label>
              <Input
                type="password"
                placeholder="eyJhbGciOi..."
                value={supabaseAnonKey}
                onChange={(e) => { onSupabaseAnonKeyChange(e.target.value); setTestStatus("idle"); }}
                className="text-xs h-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testStatus === "testing" || !supabaseUrl || !supabaseAnonKey}
              className="w-full text-xs h-8 gap-1.5"
            >
              {testStatus === "testing" && <Loader2 className="w-3 h-3 animate-spin" />}
              {testStatus === "success" && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              {testStatus === "error" && <XCircle className="w-3 h-3 text-destructive" />}
              Test Connection
            </Button>

            <details className="text-xs border rounded-lg p-2.5 group">
              <summary className="cursor-pointer font-medium select-none">
                First time? Set up a free Supabase project
              </summary>
              <div className="mt-2 space-y-2 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Create a free project at{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      supabase.com
                    </a>{" "}
                    (no credit card required).
                  </li>
                  <li>Open the SQL Editor in your new project and run the script below.</li>
                  <li>
                    Go to Project Settings → API, then copy the <strong>Project URL</strong> and the{" "}
                    <strong>anon public</strong> key into the fields above.
                  </li>
                </ol>
                <div className="relative">
                  <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto whitespace-pre">
                    {SETUP_SQL}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySql}
                    className="absolute top-1 right-1 h-6 text-[10px] px-2"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </details>
          </div>
        ) : activeTab === "api" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(normalizeApiKey(e.target.value))}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">API URL</Label>
              <Input
                placeholder="https://api.deepseek.com"
                value={apiUrl}
                onChange={(e) => onApiUrlChange(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Model</Label>
              <Input
                placeholder="deepseek-v4-pro"
                value={model}
                onChange={(e) => onModelChange(e.target.value.trim())}
                className="text-xs h-8"
              />
              <p className="text-[10px] text-muted-foreground">
                DeepSeek V4 Pro is the quality-first default.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleExportSettings} className="text-xs h-7 gap-1 flex-1">
                <Download className="w-3 h-3" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportSettings} className="text-xs h-7 gap-1 flex-1">
                <Upload className="w-3 h-3" />
                Import
              </Button>
            </div>

            {/* Notifications toggles */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notifyOnStart ? (
                    <Bell className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-xs">Notify on Start</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Show when new JD accepted
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNotifyOnStartChange(!notifyOnStart);
                    toast.success(notifyOnStart ? "Start notification off" : "Start notification on");
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notifyOnStart ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      notifyOnStart ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notificationsEnabled ? (
                    <Bell className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-xs">Notify on Complete</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Show when tailoring finishes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNotificationsEnabledChange(!notificationsEnabled);
                    toast.success(notificationsEnabled ? "Complete notification off" : "Complete notification on");
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notificationsEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      notificationsEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex items-center gap-2 pt-3 border-t">
              <Keyboard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <Label className="text-xs">Keyboard Shortcut</Label>
                <p className="text-[10px] text-muted-foreground">
                  Select text on any page, then press{" "}
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                    {navigator.platform?.includes("Mac") ? "^+Shift+T" : "Alt+Shift+T"}
                  </kbd>
                  {" "}to tailor instantly. Customize at{" "}
                  <span className="font-mono">chrome://extensions/shortcuts</span>
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-2">
              Settings are stored locally in your browser extension. Your API key is never sent anywhere except the configured API endpoint.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Base Resume (Markdown)</Label>
              <span className="text-[10px] text-muted-foreground">
                {baseResume.length > 0 ? `${baseResume.length} chars` : "Not set"}
              </span>
            </div>
            <Textarea
              placeholder="Paste your base resume in Markdown format here. This will be used as the source for all tailoring..."
              value={baseResume}
              onChange={(e) => onBaseResumeChange(e.target.value)}
              className="flex-1 text-xs resize-none min-h-[400px]"
            />
            <p className="text-[10px] text-muted-foreground">
              This resume will be used every time you tailor. You can update it anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
