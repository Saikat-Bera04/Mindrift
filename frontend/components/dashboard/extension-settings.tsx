"use client";

import { useState, useEffect } from "react";
import { Copy, Check, RotateCcw, Unlink } from "lucide-react";

interface PairingCode {
  code: string;
  expiresAt: string;
  generatedAt: string;
}

interface ExtensionDevice {
  id: string;
  name: string;
  pairedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
}

export function ExtensionSettings() {
  const [pairingCode, setPairingCode] = useState<PairingCode | null>(null);
  const [devices, setDevices] = useState<ExtensionDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mindrift.onrender.com";

  // Fetch pairing code
  async function generatePairingCode() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/extension/pairing-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to generate code");

      const data = await response.json();
      setPairingCode(data);

      // Reset copy status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error generating pairing code:", error);
      alert("Failed to generate pairing code. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  // Copy code to clipboard
  function copyToClipboard() {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Fetch paired devices
  async function fetchDevices() {
    try {
      const response = await fetch(`${API_BASE}/extension/devices`);
      if (!response.ok) throw new Error("Failed to fetch devices");

      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  }

  // Unpair device
  async function unpairDevice(deviceId: string) {
    if (!confirm("Remove this paired device?")) return;

    try {
      const response = await fetch(`${API_BASE}/extension/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to unpair device");

      setDevices(devices.filter((d) => d.id !== deviceId));
    } catch (error) {
      console.error("Error unpairing device:", error);
      alert("Failed to unpair device. Try again.");
    }
  }

  useEffect(() => {
    fetchDevices();
  }, []);

  const isExpired = pairingCode
    ? new Date(pairingCode.expiresAt) < new Date()
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Browser Extension</h2>
        <p className="text-sm text-gray-400">
          Connect your Mindrift browser extension to sync activity data and wellness insights
        </p>
      </div>

      {/* Section: Generate Pairing Code */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Get Pairing Code</h3>
            <p className="text-sm text-gray-400">
              Generate a 6-digit code to pair your browser extension
            </p>
          </div>
        </div>

        {pairingCode ? (
          <div className="space-y-4">
            {/* Code Display */}
            <div className="bg-gray-800 border border-green-500/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Pairing Code</p>
              <div className="flex items-center justify-between">
                <code className="text-3xl font-mono font-bold text-green-400 tracking-widest">
                  {pairingCode.code}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Expiry */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Expires: {new Date(pairingCode.expiresAt).toLocaleTimeString()}
                  {isExpired && <span className="ml-2 text-red-400"> (Expired)</span>}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div
              className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 cursor-pointer hover:bg-blue-900/30 transition"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <p className="text-sm text-blue-300 font-semibold">
                {showInstructions ? "▼" : "▶"} How to pair your extension
              </p>

              {showInstructions && (
                <ol className="text-sm text-gray-300 space-y-2 mt-3 ml-4 list-decimal">
                  <li>Copy the 6-digit code above</li>
                  <li>Click the Mindrift extension icon in your browser</li>
                  <li>Paste the code in the input field</li>
                  <li>Click "Connect Extension"</li>
                  <li>Your extension will start syncing data automatically</li>
                </ol>
              )}
            </div>

            {/* Generate New */}
            <button
              onClick={generatePairingCode}
              disabled={loading || !isExpired}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition"
            >
              <RotateCcw size={18} />
              {isExpired ? "Generate New Code" : "Code still valid"}
            </button>
          </div>
        ) : (
          <button
            onClick={generatePairingCode}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {loading ? "Generating..." : "Generate Pairing Code"}
          </button>
        )}
      </div>

      {/* Section: Paired Devices */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Paired Devices</h3>

        {devices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No paired devices yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Generate a pairing code above and use it to pair your extension
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{device.name}</p>
                    {device.isActive && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Paired: {new Date(device.pairedAt).toLocaleDateString()}
                    {device.lastSyncAt && (
                      <span>
                        {" "}
                        • Synced: {new Date(device.lastSyncAt).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => unpairDevice(device.id)}
                  className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
                >
                  <Unlink size={16} />
                  Unpair
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <p className="text-sm text-purple-300">
          <span className="font-semibold">💡 Tip:</span> Your paired extension will automatically
          sync your browsing activity, screen time, and wellness data every hour. Make sure to keep
          the extension enabled for best results.
        </p>
      </div>
    </div>
  );
}
