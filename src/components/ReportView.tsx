import React from 'react';
import { Inspection } from '../types';
import { ArrowLeft, Download, CheckCircle2, AlertTriangle, FileText, Printer } from 'lucide-react';

interface ReportViewProps {
  inspection: Inspection;
  onBack: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ inspection, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const detectedCount = inspection.findings.filter(f => f.status === 'detected').length;
  const issueCount = inspection.findings.filter(f => f.status === 'not_detected').length;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      {inspection.isMock && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-3 mb-6 print:hidden">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Demo Data Report</p>
            <p className="text-xs mt-0.5">This report was generated using fallback mock data due to API rate limits.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden print:shadow-none print:border-none print:w-full">
        {/* Report Header */}
        <div className="bg-gray-900 text-white p-8 border-b-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Legal Metrology Inspection Report</h1>
              <p className="text-gray-400">Department of Consumer Affairs, Government of India Framework</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">{inspection.id}</div>
              <div className="text-gray-400 text-sm mt-1">{new Date(inspection.date).toLocaleDateString()} {new Date(inspection.date).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Summary Banner */}
        <div className={`p-6 border-b border-gray-200 flex items-center justify-between ${
          inspection.status === 'Compliant' ? 'bg-emerald-50' : 
          inspection.status === 'Needs Review' ? 'bg-amber-50' : 'bg-red-50'
        }`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Overall Assessment</h3>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              inspection.status === 'Compliant' ? 'text-emerald-700' : 
              inspection.status === 'Needs Review' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {inspection.status === 'Compliant' && <CheckCircle2 size={28} />}
              {inspection.status === 'Needs Review' && <AlertTriangle size={28} />}
              {inspection.status === 'Potential Issue' && <AlertTriangle size={28} />}
              {inspection.status.toUpperCase()}
            </div>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">{detectedCount}</div>
              <div className="text-xs uppercase font-bold text-gray-500 mt-1 tracking-wider">Detected</div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${issueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{issueCount}</div>
              <div className="text-xs uppercase font-bold text-gray-500 mt-1 tracking-wider">Issues</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Product Details */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-400" />
              Product Information
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Product Name</span>
                <span className="font-medium text-gray-900">{inspection.productName}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Category</span>
                <span className="font-medium text-gray-900">{inspection.category}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Inspector</span>
                <span className="font-medium text-gray-900">System Admin</span>
              </div>
            </div>
          </div>

          {/* Detailed Findings */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-gray-400" />
              Mandatory Declarations
            </h3>
            
            <div className="space-y-6">
              {inspection.findings.map(finding => (
                <div key={finding.id} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900">{finding.label}</h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      finding.status === 'detected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      finding.status === 'not_detected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {finding.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-1">Detected Value:</span>
                      <span className="font-medium text-gray-900">{finding.detectedValue || 'Not detected'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Verification:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {finding.verificationStatus} 
                        {finding.inspectorRemark && <span className="italic text-gray-500 block">"{finding.inspectorRemark}"</span>}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-bold">Legal Requirement</span>
                    <p className="text-sm text-gray-600">{finding.requirement}</p>
                    
                    {finding.officialRule && (
                      <div className="mt-3 bg-blue-50/50 border border-blue-100 p-3 rounded text-sm text-blue-900">
                        <span className="font-bold flex items-center gap-1 mb-1">
                          <CheckCircle2 size={14} className="text-blue-600" /> Grounded Official Rule Reference:
                        </span>
                        <span className="italic">{finding.officialRule}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>This report is generated by an AI-assisted compliance tool. It does not replace formal legal advice or official laboratory testing.</p>
            <p className="mt-1">Generated by Legal Metrology Compliance Prototype • {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
