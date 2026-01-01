'use client';

import { ContentInsights as ContentInsightsType } from '@/lib/analyzers/types';

interface ContentInsightsProps {
  insights: ContentInsightsType;
  hasTranscript: boolean;
}

export function ContentInsights({ insights, hasTranscript }: ContentInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📋</span> Summary
          </h3>
          {hasTranscript && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
              Transcript Analyzed
            </span>
          )}
        </div>
        <p className="text-slate-300 leading-relaxed">{insights.summary}</p>

        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
            {insights.contentType.replace('_', ' ')}
          </span>
          <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
            For: {insights.targetAudience}
          </span>
        </div>
      </div>

      {/* Key Points */}
      {insights.keyPoints.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Key Points
          </h3>
          <ul className="space-y-3">
            {insights.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Steps */}
      {insights.actionableSteps.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📝</span> Actionable Steps
          </h3>
          <ol className="space-y-3">
            {insights.actionableSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tools & Resources */}
      {(insights.toolsMentioned.length > 0 || insights.resourcesLinked.length > 0) && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🛠️</span> Tools & Resources Mentioned
          </h3>

          {insights.toolsMentioned.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Tools</h4>
              <div className="flex flex-wrap gap-2">
                {insights.toolsMentioned.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.resourcesLinked.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Resources</h4>
              <div className="flex flex-wrap gap-2">
                {insights.resourcesLinked.map((resource, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm"
                  >
                    {resource}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Value & Unique Insights */}
      {(insights.valueProposition || insights.uniqueInsights.length > 0) && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>💡</span> Value Assessment
          </h3>

          {insights.valueProposition && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-400 mb-2">What You'll Get</h4>
              <p className="text-slate-300">{insights.valueProposition}</p>
            </div>
          )}

          {insights.uniqueInsights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Unique Insights</h4>
              <ul className="space-y-2">
                {insights.uniqueInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400">✦</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Monetization & Bias */}
      {(insights.monetizationMethods.length > 0 || insights.potentialBias.length > 0 || insights.callToActions.length > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <span>💰</span> Monetization & Bias Check
          </h3>

          {insights.monetizationMethods.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-300/70 mb-2">How Creator Monetizes</h4>
              <div className="flex flex-wrap gap-2">
                {insights.monetizationMethods.map((method, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.callToActions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-300/70 mb-2">Calls to Action</h4>
              <ul className="space-y-1">
                {insights.callToActions.map((cta, index) => (
                  <li key={index} className="text-yellow-200/80 text-sm flex items-center gap-2">
                    <span>→</span> {cta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.potentialBias.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-300/70 mb-2">Potential Bias</h4>
              <ul className="space-y-1">
                {insights.potentialBias.map((bias, index) => (
                  <li key={index} className="text-yellow-200/80 text-sm flex items-center gap-2">
                    <span>⚠</span> {bias}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {(insights.contentWarnings.length > 0 || insights.factCheckFlags.length > 0) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <span>⚠️</span> Warnings & Fact Checks
          </h3>

          {insights.contentWarnings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-300/70 mb-2">Content Warnings</h4>
              <ul className="space-y-1">
                {insights.contentWarnings.map((warning, index) => (
                  <li key={index} className="text-red-200/80 text-sm flex items-center gap-2">
                    <span>!</span> {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.factCheckFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-300/70 mb-2">Needs Fact Checking</h4>
              <ul className="space-y-1">
                {insights.factCheckFlags.map((flag, index) => (
                  <li key={index} className="text-red-200/80 text-sm flex items-center gap-2">
                    <span>?</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
