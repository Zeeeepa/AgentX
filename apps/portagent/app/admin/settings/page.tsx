"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Settings {
  llm: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  agent: {
    systemPrompt: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    llm: { apiKey: "", baseUrl: "", model: "" },
    agent: { systemPrompt: "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [apiKeyPlaceholder, setApiKeyPlaceholder] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!response.ok) {
        setError("Failed to load settings");
        return;
      }

      const data: Settings = await response.json();
      // Store masked apiKey as placeholder, don't put it in the form value
      setApiKeyPlaceholder(data.llm.apiKey);
      setSettings({
        llm: {
          apiKey: "",
          baseUrl: data.llm.baseUrl,
          model: data.llm.model,
        },
        agent: {
          systemPrompt: data.agent.systemPrompt,
        },
      });
    } catch {
      setError("An error occurred");
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const body: Record<string, Record<string, string>> = {
        llm: {
          baseUrl: settings.llm.baseUrl,
          model: settings.llm.model,
        },
        agent: {
          systemPrompt: settings.agent.systemPrompt,
        },
      };

      // Only send apiKey if user entered a new value
      if (settings.llm.apiKey) {
        body.llm.apiKey = settings.llm.apiKey;
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!response.ok) {
        setError("Failed to save settings");
        return;
      }

      setSuccess("Settings saved. New conversations will use the updated configuration.");
      // Reload to refresh masked apiKey
      await loadSettings();
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>LLM Configuration</CardTitle>
            <CardDescription>
              Configure the language model provider. Changes take effect on new conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={apiKeyPlaceholder || "Enter API key"}
                value={settings.llm.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    llm: { ...settings.llm, apiKey: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep the current key. Falls back to DEEPRACTICE_API_KEY env var.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="text"
                placeholder="https://api.anthropic.com (optional)"
                value={settings.llm.baseUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    llm: { ...settings.llm, baseUrl: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Set for OpenAI-compatible providers. Leave empty for Anthropic.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                type="text"
                placeholder="claude-sonnet-4-20250514"
                value={settings.llm.model}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    llm: { ...settings.llm, model: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Configure the default agent behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Enter system prompt (optional)"
                rows={6}
                value={settings.agent.systemPrompt}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    agent: { ...settings.agent, systemPrompt: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>

          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </main>
  );
}
