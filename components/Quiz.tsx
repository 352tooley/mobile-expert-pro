
import React, { useState, useEffect } from 'react';
import { Question, User, UserRole, District, Store } from '../types';
import { StorageService } from '../services/storage';

interface QuizProps {
  user: User;
  onFinish: () => void;
}

const Quiz: React.FC<QuizProps> = ({ user, onFinish }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const allQuestions = StorageService.getQuestions();
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 10));
    setDistricts(StorageService.getDistricts());
    setStores(StorageService.getStores());
  }, []);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) score++;
    });

    const store = stores.find(s => s.id === user.storeId);
    const district = districts.find(d => d.id === user.districtId);

    StorageService.addResult({
      userId: user.id,
      userName: user.name,
      storeName: store?.name || 'Unknown',
      storeId: user.storeId,
      districtName: district?.name || 'Unknown',
      districtId: user.districtId,
      score,
      total: questions.length,
      timestamp: Date.now(),
    });

    setQuizFinished(true);
  };

  if (questions.length === 0) return <div className="text-center p-10 text-magenta font-bold">Initializing Quiz...</div>;

  if (quizFinished) {
    const score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctIndex ? 1 : 0), 0);
    const percent = Math.round((score / questions.length) * 100);

    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-xl text-center border border-gray-100">
        <div className={`inline-block p-4 rounded-full mb-6 ${percent >= 80 ? 'bg-green-100 text-green-600' : 'bg-magenta-light text-magenta'}`}>
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 mb-6">Great effort, {user.name}!</p>
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="text-5xl font-extrabold text-magenta mb-1">{percent}%</div>
          <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">Score</div>
          <div className="mt-4 text-gray-700">
            You got <span className="font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span> correct.
          </div>
        </div>
        <button
          onClick={onFinish}
          className="w-full bg-magenta text-white font-bold py-3 rounded-lg hover:bg-magenta-hover transition-all shadow-lg"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Expert Quiz</h2>
          <p className="text-sm text-gray-500">Commissions & Policy</p>
        </div>
        <div className="bg-magenta-light text-magenta px-3 py-1 rounded-full text-xs font-bold border border-magenta/10">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-magenta h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-bold mb-8 text-gray-800 leading-relaxed">{q.text}</h3>
        <div className="space-y-4">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                answers[currentIndex] === i
                  ? 'border-magenta bg-magenta-light ring-2 ring-magenta/5'
                  : 'border-gray-100 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <span className={`font-medium ${answers[currentIndex] === i ? 'text-magenta font-bold' : 'text-gray-700'}`}>{opt}</span>
              {answers[currentIndex] === i && (
                <div className="bg-magenta rounded-full p-1 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          Back
        </button>
        <button
          onClick={goToNext}
          disabled={answers[currentIndex] === undefined}
          className="flex-1 bg-magenta text-white font-bold py-3 rounded-lg hover:bg-magenta-hover disabled:opacity-50 transition-all shadow-md"
        >
          {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
