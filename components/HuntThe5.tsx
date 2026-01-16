
import React, { useState, useEffect, useRef } from 'react';
import { User, HuntScenario, AccountRow, UserRole, ChatMessage } from '../types';
import { StorageService } from '../services/storage';
import { GoogleGenAI, Type } from "@google/genai";

interface HuntThe5Props {
  user: User;
  onFinish: () => void;
}

const HuntThe5: React.FC<HuntThe5Props> = ({ user, onFinish }) => {
  const [mode, setMode] = useState<'select' | 'expert-play' | 'leader-create'>('select');
  const [scenarios, setScenarios] = useState<HuntScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<HuntScenario | null>(null);
  
  // Expert Discovery State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [enteredPhone, setEnteredPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  
  // UI Control States
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<'customer' | 'builder'>('customer');
  
  const [proposedData, setProposedData] = useState<AccountRow[]>([]);
  const [expertSolution, setExpertSolution] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [offerFeedback, setOfferFeedback] = useState<string | null>(null);
  const [isCheckingOffer, setIsCheckingOffer] = useState(false);

  // Leader Builder State
  const [builderChat, setBuilderChat] = useState<ChatMessage[]>([
    { role: 'model', parts: [{ text: "Hello, Leader. I'll help you build a 'Hunt the 5' training scenario. First, describe the customer's current plan and their main frustration today." }] }
  ]);
  const [builderInput, setBuilderInput] = useState('');
  const [isBuilderLoading, setIsBuilderLoading] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState<HuntScenario | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScenarios(StorageService.getAllScenarios());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, builderChat, isChatMinimized]);

  // Initialize proposed data when scenario is selected
  useEffect(() => {
    if (selectedScenario) {
      setProposedData(JSON.parse(JSON.stringify(selectedScenario.accountData)));
      setOfferFeedback(null);
      setIsPhoneVerified(false);
      setEnteredPhone('');
      setPhoneError(false);
      setChatMode('customer');
      setIsChatMinimized(false);
      setChatHistory([{ role: 'model', parts: [{ text: "Hi there! I'm here to talk about my bill. It's getting a bit high..." }] }]);
    }
  }, [selectedScenario]);

  const calculateRowTotal = (row: AccountRow) => {
    const mrc = typeof row.mrc === 'number' ? row.mrc : 0;
    const apDiscount = row.autopay === 'Yes' ? 5 : 0;
    return mrc - row.discount + row.features + row.eip - row.devicePromo - apDiscount;
  };

  const calculateGrandTotals = (data: AccountRow[]) => {
    return data.reduce((acc, row) => {
      acc.mrc += typeof row.mrc === 'number' ? row.mrc : 0;
      acc.discount += row.discount;
      acc.features += row.features;
      acc.eip += row.eip;
      acc.devicePromo += row.devicePromo;
      acc.apDiscount += (row.autopay === 'Yes' ? 5 : 0);
      acc.total += calculateRowTotal(row);
      return acc;
    }, { mrc: 0, discount: 0, features: 0, eip: 0, devicePromo: 0, apDiscount: 0, total: 0 });
  };

  const handleExpertChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedScenario || isAiResponding) return;

    const newMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);
    setUserInput('');
    setIsAiResponding(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const customerInstruction = `You are a T-Mobile customer visiting a retail store. 
          SCENARIO: ${selectedScenario.description}
          ACCOUNT: ${JSON.stringify(selectedScenario.accountData)}
          YOUR PHONE: ${selectedScenario.phoneNumber}
          
          RULES:
          1. Act like a casual, slightly stressed customer.
          2. YOU MUST REVEAL YOUR PHONE NUMBER (${selectedScenario.phoneNumber}) ONLY IF ASKED.
          3. Mention business or family growth if prompted.`;

      const coachInstruction = `You are the Pricing Coach. Help the Expert fill out the "Proposed Offer" grid.
          
          GOAL: Guide the Expert through adding 5 lines.
          
          INSTRUCTIONS:
          1. Use the provided tools (updateOfferLine, addOfferLine, removeOfferLine, clearGrid) to modify the grid.
          2. IMPORTANT: When the Expert provides details for new lines, ASK: "Should I replace your current plan lines with these new details, or just add them to what's already there?"
          3. If they say "replace", use 'clearGrid' or 'removeOfferLine' to clean up old lines before adding new ones.
          4. If they say "add", just use 'addOfferLine'.
          5. Help them verify the math, including the AutoPay (AP) column which gives a -$5 discount per line when 'Yes' is selected.`;

      const coachTools = [
        {
          functionDeclarations: [
            {
              name: 'updateOfferLine',
              parameters: {
                type: Type.OBJECT,
                description: 'Update a specific line in the proposed offer grid.',
                properties: {
                  index: { type: Type.NUMBER, description: 'The 0-based index of the line to update.' },
                  ratePlan: { type: Type.STRING },
                  mrc: { type: Type.STRING, description: 'Monthly Recurring Charge (number as string or "Included")' },
                  discount: { type: Type.NUMBER },
                  features: { type: Type.NUMBER },
                  eip: { type: Type.NUMBER },
                  devicePromo: { type: Type.NUMBER },
                  autopay: { type: Type.STRING, enum: ['Yes', 'No'] }
                },
                required: ['index']
              },
            },
            {
              name: 'addOfferLine',
              parameters: {
                type: Type.OBJECT,
                description: 'Add a new line to the proposed offer grid.',
                properties: {
                  ratePlan: { type: Type.STRING },
                  mrc: { type: Type.STRING },
                  discount: { type: Type.NUMBER },
                  features: { type: Type.NUMBER },
                  eip: { type: Type.NUMBER },
                  devicePromo: { type: Type.NUMBER },
                  autopay: { type: Type.STRING, enum: ['Yes', 'No'] }
                }
              }
            },
            {
              name: 'removeOfferLine',
              parameters: {
                type: Type.OBJECT,
                description: 'Remove a specific line from the proposed offer grid.',
                properties: {
                  index: { type: Type.NUMBER, description: 'The 0-based index of the line to remove.' }
                },
                required: ['index']
              }
            },
            {
              name: 'clearGrid',
              parameters: {
                type: Type.OBJECT,
                description: 'Clears all lines from the proposed offer grid to start fresh.',
                properties: {}
              }
            }
          ]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: updatedHistory,
        config: { 
          systemInstruction: chatMode === 'customer' ? customerInstruction : coachInstruction,
          tools: chatMode === 'builder' ? coachTools : undefined
        }
      });

      const nextHistory = [...updatedHistory];

      if (response.functionCalls) {
        let gridChanged = false;
        let newProposedData = [...proposedData];
        
        for (const call of response.functionCalls) {
          if (call.name === 'updateOfferLine') {
            const { index, ...updates } = call.args as any;
            if (newProposedData[index]) {
              const formattedUpdates = { ...updates };
              if (updates.mrc !== undefined) {
                formattedUpdates.mrc = updates.mrc === 'Included' ? 'Included' : Number(updates.mrc);
              }
              newProposedData[index] = { ...newProposedData[index], ...formattedUpdates };
              gridChanged = true;
            }
          } else if (call.name === 'addOfferLine') {
            const args = call.args as any;
            const newLine: AccountRow = {
              ratePlan: args.ratePlan || `Line ${newProposedData.length + 1}`,
              mrc: args.mrc === 'Included' ? 'Included' : (Number(args.mrc) || 35),
              discount: Number(args.discount) || 0,
              features: Number(args.features) || 0,
              eip: Number(args.eip) || 0,
              devicePromo: Number(args.devicePromo) || 0,
              autopay: args.autopay || 'Yes'
            };
            newProposedData.push(newLine);
            gridChanged = true;
          } else if (call.name === 'removeOfferLine') {
            const { index } = call.args as any;
            if (newProposedData[index]) {
              newProposedData.splice(index, 1);
              gridChanged = true;
            }
          } else if (call.name === 'clearGrid') {
            newProposedData = [];
            gridChanged = true;
          }
        }

        if (gridChanged) {
          setProposedData(newProposedData);
        }
      }

      nextHistory.push({ role: 'model', parts: [{ text: response.text || "I've updated the grid per your details." }] });
      setChatHistory(nextHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePhoneVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEntered = enteredPhone.replace(/\D/g, '');
    const cleanScenario = (selectedScenario?.phoneNumber || '').replace(/\D/g, '');
    
    if (cleanEntered === cleanScenario) {
      setIsPhoneVerified(true);
      setPhoneError(false);
      setIsChatMinimized(true);
    } else {
      setPhoneError(true);
    }
  };

  const checkOfferWithAi = async () => {
    if (!selectedScenario || isCheckingOffer) return;
    setIsCheckingOffer(true);
    setOfferFeedback(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentTotals = calculateGrandTotals(selectedScenario.accountData);
      const proposedTotals = calculateGrandTotals(proposedData);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this T-Mobile offer. Current: $${currentTotals.total.toFixed(2)}, Proposed: $${proposedTotals.total.toFixed(2)}. Details: ${JSON.stringify(proposedData)}. Provide a 2-sentence expert critique on the PRICING GRID accuracy.`,
      });

      setOfferFeedback(response.text || "Pricing grid looks reasonable.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingOffer(false);
    }
  };

  const handleFinishExpert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertSolution.trim()) return;

    StorageService.addHuntResponse({
      userId: user.id,
      userName: user.name,
      scenarioTitle: selectedScenario!.title,
      solution: `GRID: ${JSON.stringify(proposedData)}\n\nSTRATEGY: ${expertSolution}`,
      timestamp: Date.now(),
      storeName: StorageService.getStores().find(s => s.id === user.storeId)?.name || 'Unknown'
    });

    setIsSubmitted(true);
  };

  const addLineToProposal = () => {
    const nextLineNum = proposedData.length + 1;
    const newLine: AccountRow = {
      ratePlan: `Go5G Plus (Line ${nextLineNum})`,
      mrc: 35,
      discount: 0,
      features: 18,
      eip: 35,
      devicePromo: 35,
      autopay: 'Yes'
    };
    setProposedData([...proposedData, newLine]);
  };

  const updateProposedLine = (index: number, field: keyof AccountRow, value: any) => {
    const updated = [...proposedData];
    updated[index] = { ...updated[index], [field]: value };
    setProposedData(updated);
  };

  const removeProposedLine = (index: number) => {
    if (proposedData.length <= 1) return;
    setProposedData(proposedData.filter((_, i) => i !== index));
  };

  const handleBuilderChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderInput.trim() || isBuilderLoading) return;

    const newMessage: ChatMessage = { role: 'user', parts: [{ text: builderInput }] };
    const updatedHistory = [...builderChat, newMessage];
    setBuilderChat(updatedHistory);
    setBuilderInput('');
    setIsBuilderLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: updatedHistory,
        config: { systemInstruction: "Help the leader build a T-Mobile 'Hunt the 5' scenario." }
      });

      const text = response.text || '';
      setBuilderChat([...updatedHistory, { role: 'model', parts: [{ text }] }]);

      const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"SCENARIO_READY"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          setGeneratedScenario({
            id: Math.random().toString(36).substr(2, 9),
            title: data.title,
            description: data.description,
            phoneNumber: data.phoneNumber,
            accountData: data.accountData,
            aiInstructions: data.aiInstructions,
            createdBy: user.name,
            isCustom: true
          });
        } catch (e) { console.error(e); }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuilderLoading(false);
    }
  };

  const saveGeneratedScenario = () => {
    if (!generatedScenario) return;
    StorageService.addCustomScenario(generatedScenario);
    setScenarios(StorageService.getAllScenarios());
    setMode('select');
    setGeneratedScenario(null);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-xl text-center border border-gray-100">
        <div className="inline-block p-4 rounded-full mb-6 bg-green-100 text-green-600">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Growth Solution Logged!</h2>
        <p className="text-gray-500 mb-8">Your strategy and pricing have been saved.</p>
        <button onClick={onFinish} className="w-full bg-magenta text-white font-bold py-3 rounded-lg hover:bg-magenta-hover transition-all">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 pb-10">
      {mode === 'select' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Hunt The 5</h2>
              <p className="text-sm text-gray-500 italic">Master the art of account growth.</p>
            </div>
            {(user.role === UserRole.DM || user.role === UserRole.RSM || user.role === UserRole.RD) && (
              <button onClick={() => setMode('leader-create')} className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-magenta transition-colors">+ Custom Scenario</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(s => (
              <button key={s.id} onClick={() => { setSelectedScenario(s); setMode('expert-play'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:border-magenta hover:shadow-md transition-all group">
                <h4 className="font-bold text-gray-800 group-hover:text-magenta">{s.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">"{s.description}"</p>
                <div className="flex items-center text-[10px] font-bold text-magenta uppercase mt-3">Enter Scenario <span className="ml-1">→</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'expert-play' && selectedScenario && (
        <div className="relative">
          {/* Dashboard Area */}
          <div className={`transition-all duration-300 ${isChatMinimized ? 'w-full' : 'lg:pr-[380px]'}`}>
            {!isPhoneVerified ? (
              <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 bg-magenta-light text-magenta rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg">📱</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Customer Lookup Required</h3>
                <p className="text-sm text-gray-500 max-sm mb-8">Ask the customer for their phone number in the discovery chat to unlock the account details.</p>
                <form onSubmit={handlePhoneVerification} className="w-full max-w-xs space-y-4">
                  <input type="text" placeholder="Enter Phone Number" className={`w-full bg-gray-50 border ${phoneError ? 'border-red-500 animate-shake' : 'border-gray-200'} rounded-2xl px-6 py-4 text-lg font-bold text-center focus:ring-2 focus:ring-magenta outline-none`} value={enteredPhone} onChange={e => setEnteredPhone(e.target.value)} />
                  <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-magenta transition-all">Lookup Account</button>
                </form>
              </div>
            ) : (
              <div className="space-y-6 pb-24">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                  <h4 className="text-[11px] font-black text-magenta uppercase tracking-widest mb-4">Account Audit: {selectedScenario.phoneNumber}</h4>
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full border-collapse text-[10px] min-w-[750px]">
                      <thead>
                        <tr className="bg-gray-800 text-white uppercase">
                          <th className="px-3 py-3 text-left">Rate Plan</th>
                          <th className="px-3 py-3 text-center">MRC</th>
                          <th className="px-3 py-3 text-center">Disc.</th>
                          <th className="px-3 py-3 text-center">Feat.</th>
                          <th className="px-3 py-3 text-center">EIP</th>
                          <th className="px-3 py-3 text-center">Promo</th>
                          <th className="px-3 py-3 text-center">AP Disc</th>
                          <th className="px-3 py-3 text-right bg-magenta text-white">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedScenario.accountData.map((row, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-3 py-4 font-bold">{row.ratePlan}</td>
                            <td className="px-3 py-4 text-center">{typeof row.mrc === 'number' ? row.mrc.toFixed(2) : row.mrc}</td>
                            <td className="px-3 py-4 text-center text-red-500">{(i !== 0 && row.discount > 0) ? `-${row.discount.toFixed(2)}` : '-'}</td>
                            <td className="px-3 py-4 text-center text-gray-400">{row.features > 0 ? row.features.toFixed(2) : '-'}</td>
                            <td className="px-3 py-4 text-center text-gray-400">{row.eip > 0 ? row.eip.toFixed(2) : '-'}</td>
                            <td className="px-3 py-4 text-center text-green-600 font-bold">{row.devicePromo > 0 ? `-${row.devicePromo.toFixed(2)}` : '-'}</td>
                            <td className="px-3 py-4 text-center text-magenta font-black">{row.autopay === 'Yes' ? '-5.00' : '0'}</td>
                            <td className="px-3 py-4 text-right font-black text-magenta/40">${calculateRowTotal(row).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-900 text-white font-bold">
                        <tr>
                          <td className="px-3 py-4 text-right uppercase" colSpan={7}>Current Audit Total:</td>
                          <td className="px-3 py-4 text-right bg-gray-700 font-black">${calculateGrandTotals(selectedScenario.accountData).total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-2xl border border-magenta/20">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[11px] font-black text-magenta uppercase tracking-widest">The Proposed Growth Offer</h4>
                    <div className="flex space-x-2">
                      <button onClick={checkOfferWithAi} className="text-[10px] bg-black text-white font-black px-4 py-1.5 rounded-full hover:bg-magenta transition-all">✨ Coach Review</button>
                      <button onClick={addLineToProposal} className="text-[10px] bg-magenta text-white font-black px-4 py-1.5 rounded-full">+ Line</button>
                    </div>
                  </div>
                  {offerFeedback && <div className="mb-4 bg-magenta-light p-4 rounded-2xl border border-magenta/10"><p className="text-[10px] font-black text-magenta uppercase mb-1 italic">Growth Coach Advice:</p><p className="text-xs text-gray-800 leading-relaxed">"{offerFeedback}"</p></div>}
                  <div className="overflow-x-auto rounded-2xl border border-magenta/10">
                    <table className="w-full border-collapse text-[10px] min-w-[900px]">
                      <thead>
                        <tr className="bg-black text-white uppercase">
                          <th className="px-3 py-4 text-left">Rate Plan</th>
                          <th className="px-3 py-4 text-center">MRC</th>
                          <th className="px-3 py-4 text-center">Disc.</th>
                          <th className="px-3 py-4 text-center">Feat.</th>
                          <th className="px-3 py-4 text-center">EIP</th>
                          <th className="px-3 py-4 text-center">Promo</th>
                          <th className="px-3 py-4 text-center">AP?</th>
                          <th className="px-3 py-4 text-center">AP Disc</th>
                          <th className="px-3 py-4 text-right bg-magenta text-white">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {proposedData.map((row, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-1 py-1"><input className="w-full bg-magenta-light/30 border-0 text-[10px] font-bold p-3 rounded-xl" value={row.ratePlan} onChange={e => updateProposedLine(i, 'ratePlan', e.target.value)} /></td>
                            <td className="px-1 py-1"><input className="w-full bg-gray-50 border-0 text-center text-[10px] font-black p-3 rounded-xl" value={row.mrc} onChange={e => updateProposedLine(i, 'mrc', e.target.value === 'Included' ? 'Included' : Number(e.target.value))} /></td>
                            <td className="px-1 py-1"><input className="w-full bg-gray-50 border-0 text-center text-[10px] font-black p-3 rounded-xl text-red-500" value={row.discount} onChange={e => updateProposedLine(i, 'discount', Number(e.target.value))} /></td>
                            <td className="px-1 py-1"><input className="w-full bg-gray-50 border-0 text-center text-[10px] p-3 rounded-xl" value={row.features} onChange={e => updateProposedLine(i, 'features', Number(e.target.value))} /></td>
                            <td className="px-1 py-1"><input className="w-full bg-gray-50 border-0 text-center text-[10px] p-3 rounded-xl" value={row.eip} onChange={e => updateProposedLine(i, 'eip', Number(e.target.value))} /></td>
                            <td className="px-1 py-1"><input className="w-full bg-gray-50 border-0 text-center text-[10px] font-black p-3 rounded-xl text-green-600" value={row.devicePromo} onChange={e => updateProposedLine(i, 'devicePromo', Number(e.target.value))} /></td>
                            <td className="px-1 py-1"><select className="w-full bg-gray-50 border-0 text-center text-[9px] font-bold p-3 rounded-xl" value={row.autopay} onChange={e => updateProposedLine(i, 'autopay', e.target.value as 'Yes' | 'No')}><option value="Yes">Yes</option><option value="No">No</option></select></td>
                            <td className="px-3 py-1 text-center font-black text-magenta">{row.autopay === 'Yes' ? '-5.00' : '0'}</td>
                            <td className="px-3 py-1 text-right font-black text-magenta bg-magenta/5">${calculateRowTotal(row).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-magenta text-white font-black">
                        <tr>
                          <td className="px-3 py-5 text-right uppercase" colSpan={8}>Proposed Total:</td>
                          <td className="px-3 py-5 text-right bg-magenta-hover text-lg shadow-inner">${calculateGrandTotals(proposedData).total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex justify-between items-center"><span className="text-[11px] font-black text-gray-500 uppercase">Growth</span><span className="text-2xl font-black text-magenta">+{proposedData.length - selectedScenario.accountData.length} Lines</span></div>
                    <div className="bg-magenta-light p-5 rounded-2xl border border-magenta/10 flex justify-between items-center"><span className="text-[11px] font-black text-magenta uppercase">Bill Change</span><span className={`text-2xl font-black ${calculateGrandTotals(proposedData).total <= calculateGrandTotals(selectedScenario.accountData).total ? 'text-green-600' : 'text-gray-900'}`}>${(calculateGrandTotals(proposedData).total - calculateGrandTotals(selectedScenario.accountData).total).toFixed(2)}</span></div>
                  </div>
                </div>

                <form onSubmit={handleFinishExpert} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-5">
                   <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Strategy Rationale:</label>
                   <textarea required rows={3} className="w-full border border-gray-100 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-magenta outline-none bg-gray-50" placeholder="Describe your discovery wins..." value={expertSolution} onChange={e => setExpertSolution(e.target.value)} />
                   <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                    <button type="button" onClick={() => {setIsPhoneVerified(false); setEnteredPhone('');}} className="flex-1 bg-white border border-gray-200 text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-50">Logout Account</button>
                    <button type="submit" className="flex-[2] bg-magenta text-white font-black py-4 rounded-2xl hover:bg-magenta-hover shadow-xl">Submit Strategy</button>
                   </div>
                </form>
              </div>
            )}
          </div>

          {/* Floating Discovery Window */}
          <div className={`fixed bottom-0 right-0 lg:bottom-4 lg:right-4 z-50 transition-all duration-300 ease-in-out ${isChatMinimized ? 'w-16 h-16 rounded-full overflow-hidden' : 'w-full lg:w-[360px] h-[600px] rounded-t-3xl lg:rounded-3xl shadow-2xl overflow-hidden'}`}>
            {isChatMinimized ? (
              <button onClick={() => setIsChatMinimized(false)} className="w-full h-full bg-magenta text-white flex items-center justify-center rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform"><span className="text-2xl">💬</span></button>
            ) : (
              <div className="w-full h-full bg-white flex flex-col border border-gray-200">
                <div className="bg-magenta p-4 text-white flex justify-between items-center shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-bold text-xs tracking-tight">{chatMode === 'customer' ? 'Customer Mode' : 'Pricing Coach Mode'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        const nextMode = chatMode === 'customer' ? 'builder' : 'customer';
                        setChatMode(nextMode);
                        setChatHistory([...chatHistory, { role: 'model', parts: [{ text: nextMode === 'customer' ? "Back to talking to the customer. Ask for the phone number if you haven't yet!" : "I'm your Pricing Coach. I can modify the table for you. Tell me what plan and lines you want to add, and let me know if we're replacing the existing lines or just adding to them!" }] }]);
                      }}
                      className="text-[9px] font-black px-2 py-1 rounded-full border border-white hover:bg-white hover:text-magenta transition-colors"
                    >
                      SWITCH MODE
                    </button>
                    <button onClick={() => setIsChatMinimized(true)} className="p-1 hover:bg-magenta-hover rounded-lg transition-colors" title="Minimize Chat">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                   {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] ${msg.role === 'user' ? 'bg-magenta text-white rounded-tr-none shadow-md' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'}`}>{msg.parts[0].text}</div>
                    </div>
                  ))}
                  {isAiResponding && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl border border-gray-100 animate-pulse text-[10px] text-gray-400">Typing...</div></div>}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleExpertChat} className="p-4 bg-white border-t border-gray-100 flex space-x-2">
                  <input type="text" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-magenta outline-none shadow-inner" placeholder={chatMode === 'customer' ? "Ask the customer..." : "Tell the coach details..."} value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isAiResponding} />
                  <button disabled={isAiResponding || !userInput.trim()} className="bg-magenta text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'leader-create' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Scenario Architect</h3>
            <div className="h-[550px] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                  {builderChat.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white border shadow-sm'}`}>{msg.parts[0].text}</div></div>))}
                  <div ref={chatEndRef} />
               </div>
               <form onSubmit={handleBuilderChat} className="p-4 bg-white border-t"><input required className="w-full border rounded-xl px-4 py-3" value={builderInput} onChange={e => setBuilderInput(e.target.value)} placeholder="Answer..." /></form>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Preview</h3>
            {generatedScenario ? (
              <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-magenta/20">
                <h4 className="text-magenta font-black uppercase text-xl">{generatedScenario.title}</h4>
                <p className="text-sm italic mt-2">"{generatedScenario.description}"</p>
                <button onClick={saveGeneratedScenario} className="w-full mt-8 bg-magenta text-white font-black py-4 rounded-2xl">Publish Blueprint</button>
              </div>
            ) : <div className="h-[550px] border-4 border-dashed rounded-3xl flex items-center justify-center text-gray-300">Architecting...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default HuntThe5;
