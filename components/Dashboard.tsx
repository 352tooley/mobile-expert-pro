
import React, { useState, useEffect } from 'react';
import { QuizResult, User, UserRole, District, Store, HuntResponse } from '../types';
import { StorageService } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [huntResponses, setHuntResponses] = useState<HuntResponse[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [view, setView] = useState<'quizzes' | 'hunt'>('quizzes');

  useEffect(() => {
    setResults(StorageService.getResults());
    setHuntResponses(StorageService.getHuntResponses());
    setDistricts(StorageService.getDistricts());
    setStores(StorageService.getStores());
  }, []);

  const isExpert = user.role === UserRole.EXPERT;
  const isRAM = user.role === UserRole.RAM;
  const isRSM = user.role === UserRole.RSM;
  const isDM = user.role === UserRole.DM;
  const isRD = user.role === UserRole.RD;

  // Leadership can see Hunt responses
  const canReviewHunt = [UserRole.RAM, UserRole.RSM, UserRole.DM, UserRole.RD].includes(user.role);

  const filteredResults = results.filter(r => {
    if (isExpert) return r.userId === user.id;
    if (isRAM) return r.storeId === user.storeId || r.userId === user.id;
    if (isRSM) return true;
    if (isDM) return r.districtId === user.districtId;
    if (isRD) return true;
    return false;
  }).filter(r => {
    if (filterDistrict && r.districtId !== filterDistrict) return false;
    if (filterStore && r.storeId !== filterStore) return false;
    return true;
  });

  const filteredHuntResponses = huntResponses.filter(r => {
    if (isExpert) return r.userId === user.id;
    if (isRAM) {
       const userProfile = StorageService.getUsers().find(u => u.id === r.userId);
       return userProfile?.storeId === user.storeId || r.userId === user.id;
    }
    if (isRSM) return true;
    if (isDM) {
       const userProfile = StorageService.getUsers().find(u => u.id === r.userId);
       return userProfile?.districtId === user.districtId;
    }
    if (isRD) return true;
    return false;
  });

  const avgScore = filteredResults.length > 0
    ? (filteredResults.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / filteredResults.length * 100).toFixed(1)
    : '0';

  const storeMetrics = stores
    .filter(s => {
       if (isDM) return s.districtId === user.districtId;
       if (filterDistrict) return s.districtId === filterDistrict;
       return true;
    })
    .map(s => {
      const storeResults = results.filter(r => r.storeId === s.id);
      const totalTaken = storeResults.length;
      const storeAvg = totalTaken > 0 
        ? (storeResults.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / totalTaken * 100).toFixed(1)
        : '0';
      return { ...s, avg: storeAvg, count: totalTaken };
    });

  const chartData = filteredResults.slice(0, 10).map(r => ({
    name: r.userName,
    score: (r.score / r.total) * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm max-w-sm mb-6">
        <button
          onClick={() => setView('quizzes')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            view === 'quizzes' ? 'bg-magenta text-white shadow-md' : 'text-gray-500 hover:text-magenta'
          }`}
        >
          Quiz Results
        </button>
        <button
          onClick={() => setView('hunt')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            view === 'hunt' ? 'bg-magenta text-white shadow-md' : 'text-gray-500 hover:text-magenta'
          }`}
        >
          Hunt the 5
        </button>
      </div>

      {view === 'quizzes' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center items-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
                {isExpert ? 'Personal Average' : 'Scope Average'}
              </p>
              <div className="text-4xl font-extrabold text-magenta">{avgScore}%</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center items-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Submissions</p>
              <div className="text-4xl font-extrabold text-magenta opacity-80">{filteredResults.length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center items-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Highest Score</p>
              <div className="text-4xl font-extrabold text-magenta">
                {filteredResults.length > 0 ? Math.max(...filteredResults.map(r => Math.round((r.score/r.total)*100))) : 0}%
              </div>
            </div>
          </div>

          {(isDM || isRD || isRSM) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 bg-magenta-light border-b border-magenta/10 flex justify-between items-center">
                <h3 className="font-bold text-magenta">Store Performance (District View)</h3>
                {isRD && (
                   <select
                     className="text-xs border border-magenta/20 rounded-lg px-2 py-1 outline-none"
                     value={filterDistrict}
                     onChange={e => setFilterDistrict(e.target.value)}
                   >
                     <option value="">All Districts</option>
                     {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="px-6 py-3">Store Name</th>
                      <th className="px-6 py-3">Avg. Score</th>
                      <th className="px-6 py-3">Quizzes Taken</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {storeMetrics.map(s => (
                      <tr key={s.id} className="hover:bg-magenta-light/10">
                        <td className="px-6 py-4 font-medium">{s.name}</td>
                        <td className="px-6 py-4 font-bold text-magenta">{s.avg}%</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{s.count}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${Number(s.avg) >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {Number(s.avg) >= 80 ? 'QUALIFIED' : 'BELOW PAR'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 bg-magenta-light border-b border-magenta/10 flex justify-between items-center">
              <h3 className="font-bold text-magenta">Detailed Transcripts</h3>
              {(isRSM || isDM || isRD) && (
                 <select
                   className="text-xs border border-magenta/20 rounded-lg px-2 py-1 outline-none"
                   value={filterStore}
                   onChange={e => setFilterStore(e.target.value)}
                 >
                   <option value="">All Regions</option>
                   {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Expert</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Store</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map(r => (
                    <tr key={r.id} className="hover:bg-magenta-light/20">
                      <td className="px-6 py-4 font-medium">{r.userName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.storeName}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${r.score / r.total >= 0.8 ? 'text-green-600' : 'text-magenta'}`}>
                          {Math.round((r.score / r.total) * 100)}%
                        </span>
                        <span className="text-xs text-gray-400 ml-1">({r.score}/{r.total})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-right">
                        {new Date(r.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No transcripts available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'hunt' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">"Hunt the 5" Strategy Log</h3>
          {filteredHuntResponses.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed text-center text-gray-400">
              No strategies have been logged yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHuntResponses.map(r => (
                <div key={r.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-magenta">{r.scenarioTitle}</h4>
                      <p className="text-xs text-gray-500">{r.userName} • {r.storeName}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">
                      {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {r.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
