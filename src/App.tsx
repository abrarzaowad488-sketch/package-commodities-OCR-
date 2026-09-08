import React, { useState, useEffect } from 'react';
import { Inspection } from './types';
import Dashboard from './components/Dashboard';
import NewInspection from './components/NewInspection';
import AnalysisView from './components/AnalysisView';
import ReportView from './components/ReportView';
import HistoryView from './components/HistoryView';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'new' | 'analysis' | 'report' | 'history'>('dashboard');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  
  // Fetch history from database on load
  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInspections(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleStartInspection = () => {
    setCurrentView('new');
  };

  const handleAnalysisComplete = (inspection: Inspection) => {
    setCurrentInspection(inspection);
    setCurrentView('analysis');
  };

  const handleSaveInspection = async (inspection: Inspection) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspection)
      });
      // Update local state
      setInspections(prev => {
        const existing = prev.findIndex(i => i.id === inspection.id);
        if (existing >= 0) {
          const newArray = [...prev];
          newArray[existing] = inspection;
          return newArray;
        }
        return [inspection, ...prev];
      });
    } catch (e) {
      console.error("Failed to save to database:", e);
    }
    setCurrentView('dashboard');
  };

  const handleViewReport = (inspection: Inspection) => {
    setCurrentInspection(inspection);
    setCurrentView('report');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="bg-blue-600 text-white p-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Legal Metrology</h1>
            <p className="text-xs text-gray-500 font-medium">COMPLIANCE PLATFORM</p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button 
            className={`hover:text-blue-600 transition-colors ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-600'}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`hover:text-blue-600 transition-colors ${currentView === 'history' ? 'text-blue-600' : 'text-gray-600'}`}
            onClick={() => setCurrentView('history')}
          >
            History Database
          </button>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleStartInspection}
          >
            New Inspection
          </button>
        </nav>
      </header>
      
      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard 
            inspections={inspections} 
            onNewInspection={handleStartInspection}
            onViewInspection={handleViewReport} 
          />
        )}
        {currentView === 'history' && (
          <HistoryView 
            inspections={inspections} 
            onViewInspection={handleViewReport} 
          />
        )}
        {currentView === 'new' && (
          <NewInspection onAnalysisComplete={handleAnalysisComplete} />
        )}
        {currentView === 'analysis' && currentInspection && (
          <AnalysisView 
            inspection={currentInspection} 
            onSave={handleSaveInspection}
            onViewReport={(ins) => {
              handleSaveInspection(ins).then(() => handleViewReport(ins));
            }}
          />
        )}
        {currentView === 'report' && currentInspection && (
          <ReportView 
            inspection={currentInspection} 
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
