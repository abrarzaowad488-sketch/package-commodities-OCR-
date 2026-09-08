import React, { useState } from 'react';
import { Inspection, Finding } from '../types';
import { Check, X, Edit2, AlertTriangle, CheckCircle2, HelpCircle, ChevronRight, Save } from 'lucide-react';

interface AnalysisViewProps {
  inspection: Inspection;
  onSave: (inspection: Inspection) => void;
  onViewReport: (inspection: Inspection) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ inspection, onSave, onViewReport }) => {
  const [currentInspection, setCurrentInspection] = useState<Inspection>(inspection);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(inspection.findings[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [remark, setRemark] = useState('');

  const handleUpdateFinding = (findingId: string, updates: Partial<Finding>) => {
    setCurrentInspection(prev => ({
      ...prev,
      findings: prev.findings.map(f => f.id === findingId ? { ...f, ...updates } : f)
    }));
    
    if (selectedFinding?.id === findingId) {
      setSelectedFinding(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleConfirm = () => {
    if (!selectedFinding) return;
    handleUpdateFinding(selectedFinding.id, { 
      verificationStatus: 'confirmed',
      inspectorRemark: remark || undefined
    });
    setRemark('');
  };

  const handleEdit = () => {
    if (!selectedFinding) return;
    handleUpdateFinding(selectedFinding.id, {
      detectedValue: editValue,
      status: 'detected',
      verificationStatus: 'edited',
      inspectorRemark: remark || undefined
    });
    setIsEditing(false);
    setRemark('');
  };

  const handleDismiss = () => {
    if (!selectedFinding) return;
    handleUpdateFinding(selectedFinding.id, {
      verificationStatus: 'dismissed',
      inspectorRemark: remark || undefined
    });
    setRemark('');
  };

  const handleSaveAndReport = () => {
    // Recalculate status based on verified findings
    const verifiedFindings = currentInspection.findings;
    const hasUnresolvedIssues = verifiedFindings.some(f => 
      (f.status === 'not_detected' || f.status === 'unclear') && 
      f.verificationStatus !== 'dismissed'
    );
    
    const finalInspection = {
      ...currentInspection,
      status: hasUnresolvedIssues ? 'Potential Issue' as const : 'Compliant' as const
    };
    
    onSave(finalInspection);
    onViewReport(finalInspection);
  };

  const allVerified = currentInspection.findings.every(f => f.verificationStatus !== 'pending');

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {currentInspection.isMock && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Demo Data Active (API Rate Limit Exceeded)</p>
            <p className="text-xs mt-0.5">You have made too many API requests recently. The application is currently displaying realistic mock data so you can continue testing the interface. Wait a few minutes to resume real AI analysis.</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
        {/* Left panel: Findings List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Extracted Declarations</h3>
          <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
            {currentInspection.findings.filter(f => f.verificationStatus !== 'pending').length} / {currentInspection.findings.length} Verified
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {currentInspection.findings.map(finding => (
            <div 
              key={finding.id}
              onClick={() => setSelectedFinding(finding)}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                selectedFinding?.id === finding.id 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-gray-900">{finding.label}</span>
                {finding.verificationStatus !== 'pending' ? (
                  <CheckCircle2 size={16} className="text-blue-600" />
                ) : finding.status === 'detected' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : finding.status === 'not_detected' ? (
                  <AlertTriangle size={16} className="text-red-500" />
                ) : (
                  <HelpCircle size={16} className="text-amber-500" />
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {finding.detectedValue || 'Not detected'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSaveAndReport}
            className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              allVerified 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Save size={18} />
            Generate Final Report
          </button>
        </div>
      </div>

      {/* Right panel: Finding Details & Evidence */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {selectedFinding ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedFinding.label}</h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      selectedFinding.status === 'detected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedFinding.status === 'not_detected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedFinding.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{selectedFinding.requirement}</p>
                  {selectedFinding.officialRule && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded p-3 text-xs text-blue-800">
                      <span className="font-bold flex items-center gap-1 mb-1">
                        <CheckCircle2 size={12} /> Official Act Reference:
                      </span>
                      {selectedFinding.officialRule}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Detected Value</h4>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">Save</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">Cancel</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center group">
                    <span className="text-lg font-medium text-gray-900">{selectedFinding.detectedValue || '—'}</span>
                    {selectedFinding.verificationStatus === 'pending' && (
                      <button 
                        onClick={() => {
                          setEditValue(selectedFinding.detectedValue || '');
                          setIsEditing(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Edit value"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedFinding.verificationStatus === 'pending' && !isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Remark (Optional)</label>
                    <input 
                      type="text" 
                      value={remark}
                      onChange={e => setRemark(e.target.value)}
                      placeholder="Add notes for the report..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleConfirm}
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check size={18} /> Confirm
                    </button>
                    {selectedFinding.status !== 'detected' && (
                      <button 
                        onClick={handleDismiss}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                      >
                        <X size={18} /> Dismiss Flag
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedFinding.verificationStatus !== 'pending' && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-blue-900 capitalize">Verified: {selectedFinding.verificationStatus}</h4>
                    {selectedFinding.inspectorRemark && (
                      <p className="text-sm text-blue-800 mt-1 italic">"{selectedFinding.inspectorRemark}"</p>
                    )}
                    <button 
                      onClick={() => handleUpdateFinding(selectedFinding.id, { verificationStatus: 'pending' })}
                      className="text-xs text-blue-600 underline mt-2 hover:text-blue-800 font-medium"
                    >
                      Undo verification
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-50 flex-1">
                <h3 className="font-semibold text-gray-900">Evidence from Document</h3>
                {selectedFinding.evidence ? (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-gray-800 font-medium">"{selectedFinding.evidence}"</p>
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Extracted via AI Analysis</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-4 italic">No explicit evidence found.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <CheckCircle2 size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Select a declaration</p>
            <p>Review the extracted information and verify its accuracy.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AnalysisView;
