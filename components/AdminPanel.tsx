
import React, { useState, useEffect } from 'react';
import { User, UserRole, Question, District, Store } from '../types';
import { StorageService } from '../services/storage';

interface AdminPanelProps {
  user: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [view, setView] = useState<'roster' | 'quiz' | 'data'>('roster');
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState(UserRole.EXPERT);
  const [newUserStoreId, setNewUserStoreId] = useState('');

  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setQuestions(StorageService.getQuestions());
    setStores(StorageService.getStores());
    setDistricts(StorageService.getDistricts());
  };

  const canModifyRoster = [UserRole.RSM, UserRole.DM, UserRole.RD].includes(user.role);
  const canModifyQuiz = [UserRole.DM, UserRole.RD].includes(user.role);
  const canManageData = [UserRole.DM, UserRole.RD].includes(user.role);

  const visibleUsers = users.filter(u => {
    if (user.role === UserRole.RD) return true;
    if (user.role === UserRole.DM) return u.districtId === user.districtId;
    if (user.role === UserRole.RSM || user.role === UserRole.RAM) return u.storeId === user.storeId;
    return false;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyRoster) return;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserName,
      role: newUserRole,
      storeId: (user.role === UserRole.DM || user.role === UserRole.RD) ? newUserStoreId : user.storeId,
      districtId: (user.role === UserRole.DM || user.role === UserRole.RD) ? (stores.find(s => s.id === newUserStoreId)?.districtId || user.districtId) : user.districtId,
    };
    const updated = [...users, newUser];
    StorageService.saveUsers(updated);
    setUsers(updated);
    setNewUserName('');
  };

  const removeUser = (id: string) => {
    if (!canModifyRoster || id === user.id) return;
    const updated = users.filter(u => u.id !== id);
    StorageService.saveUsers(updated);
    setUsers(updated);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyQuiz) return;

    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQText,
      options: newQOptions,
      correctIndex: newQCorrect,
    };
    const updated = [...questions, newQ];
    StorageService.saveQuestions(updated);
    setQuestions(updated);
    setNewQText('');
    setNewQOptions(['', '', '', '']);
  };

  const removeQuestion = (id: string) => {
    if (!canModifyQuiz) return;
    const updated = questions.filter(q => q.id !== id);
    StorageService.saveQuestions(updated);
    setQuestions(updated);
  };

  const handleExport = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = StorageService.importAllData(result);
        if (success) {
          alert("Memory imported successfully! Reloading...");
          window.location.reload();
        } else {
          alert("Failed to import. Check file format.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide">
        {canModifyRoster && (
          <button
            onClick={() => setView('roster')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              view === 'roster' ? 'bg-magenta text-white shadow-md' : 'text-gray-500 hover:text-magenta'
            }`}
          >
            Roster
          </button>
        )}
        {canModifyQuiz && (
          <button
            onClick={() => setView('quiz')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              view === 'quiz' ? 'bg-magenta text-white shadow-md' : 'text-gray-500 hover:text-magenta'
            }`}
          >
            Curriculum
          </button>
        )}
        {canManageData && (
          <button
            onClick={() => setView('data')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              view === 'data' ? 'bg-magenta text-white shadow-md' : 'text-gray-500 hover:text-magenta'
            }`}
          >
            System Memory
          </button>
        )}
      </div>

      {view === 'roster' && canModifyRoster && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Add Employee</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                required
                placeholder="Full Name"
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-magenta outline-none"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
              />
              <select
                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-magenta outline-none"
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value as UserRole)}
              >
                <option value={UserRole.EXPERT}>Mobile Expert</option>
                <option value={UserRole.RAM}>RAM</option>
                <option value={UserRole.RSM}>RSM</option>
                {user.role === UserRole.DM || user.role === UserRole.RD ? <option value={UserRole.DM}>DM</option> : null}
              </select>
              {(user.role === UserRole.DM || user.role === UserRole.RD) && (
                <select
                  required
                  className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-magenta outline-none"
                  value={newUserStoreId}
                  onChange={e => setNewUserStoreId(e.target.value)}
                >
                  <option value="">Select Store</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button className="sm:col-span-3 bg-magenta text-white font-bold py-2 rounded-lg hover:bg-magenta-hover shadow-lg shadow-pink-100">
                Register Employee
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-magenta-light border-b border-magenta/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-magenta uppercase">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-magenta uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-magenta uppercase">Store</th>
                  <th className="px-6 py-4 text-xs font-bold text-magenta uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleUsers.map(u => (
                  <tr key={u.id} className="hover:bg-magenta-light/30">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {stores.find(s => s.id === u.storeId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeUser(u.id)}
                        disabled={u.id === user.id}
                        className="text-magenta hover:text-black font-bold text-xs disabled:opacity-30"
                      >
                        REMOVE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'quiz' && canModifyQuiz && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Add Curriculum Question</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <input
                required
                placeholder="Question (e.g. commission rate for Home Internet)"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-magenta outline-none"
                value={newQText}
                onChange={e => setNewQText(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newQOptions.map((opt, i) => (
                  <div key={i} className="flex space-x-2 items-center">
                    <input
                      type="radio"
                      name="correct"
                      checked={newQCorrect === i}
                      className="accent-magenta w-4 h-4"
                      onChange={() => setNewQCorrect(i)}
                    />
                    <input
                      required
                      placeholder={`Choice ${i + 1}`}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-magenta outline-none"
                      value={opt}
                      onChange={e => {
                        const next = [...newQOptions];
                        next[i] = e.target.value;
                        setNewQOptions(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <button className="w-full bg-magenta text-white font-bold py-2 rounded-lg hover:bg-magenta-hover">
                Commit to Question Pool
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 px-2 flex items-center">
              Active Question Pool
              <span className="ml-2 bg-magenta text-white text-[10px] px-2 py-0.5 rounded-full">{questions.length}</span>
            </h3>
            {questions.map(q => (
              <div key={q.id} className="bg-white p-5 rounded-xl shadow border border-gray-100 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-2">{q.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${i === q.correctIndex ? 'bg-magenta text-white font-bold' : 'bg-gray-100 text-gray-500'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-magenta hover:bg-magenta-light p-2 rounded-lg ml-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'data' && canManageData && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="mb-6 flex justify-center">
               <div className="w-16 h-16 bg-magenta-light text-magenta rounded-full flex items-center justify-center text-3xl">💾</div>
            </div>
            <h3 className="text-xl font-bold mb-2">System Memory Management</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
              This app saves data locally on your device. To share the roster, questions, or scenarios with other managers, export the system state and have them import it.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button 
                 onClick={handleExport}
                 className="bg-black text-white font-bold py-4 rounded-xl hover:bg-magenta transition-all flex flex-col items-center"
               >
                 <span className="text-xs uppercase tracking-widest opacity-60 mb-1">Backup</span>
                 <span>Export System Data</span>
               </button>
               
               <label className="bg-white border-2 border-magenta text-magenta font-bold py-4 rounded-xl hover:bg-magenta-light transition-all flex flex-col items-center cursor-pointer">
                 <span className="text-xs uppercase tracking-widest opacity-60 mb-1">Restore</span>
                 <span>Import System Data</span>
                 <input type="file" className="hidden" accept=".json" onChange={handleImport} />
               </label>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
               <button 
                 onClick={() => { if(confirm("This will PERMANENTLY delete all custom users, questions, and results. Proceed?")) StorageService.resetToDefaults(); }}
                 className="text-xs text-red-500 font-bold hover:underline"
               >
                 Factory Reset (Wipe All Data)
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
