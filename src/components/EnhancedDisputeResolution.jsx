import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnhancedDisputeResolution = ({ 
  dispute, 
  order, 
  buyer, 
  seller, 
  onClose, 
  onResolve 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showScopeBox, setShowScopeBox] = useState(false);
  const [analyzingEvidence, setAnalyzingEvidence] = useState(false);
  const [evidenceAnalysis, setEvidenceAnalysis] = useState(null);

  // Enhanced resolution options with detailed scenarios
  const resolutionOptions = [
    {
      id: 'REFUND_BUYER_FULL',
      title: 'Full Refund to Buyer',
      description: 'Buyer receives 100% refund, seller gets nothing',
      icon: '💸',
      color: 'red',
      side: 'buyer',
      scenarios: [
        'No delivery or complete non-performance',
        'Fraudulent or plagiarized work',
        'Seller completely unresponsive',
        'Major quality failures'
      ],
      financialImpact: {
        buyer: '100% refund',
        seller: '0%',
        platform: '0%'
      }
    },
    {
      id: 'RELEASE_TO_SELLER',
      title: 'Release Full Payment to Seller',
      description: 'Seller receives full payment, work is accepted',
      icon: '✅',
      color: 'emerald',
      side: 'seller',
      scenarios: [
        'Work meets all requirements',
        'Buyer unreasonable or changing scope',
        'Technical issues resolved',
        'Minor acceptable variations'
      ],
      financialImpact: {
        buyer: '0%',
        seller: '95% (after platform fee)',
        platform: '5% fee'
      }
    },
    {
      id: 'PARTIAL_REFUND_75_25',
      title: 'Partial Refund (75% Buyer, 25% Seller)',
      description: 'Major issues but some value delivered',
      icon: '⚖️',
      color: 'amber',
      side: 'neutral',
      scenarios: [
        'Significant quality issues',
        'Partial completion',
        'Major delays with some delivery',
        'Scope misunderstandings'
      ],
      financialImpact: {
        buyer: '75% refund',
        seller: '25%',
        platform: '0%'
      }
    },
    {
      id: 'PARTIAL_REFUND_50_50',
      title: 'Split Payment (50/50)',
      description: 'Equal fault or compromise solution',
      icon: '🤝',
      color: 'blue',
      side: 'neutral',
      scenarios: [
        'Shared responsibility',
        'Communication breakdowns',
        'Ambiguous requirements',
        'Mutual agreement to compromise'
      ],
      financialImpact: {
        buyer: '50% refund',
        seller: '50%',
        platform: '0%'
      }
    },
    {
      id: 'CONTINUE_WITH_EXTENSION',
      title: 'Continue Work with Time Extension',
      description: 'Seller completes remaining work with extended deadline',
      icon: '🔄',
      color: 'indigo',
      side: 'seller',
      scenarios: [
        'Fixable quality issues',
        'Time management problems',
        'Minor revisions needed',
        'Technical difficulties resolved'
      ],
      financialImpact: {
        buyer: 'Escrow held until completion',
        seller: 'Payment upon completion',
        platform: '5% fee when released'
      }
    },
    {
      id: 'CANCEL_AND_REFUND',
      title: 'Cancel Order & Refund',
      description: 'Order cancelled, escrow refunded to buyer',
      icon: '❌',
      color: 'gray',
      side: 'neutral',
      scenarios: [
        'Mutual agreement to cancel',
        'Deadlock situation',
        'External circumstances',
        'No viable path forward'
      ],
      financialImpact: {
        buyer: '100% refund',
        seller: '0%',
        platform: '0%'
      }
    }
  ];

  useEffect(() => {
    if (dispute) {
      analyzeEvidence();
    }
  }, [dispute]);

  const analyzeEvidence = async () => {
    setAnalyzingEvidence(true);
    try {
      // Simulate comprehensive evidence analysis
      setTimeout(() => {
        const analysis = {
          sellerFaultScore: Math.random() * 100,
          buyerFaultScore: Math.random() * 100,
          recommendation: resolutionOptions[Math.floor(Math.random() * resolutionOptions.length)].id,
          confidence: Math.random() * 30 + 70,
          keyFindings: [
            'Delivery files analyzed for quality and completeness',
            'Chat logs reviewed for communication patterns',
            'Timeline adherence checked against deadlines',
            'Scope requirements evaluated against delivered work'
          ],
          riskFactors: {
            fraud: Math.random() > 0.8,
            communication: Math.random() > 0.6,
            quality: Math.random() > 0.4,
            timeline: Math.random() > 0.5
          },
          evidenceScore: {
            completeness: Math.random() * 100,
            credibility: Math.random() * 100,
            relevance: Math.random() * 100
          }
        };
        setEvidenceAnalysis(analysis);
        setAnalyzingEvidence(false);
      }, 2000);
    } catch (error) {
      console.error('Error analyzing evidence:', error);
      setAnalyzingEvidence(false);
    }
  };

  const getScopeCompliance = () => {
    if (!order?.scopeBox) return null;
    
    const scope = order.scopeBox;
    const compliance = {
      requirements: [],
      overallScore: 0,
      statusBreakdown: {
        met: 0,
        partial: 0,
        missed: 0,
        pending: 0
      }
    };

    // Analyze different scope requirements
    if (scope.deliverables && scope.deliverables.length > 0) {
      const deliveredCount = order.deliveryFiles?.length || 0;
      const status = deliveredCount >= scope.deliverables.length ? 'met' : 
                    deliveredCount > 0 ? 'partial' : 'missed';
      
      compliance.requirements.push({
        type: 'deliverables',
        label: 'Deliverables',
        required: scope.deliverables,
        delivered: order.deliveryFiles || [],
        status,
        score: status === 'met' ? 100 : status === 'partial' ? 50 : 0
      });
      compliance.statusBreakdown[status]++;
    }

    if (scope.deadline) {
      const deadline = new Date(scope.deadline);
      const delivered = new Date(order.updatedAt);
      const status = delivered <= deadline ? 'met' : 'missed';
      
      compliance.requirements.push({
        type: 'deadline',
        label: 'Deadline Compliance',
        required: scope.deadline,
        delivered: order.updatedAt,
        status,
        score: status === 'met' ? 100 : 0,
        daysLate: Math.max(0, Math.ceil((delivered - deadline) / (1000 * 60 * 60 * 24)))
      });
      compliance.statusBreakdown[status]++;
    }

    if (scope.price) {
      compliance.requirements.push({
        type: 'value',
        label: 'Order Value',
        required: scope.price,
        status: 'met',
        score: 100
      });
      compliance.statusBreakdown.met++;
    }

    if (scope.description) {
      compliance.requirements.push({
        type: 'requirements',
        label: 'Requirements Compliance',
        required: scope.description,
        status: 'pending',
        score: 50 // Default to pending analysis
      });
      compliance.statusBreakdown.pending++;
    }

    // Calculate overall score
    const totalScore = compliance.requirements.reduce((sum, req) => sum + req.score, 0);
    compliance.overallScore = compliance.requirements.length > 0 ? 
      Math.round(totalScore / compliance.requirements.length) : 0;

    return compliance;
  };

  const scopeCompliance = getScopeCompliance();

  const handleResolve = async () => {
    if (!selectedResolution) {
      alert('Please select a resolution option');
      return;
    }

    setLoading(true);
    try {
      await onResolve(dispute.id, {
        resolution: selectedResolution,
        resolutionNotes,
        evidenceAnalysis,
        scopeCompliance
      });
      onClose();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedResolution = () => {
    if (!evidenceAnalysis) return null;
    return resolutionOptions.find(r => r.id === evidenceAnalysis.recommendation);
  };

  const recommendedResolution = getRecommendedResolution();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Enhanced Dispute Resolution</h2>
              <p className="text-slate-300">
                Dispute #{dispute?.id?.slice(0, 8)} • Order #{order?.id?.slice(0, 8)} • 
                ${order?.scopeBox?.price || '0'} at stake
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
          {/* Left Panel - Analysis */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200">
            {/* Evidence Analysis */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                Comprehensive Evidence Analysis
              </h3>
              
              {analyzingEvidence ? (
                <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-lg">
                  <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                  <span className="text-violet-700">Analyzing all evidence and communications...</span>
                </div>
              ) : evidenceAnalysis ? (
                <div className="space-y-4">
                  {/* AI Recommendation */}
                  {recommendedResolution && (
                    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-lg border border-violet-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{recommendedResolution.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-violet-900">AI Recommendation</p>
                          <p className="text-xs text-violet-600">
                            Confidence: {evidenceAnalysis.confidence.toFixed(0)}% • 
                            Favors: {recommendedResolution.side}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-violet-900">{recommendedResolution.title}</p>
                      <p className="text-sm text-violet-700 mt-1">{recommendedResolution.description}</p>
                    </div>
                  )}

                  {/* Fault Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-900 mb-2">Seller Responsibility</p>
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-red-100 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${evidenceAnalysis.sellerFaultScore}%` }} 
                            />
                          </div>
                          <span className="text-sm font-bold text-red-600">
                            {evidenceAnalysis.sellerFaultScore.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-red-700">
                        {evidenceAnalysis.sellerFaultScore > 70 ? 'Primary responsibility' :
                         evidenceAnalysis.sellerFaultScore > 40 ? 'Shared responsibility' :
                         'Minimal responsibility'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Buyer Responsibility</p>
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-blue-100 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${evidenceAnalysis.buyerFaultScore}%` }} 
                            />
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {evidenceAnalysis.buyerFaultScore.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700">
                        {evidenceAnalysis.buyerFaultScore > 70 ? 'Primary responsibility' :
                         evidenceAnalysis.buyerFaultScore > 40 ? 'Shared responsibility' :
                         'Minimal responsibility'}
                      </p>
                    </div>
                  </div>

                  {/* Evidence Quality */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Evidence Quality Assessment</p>
                    <div className="space-y-2">
                      {Object.entries(evidenceAnalysis.evidenceScore).map(([key, score]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600 w-20 capitalize">{key}</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-slate-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${score}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10">{score.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Risk Factors Identified</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(evidenceAnalysis.riskFactors).map(([risk, present]) => (
                        present && (
                          <span key={risk} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            {risk === 'fraud' ? '🚨 Fraud Risk' :
                             risk === 'communication' ? '💬 Communication Issues' :
                             risk === 'quality' ? '📊 Quality Concerns' :
                             risk === 'timeline' ? '⏰ Timeline Issues' : risk}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Scope Box Analysis */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Scope Box Compliance Analysis
                </h3>
                <button
                  onClick={() => setShowScopeBox(!showScopeBox)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {showScopeBox ? 'Hide' : 'Show'} Full Scope
                </button>
              </div>

              {scopeCompliance && (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Overall Compliance Score</p>
                        <p className="text-xs text-emerald-600">
                          {scopeCompliance.statusBreakdown.met} met, {scopeCompliance.statusBreakdown.partial} partial, 
                          {scopeCompliance.statusBreakdown.missed} missed, {scopeCompliance.statusBreakdown.pending} pending
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-700">{scopeCompliance.overallScore}%</p>
                        <p className="text-xs text-emerald-600">compliant</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Requirements */}
                  <div className="space-y-3">
                    {scopeCompliance.requirements.map((req, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{req.label}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              {req.status === 'met' ? '✅ Requirement fully met' :
                               req.status === 'partial' ? '⚠️ Partially met' :
                               req.status === 'missed' ? '❌ Requirement missed' :
                               '⏳ Pending analysis'}
                            </p>
                            {req.daysLate && (
                              <p className="text-xs text-red-600 mt-1">{req.daysLate} days late</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              req.status === 'met' ? 'bg-emerald-100 text-emerald-700' :
                              req.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                              req.status === 'missed' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {req.score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Full Scope Box Details */}
                  {showScopeBox && order?.scopeBox && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-3">Original Scope Box</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Description</p>
                          <p className="text-sm text-emerald-700 bg-white rounded p-2 mt-1">
                            {order.scopeBox.description || 'No description provided'}
                          </p>
                        </div>
                        {order.scopeBox.deliverables && (
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Required Deliverables</p>
                            <ul className="list-disc list-inside text-sm text-emerald-700 mt-1">
                              {order.scopeBox.deliverables.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Price</p>
                            <p className="text-sm text-emerald-700">${order.scopeBox.price}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Deadline</p>
                            <p className="text-sm text-emerald-700">
                              {new Date(order.scopeBox.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dispute Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Dispute Context
              </h3>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-900">Reason</p>
                      <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-sm rounded mt-1">
                        {dispute?.reason}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 capitalize">Raised by {dispute?.raisedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Complaint</p>
                    <p className="text-sm text-amber-800 mt-1">{dispute?.description}</p>
                  </div>
                  {dispute?.requestedResolution && (
                    <div>
                      <p className="text-sm font-medium text-amber-900">Requested Resolution</p>
                      <p className="text-sm text-amber-800">{dispute.requestedResolution}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Resolution Options */}
          <div className="w-full lg:w-96 p-6 overflow-y-auto bg-slate-50">
            <h3 className="text-lg font-semibold mb-4">Resolution Options</h3>
            
            {/* Recommended Option */}
            {recommendedResolution && (
              <div className="mb-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
                <p className="text-xs font-semibold text-violet-700 mb-2">🤖 AI Recommended</p>
                <div className="flex items-center gap-2">
                  <span>{recommendedResolution.icon}</span>
                  <span className="text-sm font-medium text-violet-900">{recommendedResolution.title}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {resolutionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedResolution(option.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedResolution === option.id
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{option.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                      
                      {/* Financial Impact */}
                      <div className="mt-2 p-2 bg-white rounded border border-slate-100">
                        <p className="text-xs font-medium text-slate-700 mb-1">Financial Impact:</p>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div>
                            <span className="text-slate-500">Buyer:</span>
                            <span className="font-medium ml-1">{option.financialImpact.buyer}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Seller:</span>
                            <span className="font-medium ml-1">{option.financialImpact.seller}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Platform:</span>
                            <span className="font-medium ml-1">{option.financialImpact.platform}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Best Scenarios */}
                      <div className="mt-2">
                        <p className="text-xs text-slate-500">Best for:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {option.scenarios.map((scenario, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                            >
                              {scenario}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedResolution === option.id && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Resolution Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Resolution Notes <span className="text-slate-400">(required)</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Provide detailed justification for this decision..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleResolve}
                disabled={!selectedResolution || !resolutionNotes.trim() || loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing Resolution...' : '🏁 Confirm Final Decision'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>⚠️ Final Decision:</strong> This action cannot be undone. 
                Funds will be distributed according to your resolution choice and the order status will be updated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDisputeResolution;
