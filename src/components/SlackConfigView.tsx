import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Radio,
  Clock,
  Settings2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const SlackConfigView: React.FC = () => {
  const { slackConfig, updateSlackConfig, slackNotifications, sendSlackNotification } = useApp();

  const [webhookUrl, setWebhookUrl] = useState(slackConfig.webhookUrl);
  const [channel, setChannel] = useState(slackConfig.channel);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSlackConfig({
      webhookUrl,
      channel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTest = () => {
    sendSlackNotification(
      'order_created',
      'Test Slack Integration from Agency Central Hub',
      `*Order #TEST-99* for *Shree Ganesh Traders* (Total: ₹18,450). This confirms your Slack notifications are active and transmitting in real-time!`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const toggleEvent = (key: keyof typeof slackConfig.notifyEvents) => {
    updateSlackConfig({
      notifyEvents: {
        ...slackConfig.notifyEvents,
        [key]: !slackConfig.notifyEvents[key],
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Slack Alerts & WhatsApp Integration Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure automated Slack channel notifications for retailer orders, agency price changes, and stock replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTest}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? 'Alert Dispatched!' : 'Send Test Slack Ping'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Slack Configuration & Toggles */}
        <div className="lg:col-span-6 space-y-5">
          {/* Webhook Settings Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  #
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Slack Webhook Configuration</h3>
                  <p className="text-[11px] text-slate-500">
                    Connect any Slack channel using Incoming Webhooks (Zero server costs)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700">Active</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Incoming Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Paste your Slack app's webhook URL here. All selected system alerts will be sent automatically.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Target Slack Channel
                </label>
                <input
                  type="text"
                  placeholder="#agency-orders-alerts"
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Slack Settings
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Alert Toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Automated Alert Event Triggers
            </h3>
            <p className="text-xs text-slate-500">
              Select which agency activities trigger real-time messages to your Slack channel:
            </p>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Retailer WhatsApp Orders
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sends instant notification when retailer places an order via WhatsApp/Chat
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={slackConfig.notifyEvents.orderCreated}
                  onChange={() => toggleEvent('orderCreated')}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Agency Price Change Alerts
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Alerts you immediately when any of the 5 agencies updates item cost price
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={slackConfig.notifyEvents.priceChanged}
                  onChange={() => toggleEvent('priceChanged')}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Low Stock & Reorder Alarms
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Triggers warning when inventory stock reaches minimum reorder threshold
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={slackConfig.notifyEvents.lowStock}
                  onChange={() => toggleEvent('lowStock')}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Order Dispatch & Delivery Updates
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notifies team when goods leave warehouse and stock is deducted
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={slackConfig.notifyEvents.orderDispatched}
                  onChange={() => toggleEvent('orderDispatched')}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Stock Replenishment Received
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Alerts when Agency PO is marked received and goods are deposited
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={slackConfig.notifyEvents.purchaseOrderReceived}
                  onChange={() => toggleEvent('purchaseOrderReceived')}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp to Slack Architecture Explainer */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              How WhatsApp ➔ Slack Automation Works (Cost-Effective)
            </h4>
            <p className="text-emerald-900 leading-relaxed text-[11px]">
              You do not need expensive proprietary servers! With our built-in{' '}
              <strong>WhatsApp Parser</strong>, you can paste raw messages from retailers into the
              app in 1 click, generating both the Sales Order and Slack notification simultaneously.
              For 100% automated zero-touch ingestion, connect a free webhook receiver (via{' '}
              <em>Make.com</em> or <em>n8n free tier</em>) that forwards incoming WhatsApp messages to
              this dashboard.
            </p>
          </div>
        </div>

        {/* Right Column: Live Slack Feed Simulator */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              Live Slack Alerts Stream ({slackNotifications.length} Events)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Channel: {slackConfig.channel}
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3 max-h-[620px] overflow-y-auto">
            {slackNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No alerts recorded yet. Click "Send Test Slack Ping" above or create an order.
              </div>
            ) : (
              slackNotifications.map(notif => {
                const isPrice = notif.eventType === 'price_changed';
                const isLow = notif.eventType === 'low_stock';
                const isPO = notif.eventType === 'po_received';
                const isDispatch = notif.eventType === 'order_dispatched';

                return (
                  <div
                    key={notif.id}
                    className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-xl space-y-1.5 text-xs font-sans hover:border-slate-600 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPrice
                              ? 'bg-amber-400'
                              : isLow
                              ? 'bg-rose-400'
                              : isPO
                              ? 'bg-blue-400'
                              : isDispatch
                              ? 'bg-purple-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="font-bold text-slate-200">{notif.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Slack formatted payload */}
                    <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-slate-600">
                      {notif.payload}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Event: {notif.eventType}</span>
                      <span className="text-emerald-400 font-mono">Status: Delivered (200 OK)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
