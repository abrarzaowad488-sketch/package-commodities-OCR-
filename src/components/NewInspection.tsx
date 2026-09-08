import React, { useState, useRef } from 'react';
import { Inspection, AIExtractionResult, Finding, LEGAL_REQUIREMENTS, InspectionInput } from '../types';
import { Upload, X, FileText, Type as TypeIcon, Loader2 } from 'lucide-react';

interface NewInspectionProps {
  onAnalysisComplete: (inspection: Inspection) => void;
}

const NewInspection: React.FC<NewInspectionProps> = ({ onAnalysisComplete }) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Food & Beverage');
  const [inputs, setInputs] = useState<InspectionInput[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Food & Beverage',
    'Cosmetics & Personal Care',
    'Electronics',
    'Household Goods',
    'Apparel & Textiles',
    'Other'
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setInputs(prev => [...prev, { type: 'image', url: result }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setInputs(prev => [...prev, { type: 'pdf', name: file.name, url: result }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      setInputs(prev => [...prev, { type: 'text', content: textInput.trim() }]);
      setTextInput('');
      setIsTextModalOpen(false);
    }
  };

  const removeInput = (index: number) => {
    setInputs(prev => prev.filter((_, i) => i !== index));
  };

  const generateFindings = (aiResult: AIExtractionResult): Finding[] => {
    const findings: Finding[] = [];
    const extractedData = aiResult.extractedData || {};

    Object.entries(LEGAL_REQUIREMENTS).forEach(([field, requirement], index) => {
      const data = extractedData[field as keyof typeof extractedData];
      let status: Finding['status'] = 'not_detected';
      
      if (data && data.value) {
        if (data.is_compliant === false) {
           status = 'not_detected'; // AI explicitly marked as non-compliant based on rules
        } else {
           status = 'detected'; // Found and compliant
        }
      } else if (data && data.confidence > 0.5 && !data.value) {
        status = 'not_detected';
      } else {
        status = 'unclear';
      }

      findings.push({
        id: `f-${Date.now()}-${index}`,
        field,
        label: field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        detectedValue: data?.value || null,
        status,
        requirement,
        officialRule: data?.official_rule || null,
        evidence: data?.evidence || null,
        verificationStatus: 'pending'
      });
    });

    return findings;
  };

  const determineStatus = (findings: Finding[]): Inspection['status'] => {
    const hasNotDetected = findings.some(f => f.status === 'not_detected');
    const hasUnclear = findings.some(f => f.status === 'unclear');

    if (hasNotDetected) return 'Potential Issue';
    if (hasUnclear) return 'Needs Review';
    return 'Compliant';
  };

  const handleStartAnalysis = async () => {
    if (inputs.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const payloadInputs = inputs.map(input => {
        if (input.type === 'image' || input.type === 'pdf') {
          const result = (input as any).url as string;
          const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
          const base64 = result.substring(result.indexOf(',') + 1);
          return { type: input.type, data: base64, mimeType };
        } else {
          return { type: 'text', data: input.content };
        }
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: payloadInputs })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Analysis failed');
      }
      
      const aiResult: AIExtractionResult = responseData;
      
      if (!aiResult.extractedData) {
        throw new Error('No data could be extracted from the provided inputs.');
      }
      
      const findings = generateFindings(aiResult);
      const status = determineStatus(findings);
      
      const newInspection: Inspection = {
        id: `INS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        date: new Date().toISOString(),
        productName: productName || 'Unnamed Product',
        category,
        status,
        inputs,
        findings,
        isMock: aiResult.isMock
      };

      if (aiResult.isMock) {
        alert("Notice: The API Rate Limit was exceeded. The analysis is currently using mock fallback data so you can test the UI.");
      }

      onAnalysisComplete(newInspection);
    } catch (error: any) {
      console.error('Error during analysis:', error);
      setAnalysisError(error.message || 'Failed to analyze inputs. Please check the files and try again.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">New Inspection</h2>
          <p className="text-gray-500 mt-1">Upload packaging images, PDFs, or enter text for automated compliance analysis.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Product Name (Optional)</label>
              <input 
                type="text" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Acme Premium Rice"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Evidences (Images, PDF, Text)</label>
              <span className="text-xs text-gray-500">Provide product details</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inputs.map((input, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border-2 border-gray-200 overflow-hidden group bg-gray-50 flex items-center justify-center p-2">
                  {input.type === 'image' && (
                    <img src={input.url} alt={`Upload ${idx}`} className="w-full h-full object-cover rounded-md" />
                  )}
                  {input.type === 'pdf' && (
                    <div className="text-center">
                      <FileText size={32} className="mx-auto text-blue-500 mb-2" />
                      <span className="text-xs text-gray-600 truncate block max-w-full px-1">{input.name}</span>
                    </div>
                  )}
                  {input.type === 'text' && (
                    <div className="text-left w-full h-full">
                      <span className="text-[10px] text-gray-600 line-clamp-6 leading-tight break-words">{input.content}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeInput(idx)}
                      className="bg-white text-red-600 p-2 rounded-full hover:scale-110 transition-transform shadow-lg"
                      title="Remove"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Upload size={24} className="mb-2" />
                <span className="text-sm font-medium">Add Image</span>
              </button>

              <button 
                onClick={() => pdfInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <FileText size={24} className="mb-2" />
                <span className="text-sm font-medium">Add PDF</span>
              </button>

              <button 
                onClick={() => setIsTextModalOpen(true)}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <TypeIcon size={24} className="mb-2" />
                <span className="text-sm font-medium">Add Text</span>
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              multiple 
              accept="image/*"
            />
            <input 
              type="file" 
              ref={pdfInputRef} 
              onChange={handlePdfChange} 
              className="hidden" 
              multiple 
              accept="application/pdf"
            />
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={handleStartAnalysis}
            disabled={inputs.length === 0 || isAnalyzing}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all shadow-sm ${
              inputs.length === 0 || isAnalyzing 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing Inputs...
              </>
            ) : (
              <>
                Start Analysis
              </>
            )}
          </button>
        </div>
      </div>
      
      {isAnalyzing && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full border border-gray-100">
            <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Data</h3>
            <p className="text-gray-500 text-center text-sm">
              Extracting declarations and checking against Legal Metrology Rules, 2011. This may take a moment.
            </p>
            
            <div className="w-full bg-gray-100 rounded-full h-2 mt-8 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] w-3/4"></div>
            </div>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full border border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <X size={24} className="bg-red-100 rounded-full p-1" />
              <h3 className="text-lg font-bold">Analysis Failed</h3>
            </div>
            <p className="text-gray-700 text-sm mb-6">{analysisError}</p>
            <button 
              onClick={() => setAnalysisError(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Text Detail</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste or type product information here..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setIsTextModalOpen(false); setTextInput(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInspection;
