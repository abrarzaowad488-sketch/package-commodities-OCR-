import React from 'react';
import { Inspection } from '../types';
import { CheckCircle2, AlertTriangle, FileText, Calendar, Search } from 'lucide-react';

interface HistoryViewProps {
  inspections: Inspection[];
  onViewInspection: (inspection: Inspection) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ inspections, onViewInspection }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');

  const filtered = inspections.filter(ins => {
    const matchesSearch = ins.productName.toLowerCase().includes(searchTerm.toLowerCase()) || ins.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ins.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inspection History</h2>
          <p className="text-gray-500 mt-1">Database of all past compliance scans</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Product Name..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['All', 'Compliant', 'Needs Review', 'Potential Issue'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">No results found</p>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">Inspection ID</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Evidences</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(inspection => (
                  <tr 
                    key={inspection.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-600 font-medium">{inspection.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{inspection.productName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(inspection.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inspection.inputs.length} items</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        inspection.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inspection.status === 'Needs Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {inspection.status === 'Compliant' && <CheckCircle2 size={12} />}
                        {(inspection.status === 'Needs Review' || inspection.status === 'Potential Issue') && <AlertTriangle size={12} />}
                        {inspection.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewInspection(inspection)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        View Details
                      </button>
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

export default HistoryView;
