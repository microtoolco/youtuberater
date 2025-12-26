"use client";

import { useState } from "react";
import { Copy, Download, Check, Clock, Wrench, AlertTriangle, Lightbulb, ExternalLink, ChevronDown, ChevronUp, Youtube, Printer } from "lucide-react";
import type { GuideContent } from "@/types";

interface GuidePreviewProps {
  guide: GuideContent;
  videoInfo: {
    title: string;
    thumbnail: string;
    channel: string;
  };
}

export function GuidePreview({ guide, videoInfo }: GuidePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));

  const handleCopy = async () => {
    const text = generatePlainText(guide);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generatePlainText(guide);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    setExpandedSteps(new Set(guide.steps.map(s => s.stepNumber)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 rounded-2xl overflow-hidden print:bg-white print:text-black">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4 print:hidden">
        <span className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-3">
          Step-by-Step Guide
        </span>
        <h2 className="text-white text-xl font-bold mb-1">Tuborial</h2>
        <p className="text-white/70 text-sm">YouTube to actionable guide</p>
      </div>

      {/* Guide Card */}
      <div className="mx-4 mb-4 print:mx-0">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Video Info */}
          <div className="p-6 border-b border-gray-100 print:border-gray-300">
            <div className="flex gap-4">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-32 h-20 object-cover rounded-lg print:hidden"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>{videoInfo.channel}</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                  {videoInfo.title}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Guide Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">
              {guide.title}
            </h1>
            <p className="text-gray-600 mb-4">{guide.description}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[guide.difficulty]}`}>
                {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
              </span>
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                {guide.estimatedTime}
              </span>
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                <Wrench className="w-4 h-4" />
                {guide.toolsAndMaterials.length} items needed
              </span>
            </div>

            {/* Tools & Materials */}
            {guide.toolsAndMaterials.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Tools & Materials
                </h2>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <div className="grid md:grid-cols-2 gap-3">
                    {guide.toolsAndMaterials.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${item.required ? 'bg-red-500' : 'bg-gray-400'}`} />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.description && (
                            <span className="text-gray-500 text-sm ml-1">- {item.description}</span>
                          )}
                          {item.estimatedPrice && (
                            <span className="text-orange-600 text-sm ml-2">{item.estimatedPrice}</span>
                          )}
                          {!item.required && (
                            <span className="text-gray-400 text-xs ml-2">(optional)</span>
                          )}
                        </div>
                        {item.buyLink && (
                          <a
                            href={item.buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* General Warnings */}
            {guide.warnings && guide.warnings.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Important Warnings
                </h3>
                <ul className="space-y-1">
                  {guide.warnings.map((warning, i) => (
                    <li key={i} className="text-red-700 text-sm">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Steps ({guide.steps.length})
                </h2>
                <div className="flex gap-2 print:hidden">
                  <button onClick={expandAll} className="text-xs text-gray-500 hover:text-gray-700">
                    Expand all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={collapseAll} className="text-xs text-gray-500 hover:text-gray-700">
                    Collapse all
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {guide.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="border border-gray-200 rounded-xl overflow-hidden print:border-gray-300"
                  >
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition print:hover:bg-transparent"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {step.stepNumber}
                      </div>
                      <span className="font-medium text-gray-900 flex-1">{step.title}</span>
                      {expandedSteps.has(step.stepNumber) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 print:hidden" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 print:hidden" />
                      )}
                    </button>

                    {(expandedSteps.has(step.stepNumber) || true) && (
                      <div className={`px-4 pb-4 pl-16 ${!expandedSteps.has(step.stepNumber) ? 'hidden print:block' : ''}`}>
                        <p className="text-gray-600 mb-3">{step.description}</p>

                        {step.tips && step.tips.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-2">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                              <div>
                                {step.tips.map((tip, i) => (
                                  <p key={i} className="text-blue-700 text-sm">{tip}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {step.warnings && step.warnings.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                              <div>
                                {step.warnings.map((warning, i) => (
                                  <p key={i} className="text-amber-700 text-sm">{warning}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* General Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5" />
                  Pro Tips
                </h3>
                <ul className="space-y-1">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="text-blue-700 text-sm">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center print:border-gray-300">
              <p className="text-gray-500 text-sm">
                Guide generated from YouTube video using <strong className="text-gray-700">Tuborial</strong>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center print:hidden">
            <span className="text-xs text-gray-500">{guide.steps.length} steps</span>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:from-red-600 hover:to-orange-600 transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom badge */}
      <div className="text-center pb-4 print:hidden">
        <span className="inline-block bg-white/10 text-white/80 text-xs px-4 py-2 rounded-full">
          ⚡ Powered by Tuborial
        </span>
      </div>
    </div>
  );
}

function generatePlainText(guide: GuideContent): string {
  let text = `${guide.title}\n`;
  text += `${"=".repeat(guide.title.length)}\n\n`;
  text += `${guide.description}\n\n`;
  text += `Difficulty: ${guide.difficulty}\n`;
  text += `Estimated Time: ${guide.estimatedTime}\n\n`;

  if (guide.toolsAndMaterials.length > 0) {
    text += `TOOLS & MATERIALS\n`;
    text += `-----------------\n`;
    guide.toolsAndMaterials.forEach((item) => {
      text += `• ${item.name}${item.required ? "" : " (optional)"}`;
      if (item.description) text += ` - ${item.description}`;
      if (item.estimatedPrice) text += ` [${item.estimatedPrice}]`;
      text += `\n`;
    });
    text += `\n`;
  }

  if (guide.warnings && guide.warnings.length > 0) {
    text += `⚠️ WARNINGS\n`;
    text += `-----------\n`;
    guide.warnings.forEach((w) => {
      text += `• ${w}\n`;
    });
    text += `\n`;
  }

  text += `STEPS\n`;
  text += `-----\n\n`;
  guide.steps.forEach((step) => {
    text += `Step ${step.stepNumber}: ${step.title}\n`;
    text += `${step.description}\n`;
    if (step.tips && step.tips.length > 0) {
      step.tips.forEach((t) => {
        text += `  💡 Tip: ${t}\n`;
      });
    }
    if (step.warnings && step.warnings.length > 0) {
      step.warnings.forEach((w) => {
        text += `  ⚠️ Warning: ${w}\n`;
      });
    }
    text += `\n`;
  });

  if (guide.tips && guide.tips.length > 0) {
    text += `PRO TIPS\n`;
    text += `--------\n`;
    guide.tips.forEach((t) => {
      text += `• ${t}\n`;
    });
  }

  text += `\n---\nGenerated by Tuborial\n`;

  return text;
}
