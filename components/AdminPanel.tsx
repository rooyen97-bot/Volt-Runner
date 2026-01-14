
import React, { useState, useRef } from 'react';
import { Question, HighScore } from '../types';
import { generateNewQuestions } from '../services/geminiService';
import { INITIAL_QUESTIONS } from '../constants';

interface AdminPanelProps {
  courseQuestions: Record<string, Question[]>;
  setCourseQuestions: (cq: Record<string, Question[]>) => void;
  availableClasses: string[];
  setAvailableClasses: (c: string[]) => void;
  highScores: HighScore[];
  setHighScores: (h: HighScore[]) => void;
  onClose: () => void;
}

interface ExcelDraft {
  text: string;
  options: string[];
  correctIndex: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  courseQuestions, 
  setCourseQuestions, 
  availableClasses, 
  setAvailableClasses, 
  highScores, 
  setHighScores, 
  onClose 
}) => {
  const [topic, setTopic] = useState('');
  const [newClass, setNewClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(availableClasses[0] || '');
  const [loading, setLoading] = useState(false);
  
  // Excel Import State
  const editorRef = useRef<HTMLDivElement>(null);
  const [excelDrafts, setExcelDrafts] = useState<ExcelDraft[]>([]);

  // Manual Question Form State
  const [manualQ, setManualQ] = useState({
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: ''
  });

  const currentQuestions = courseQuestions[selectedCourse] || [];

  const updateCurrentQuestions = (newQs: Question[]) => {
    setCourseQuestions({
      ...courseQuestions,
      [selectedCourse]: newQs
    });
  };

  const handleExcelParse = () => {
    if (!editorRef.current) return;
    
    // Vi läser HTML för att hitta <b> eller <strong> taggar
    const html = editorRef.current.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Hantera tabeller (vanligt vid paste från Excel) eller rader (div/p)
    const rows: string[][] = [];
    const table = tempDiv.querySelector('table');
    
    if (table) {
      table.querySelectorAll('tr').forEach(tr => {
        const cells: string[] = [];
        tr.querySelectorAll('td').forEach(td => {
          // Kolla om cellen innehåller fetstil
          const isBold = td.querySelector('b, strong') || td.style.fontWeight === 'bold';
          cells.push(isBold ? `__BOLD__${td.innerText}` : td.innerText);
        });
        if (cells.length > 0) rows.push(cells);
      });
    } else {
      // Fallback: Splitta på rader om det inte är en tabell
      const textRows = editorRef.current.innerText.split(/\n/).filter(r => r.trim());
      textRows.forEach(row => {
        const cells = row.split(/\t/).map(c => c.trim());
        rows.push(cells);
      });
    }

    const drafts: ExcelDraft[] = rows.map(cells => {
      const questionText = cells[0]?.replace('__BOLD__', '') || 'Fråga saknas';
      const options = cells.slice(1, 5).map(c => c.replace('__BOLD__', ''));
      
      // Hitta vilken kolumn som hade __BOLD__ markören
      let correctIdx = 0;
      cells.slice(1, 5).forEach((c, i) => {
        if (c.startsWith('__BOLD__')) correctIdx = i;
      });

      return {
        text: questionText,
        options: options.length > 0 ? options : ['Alternativ A', 'Alternativ B', 'Alternativ C', 'Alternativ D'],
        correctIndex: correctIdx
      };
    }).filter(d => d.text !== 'Fråga saknas');

    setExcelDrafts(drafts);
  };

  const handleSaveExcelDrafts = () => {
    if (!selectedCourse) return;
    const newQuestions: Question[] = excelDrafts.map((d, i) => ({
      id: (Date.now() + i).toString(),
      text: d.text,
      options: d.options,
      correctIndex: d.correctIndex,
      explanation: 'Importerad från kalkylblad.'
    }));
    updateCurrentQuestions([...currentQuestions, ...newQuestions]);
    setExcelDrafts([]);
    if (editorRef.current) editorRef.current.innerHTML = '';
    alert(`${newQuestions.length} frågor sparade till ${selectedCourse}!`);
  };

  const handleAIAdd = async () => {
    if (!topic || !selectedCourse) return;
    setLoading(true);
    const newQs = await generateNewQuestions(topic);
    if (newQs && newQs.length > 0) {
      updateCurrentQuestions([...currentQuestions, ...newQs]);
      alert(`${newQs.length} nya frågor genererade för ${selectedCourse}!`);
      setTopic('');
    }
    setLoading(false);
  };

  // Add missing handleExport to fix the reference error on line 385.
  const handleExport = () => {
    if (!selectedCourse) return;
    const questions = courseQuestions[selectedCourse] || [];
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frågor_${selectedCourse}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddManualQuestion = () => {
    if (!manualQ.text || manualQ.options.some(opt => !opt) || !manualQ.explanation) {
      alert('Vänligen fyll i alla fält för frågan!');
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: manualQ.text,
      options: [...manualQ.options],
      correctIndex: manualQ.correctIndex,
      explanation: manualQ.explanation
    };

    updateCurrentQuestions([...currentQuestions, newQuestion]);
    
    setManualQ({
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    });
    alert('Frågan har lagts till!');
  };

  const handleAddClass = () => {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (availableClasses.includes(trimmed)) {
      alert('Klassen/kursen finns redan!');
      return;
    }
    setAvailableClasses([...availableClasses, trimmed]);
    setNewClass('');
    if (!selectedCourse) setSelectedCourse(trimmed);
  };

  const handleRemoveClass = (className: string) => {
    if (confirm(`Vill du verkligen ta bort "${className}"? Detta tar även bort alla frågor som är kopplade till denna kurs.`)) {
      const newClasses = availableClasses.filter(c => c !== className);
      setAvailableClasses(newClasses);
      if (selectedCourse === className) {
        setSelectedCourse(newClasses[0] || '');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] overflow-y-auto p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Lärarkontroll <span className="text-sky-500">Panel</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mt-1">Administrationsläge för Volt Runner</p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-slate-800 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-black transition-all border border-slate-700 hover:border-red-400 active:scale-95 uppercase tracking-widest text-sm"
          >
            Stäng Admin
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Klasshantering */}
          <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-xl lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">🏫</div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Kurser</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Skapa ny kurs</label>
                <div className="flex gap-2">
                  <input 
                    value={newClass} 
                    onChange={e => setNewClass(e.target.value)}
                    placeholder="T.ex. Ellära 1" 
                    className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 font-bold text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                  />
                  <button onClick={handleAddClass} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black transition-all shadow-lg text-xs">LÄGG TILL</button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-slate-700 rounded-2xl p-2 bg-slate-950/50">
                {availableClasses.map(c => (
                  <div key={c} className={`flex justify-between items-center p-3 rounded-xl transition group mb-1 ${selectedCourse === c ? 'bg-sky-500/10 border border-sky-500/30' : 'hover:bg-slate-800/50'}`}>
                    <span className={`font-bold text-sm ${selectedCourse === c ? 'text-sky-400' : 'text-slate-300'}`}>{c}</span>
                    <div className="flex items-center gap-1">
                       <button onClick={() => setSelectedCourse(c)} className={`text-[10px] font-black uppercase px-2 py-1 rounded ${selectedCourse === c ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-white'}`}>Välj</button>
                       <button onClick={() => handleRemoveClass(c)} className="text-red-500/30 hover:text-red-500 p-1 transition rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Excel Import & AI & Manual */}
          <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-xl lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center text-sky-400">📝</div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  Hantera: <span className="text-sky-400 underline">{selectedCourse || 'Välj kurs'}</span>
                </h2>
              </div>
            </div>

            {!selectedCourse ? (
              <p className="text-slate-500 italic text-center py-20">Välj en kurs till vänster för att börja lägga till frågor.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Excel Bulk Import */}
                <div className="space-y-4 bg-green-900/10 p-5 rounded-2xl border border-green-500/20">
                  <h3 className="text-xs font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-lg">📊</span> Kalkylblad Import
                  </h3>
                  <div className="relative">
                    <div 
                      ref={editorRef}
                      contentEditable
                      onInput={() => {}}
                      className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none font-bold text-[10px] h-32 overflow-y-auto leading-tight"
                    />
                    {!editorRef.current?.innerText && (
                      <div className="absolute top-3 left-3 pointer-events-none opacity-40 text-[9px] text-slate-400">
                        Klistra in celler från Excel.<br/>
                        Systemet känner av <b>fetstil</b> som rätt svar automatiskt!
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleExcelParse}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95"
                  >
                    LÄS IN TABELL
                  </button>

                  {excelDrafts.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-green-500/30 max-h-64 overflow-y-auto">
                      <p className="text-[10px] text-green-400 font-black uppercase mb-2">Identifierade frågor ({excelDrafts.length}):</p>
                      {excelDrafts.map((draft, lineIdx) => (
                        <div key={lineIdx} className="mb-4 pb-2 border-b border-slate-700 last:border-0">
                          <p className="text-white text-[10px] font-bold mb-1">{lineIdx+1}. {draft.text}</p>
                          <div className="flex gap-2">
                            {draft.options.map((opt, optIdx) => (
                              <label key={optIdx} className="flex flex-col items-center gap-1 cursor-pointer">
                                <span className={`text-[8px] font-bold ${draft.correctIndex === optIdx ? 'text-green-400' : 'text-slate-500'}`}>
                                  {String.fromCharCode(65+optIdx)}
                                </span>
                                <input 
                                  type="radio" 
                                  name={`correct-excel-${lineIdx}`}
                                  checked={draft.correctIndex === optIdx}
                                  onChange={() => {
                                    const newDrafts = [...excelDrafts];
                                    newDrafts[lineIdx].correctIndex = optIdx;
                                    setExcelDrafts(newDrafts);
                                  }}
                                  className="w-3 h-3 accent-green-500"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={handleSaveExcelDrafts}
                        className="w-full bg-green-500 text-white py-2 rounded-lg font-black text-[10px] mt-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      >
                        SPARA ALLA FRÅGOR
                      </button>
                    </div>
                  )}
                </div>

                {/* Manuellt formulär */}
                <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50">
                  <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-lg">✍️</span> Manuell Fråga
                  </h3>
                  <textarea 
                    value={manualQ.text}
                    onChange={e => setManualQ({...manualQ, text: e.target.value})}
                    placeholder="Frågetext..."
                    className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-sky-500 focus:outline-none font-bold text-xs h-16 resize-none"
                  />
                  <div className="space-y-1">
                    {manualQ.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input 
                          type="radio" 
                          name="correct-manual" 
                          checked={manualQ.correctIndex === i}
                          onChange={() => setManualQ({...manualQ, correctIndex: i})}
                          className="w-3 h-3 accent-sky-500"
                        />
                        <input 
                          value={opt}
                          onChange={e => {
                            const newOpts = [...manualQ.options];
                            newOpts[i] = e.target.value;
                            setManualQ({...manualQ, options: newOpts});
                          }}
                          placeholder={`${String.fromCharCode(65+i)}...`}
                          className="flex-1 bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 text-[10px] font-bold"
                        />
                      </div>
                    ))}
                  </div>
                  <input 
                    value={manualQ.explanation}
                    onChange={e => setManualQ({...manualQ, explanation: e.target.value})}
                    placeholder="Kort förklaring..."
                    className="w-full bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 text-[10px] font-bold"
                  />
                  <button 
                    onClick={handleAddManualQuestion}
                    className="w-full bg-sky-600 text-white py-2 rounded-xl font-black text-xs"
                  >
                    LÄGG TILL
                  </button>
                </div>

                {/* AI Generering */}
                <div className="space-y-4 bg-purple-900/10 p-5 rounded-2xl border border-purple-500/20">
                  <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-lg">🤖</span> AI Generera
                  </h3>
                  <input 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Ämne: t.ex. 'Transformatorer'" 
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none font-bold text-xs mb-3"
                  />
                  <button 
                    onClick={handleAIAdd} 
                    disabled={loading || !topic} 
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-black text-xs disabled:opacity-30 transition-all active:scale-95"
                  >
                    {loading ? 'AI TÄNKER...' : 'SKAPA 5 FRÅGOR'}
                  </button>
                  <div className="pt-4 border-t border-slate-700 flex gap-2">
                    <button onClick={handleExport} className="flex-1 text-[8px] bg-slate-700 text-white p-2 rounded">EXPORT JSON</button>
                    <label htmlFor="import-file" className="flex-1 text-[8px] bg-slate-700 text-white p-2 rounded text-center cursor-pointer">IMPORT JSON</label>
                    <input id="import-file" type="file" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedCourse) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target?.result as string);
                          updateCurrentQuestions(data);
                          alert(`Frågebank för ${selectedCourse} importerad!`);
                        } catch (err) { alert('Felaktigt filformat.'); }
                      };
                      reader.readAsText(file);
                    }} className="hidden" />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Frågelista för den valda kursen */}
        {selectedCourse && (
          <div className="mb-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Frågor i <span className="text-sky-500">{selectedCourse}</span></h2>
              <div className="flex gap-4 items-center">
                 <button onClick={() => { if(confirm('Vill du rensa listan?')) updateCurrentQuestions([]) }} className="text-[10px] font-black text-red-500 uppercase border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition">Rensa allt</button>
                 <span className="text-slate-500 text-xs font-black uppercase tracking-widest">{currentQuestions.length} frågor totalt</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentQuestions.map((q, idx) => (
                <div key={q.id} className="bg-slate-800/30 border border-slate-700 p-5 rounded-2xl flex justify-between items-start group hover:border-sky-500/50 transition-all relative overflow-hidden">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-slate-700 text-white px-2 py-1 rounded text-[10px] font-black">{idx + 1}</span>
                      <p className="text-white font-bold text-sm leading-snug">{q.text}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-2 rounded-lg text-[10px] truncate ${i === q.correctIndex ? 'bg-green-500/10 border border-green-500/30 text-green-400 font-bold' : 'bg-slate-900/30 text-slate-500 border border-transparent'}`}>
                          {String.fromCharCode(65+i)}) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => updateCurrentQuestions(currentQuestions.filter(item => item.id !== q.id))}
                    className="absolute top-4 right-4 text-red-500/30 hover:text-red-500 transition-all p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
