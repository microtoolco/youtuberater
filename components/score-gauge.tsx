'use client';

interface ScoreGaugeProps {
  score: number;
  recommendation: 'watch' | 'caution' | 'skip';
}

export function ScoreGauge({ score, recommendation }: ScoreGaugeProps) {
  const getColor = () => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = () => {
    if (score >= 70) return 'from-green-500/20 to-green-600/5';
    if (score >= 40) return 'from-yellow-500/20 to-yellow-600/5';
    return 'from-red-500/20 to-red-600/5';
  };

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'watch': return 'Worth Watching';
      case 'caution': return 'Proceed with Caution';
      case 'skip': return 'Consider Skipping';
    }
  };

  const getRecommendationIcon = () => {
    switch (recommendation) {
      case 'watch': return '✓';
      case 'caution': return '⚠';
      case 'skip': return '✗';
    }
  };

  // SVG gauge calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`bg-gradient-to-br ${getBgColor()} rounded-2xl p-8 border border-slate-700/50`}>
      <div className="flex flex-col items-center">
        {/* Circular Gauge */}
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={getColor()}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${getColor()}`}>{score}</span>
            <span className="text-slate-400 text-sm">out of 100</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            recommendation === 'watch' ? 'bg-green-500/20 text-green-400' :
            recommendation === 'caution' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <span className="text-lg">{getRecommendationIcon()}</span>
            <span className="font-semibold">{getRecommendationText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
