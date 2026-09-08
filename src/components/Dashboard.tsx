import React from 'react';
import { Inspection } from '../types';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText, Plus, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  inspections: Inspection[];
  onNewInspection: () => void;
  onViewInspection: (inspection: Inspection) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inspections, onNewInspection, onViewInspection }) => {
  const compliantCount = inspections.filter(i => i.status === 'Compliant').length;
  const needsReviewCount = inspections.filter(i => i.status === 'Needs Review').length;
  const potentialIssueCount = inspections.filter(i => i.status === 'Potential Issue').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inspection Dashboard</h2>
          <p className="text-gray-500 mt-1">Overview of Legal Metrology compliance checks</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="https://consumeraffairs.gov.in/pages/legal-metrology-act" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
            title="Data grounded via Department of Consumer Affairs"
          >
            <ShieldCheck size={16} />
            <span className="font-medium hidden sm:inline">Official Source Rules</span>
          </a>
          <button 
            onClick={onNewInspection}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
          >
            <Plus size={18} />
            New Inspection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 font-medium mb-4 flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            Total Inspections
          </div>
          <div className="text-4xl font-bold">{inspections.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-emerald-600 font-medium mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} />
            Compliant
          </div>
          <div className="text-4xl font-bold">{compliantCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-amber-600 font-medium mb-4 flex items-center gap-2">
            <HelpCircle size={18} />
            Needs Review
          </div>
          <div className="text-4xl font-bold">{needsReviewCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
          <div className="text-red-600 font-medium mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            Potential Issues
          </div>
          <div className="text-4xl font-bold">{potentialIssueCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="font-semibold text-lg">Recent Inspections</h3>
        </div>
        
        {inspections.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">No inspections yet</p>
            <p>Start a new inspection to analyze packaged commodities.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspections.map(inspection => (
                  <tr 
                    key={inspection.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onViewInspection(inspection)}
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{inspection.id}</td>
                    <td className="px-6 py-4 font-medium">{inspection.productName}</td>
                    <td className="px-6 py-4 text-gray-500">{inspection.category}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(inspection.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        inspection.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inspection.status === 'Needs Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {inspection.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
