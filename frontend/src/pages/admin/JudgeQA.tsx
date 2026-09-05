import React, { useState, useMemo } from 'react';
import {
  MOCK_JUDGE_QUESTIONS,
  MOCK_JUDGE_SOLUTIONS,
  JUDGE_CATEGORY_CONFIG,
  DIFFICULTY_CONFIG,
  STATUS_CONFIG_QA,
  type JudgeQuestion,
  type JudgeCategory,
  type DifficultyLevel,
  type AnswerStatus,
} from '../../mock/mockJudgeQA';
import {
  Scale,
  MessageSquare,
  ThumbsUp,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Brain,
  Filter,
  Send,
  FileText,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  User,
} from 'lucide-react';

export const AdminJudgeQA: React.FC = () => {
  const [questions] = useState<JudgeQuestion[]>(MOCK_JUDGE_QUESTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<JudgeCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AnswerStatus | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [showAskForm, setShowAskForm] = useState(false);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (filterCategory !== 'all' && q.category !== filterCategory) return false;
      if (filterStatus !== 'all' && q.status !== filterStatus) return false;
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
      if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase()) && !q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    });
  }, [questions, filterCategory, filterStatus, filterDifficulty, searchQuery]);

  const selected = questions.find((q) => q.id === selectedId) || null;
  const solution = selected ? MOCK_JUDGE_SOLUTIONS.find((s) => s.questionId === selected.id) : null;

  const counts = {
    total: questions.length,
    answered: questions.filter((q) => q.status === 'answered').length,
    pending: questions.filter((q) => q.status === 'pending').length,
    underReview: questions.filter((q) => q.status === 'under_review').length,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-100 font-mono flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-400" />
            JUDGE Q&A — TRAFFIC INTELLIGENCE
          </h2>
          <p className="text-[11px] text-slate-400">
            Judicial queries on traffic management — data-driven answers from BTIS intelligence engine.
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[9px] font-mono font-bold text-violet-400">
            DEMO DATA — Solutions are AI-generated from system analytics
          </span>
        </div>
        <button
          onClick={() => setShowAskForm(!showAskForm)}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          ASK QUESTION
        </button>
      </div>

      {/* ── Status Counts ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Questions', count: counts.total, icon: MessageSquare, color: 'text-slate-300' },
          { label: 'Answered', count: counts.answered, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pending', count: counts.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Under Review', count: counts.underReview, icon: AlertTriangle, color: 'text-purple-400' },
        ].map((item) => (
          <div key={item.label} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
            <span className={`text-lg font-bold font-mono ${item.color}`}>{item.count}</span>
            <span className="text-[9px] font-mono text-slate-500 block">{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Ask Form ── */}
      {showAskForm && (
        <div className="bg-slate-900 border border-violet-500/30 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Scale className="w-3.5 h-3.5" /> Submit Judicial Query
            </h3>
            <button onClick={() => setShowAskForm(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <span className="text-lg">×</span>
            </button>
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Question</label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              placeholder="Enter your traffic management question for the intelligence engine..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAskForm(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-[10px] font-mono font-bold rounded-lg">Cancel</button>
            <button
              onClick={() => {
                if (newQuestion.trim()) {
                  setShowAskForm(false);
                  setNewQuestion('');
                }
              }}
              disabled={!newQuestion.trim()}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" /> Submit Query
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-200 focus:outline-none focus:border-violet-500 w-48"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button onClick={() => setFilterCategory('all')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${filterCategory === 'all' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>All</button>
          {(Object.entries(JUDGE_CATEGORY_CONFIG) as [JudgeCategory, typeof JUDGE_CATEGORY_CONFIG[JudgeCategory]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterCategory(key)} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${filterCategory === key ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>
              {cfg.icon}
            </button>
          ))}
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button onClick={() => setFilterStatus('all')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${filterStatus === 'all' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>All</button>
          {(['answered', 'pending', 'under_review'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize ${filterStatus === s ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button onClick={() => setFilterDifficulty('all')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${filterDifficulty === 'all' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>All</button>
          {(['basic', 'intermediate', 'advanced'] as const).map((d) => (
            <button key={d} onClick={() => setFilterDifficulty(d)} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize ${filterDifficulty === d ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500'}`}>
              {d}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500 ml-1">{filtered.length} questions</span>
      </div>

      {/* ── Question List + Detail Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Question List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((q) => {
            const catCfg = JUDGE_CATEGORY_CONFIG[q.category];
            const statusCfg = STATUS_CONFIG_QA[q.status];
            const diffCfg = DIFFICULTY_CONFIG[q.difficulty];
            const isExpanded = selectedId === q.id;
            return (
              <button
                key={q.id}
                onClick={() => setSelectedId(isExpanded ? null : q.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isExpanded ? 'bg-slate-900 border-violet-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${diffCfg.badge}`}>{diffCfg.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${statusCfg.badge}`}>{statusCfg.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{catCfg.icon} {catCfg.label}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 leading-relaxed line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{q.askedBy}</span>
                      <span>·</span>
                      <span>{q.city}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" />{q.upvotes}</span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
                {/* Tags */}
                {isExpanded && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-800">
                    {q.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[9px] font-mono text-violet-300">#{tag}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">No questions match filters</div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="min-h-0">
          {selected ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden sticky top-24">
              {/* Detail Header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-violet-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Question Detail</h3>
                    <span className="text-[9px] font-mono text-slate-500">{selected.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <span className="text-lg">×</span>
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
                {/* Status & Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${STATUS_CONFIG_QA[selected.status]?.badge || ''}`}>{STATUS_CONFIG_QA[selected.status]?.label?.toUpperCase() || selected.status.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${DIFFICULTY_CONFIG[selected.difficulty]?.badge || ''}`}>{DIFFICULTY_CONFIG[selected.difficulty]?.label}</span>
                </div>

                {/* Question */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-violet-400 font-bold uppercase">
                    <MessageSquare className="w-2.5 h-2.5" /> Question
                  </div>
                  <p className="text-[11px] font-mono text-slate-200 leading-relaxed">{selected.question}</p>
                  {selected.relatedRoad && (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                      <span>Road:</span>
                      <span className="text-violet-300">{selected.relatedRoad}</span>
                    </div>
                  )}
                </div>

                {/* Asked By */}
                <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-200 font-bold block">{selected.askedBy}</span>
                    <span className="text-[9px] font-mono text-slate-500">{selected.designation}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[9px] font-mono text-violet-300">#{tag}</span>
                  ))}
                </div>

                {/* Solution */}
                {solution ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold uppercase">
                        <Brain className="w-2.5 h-2.5" /> AI-Generated Solution
                      </div>
                      <p className="text-[10px] font-mono text-slate-300 leading-relaxed">{solution.answer}</p>
                      <div className="flex items-center gap-3 text-[9px] font-mono pt-1 border-t border-emerald-500/20">
                        <span className="text-slate-500">Confidence: <span className="text-emerald-400 font-bold">{solution.confidence}%</span></span>
                        <span className="text-slate-500">By: <span className="text-slate-300">{solution.answeredBy}</span></span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      {solution.keyMetrics.map((m) => {
                        const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
                        const trendColor = m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-400';
                        return (
                          <div key={m.label} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                            <span className="text-[8px] font-mono text-slate-500 block">{m.label}</span>
                            <span className="text-sm font-bold text-slate-100 font-mono">{m.value}</span>
                            <TrendIcon className={`w-2.5 h-2.5 inline ml-1 ${trendColor}`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-violet-400 font-bold uppercase flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Recommendations
                      </span>
                      {solution.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[9px] font-mono text-violet-400 font-bold mt-0.5 shrink-0">{idx + 1}.</span>
                          <p className="text-[10px] font-mono text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>

                    {/* Data Sources */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" /> Data Sources
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {solution.dataSources.map((src, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[9px] font-mono text-violet-300">{src}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center space-y-1">
                    <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                    <span className="text-[10px] font-mono text-amber-300 font-bold block">
                      {selected.status === 'pending' ? 'Awaiting AI Analysis' : 'Solution Under Review'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">The BTIS intelligence engine is processing this query.</span>
                  </div>
                )}

                {/* Meta */}
                <div className="text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-800 space-y-0.5">
                  <div>Asked: <span className="text-slate-300">{selected.askedAt}</span></div>
                  {solution && <div>Answered: <span className="text-slate-300">{solution.answeredAt}</span></div>}
                  <div className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" /><span className="text-slate-300">{selected.upvotes} upvotes</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-center space-y-2 sticky top-24">
              <Scale className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-300">Select a Question</h4>
              <p className="text-[10px] text-slate-500 font-mono">Click any question to view the AI-generated solution and key metrics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
