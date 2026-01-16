
import { District, Store, User, Question, QuizResult, UserRole, HuntResponse, HuntScenario } from '../types';
import { INITIAL_DISTRICTS, INITIAL_STORES, INITIAL_USERS, INITIAL_QUESTIONS, HUNT_SCENARIOS } from '../constants';

const DB_KEYS = {
  DISTRICTS: 'mobile_pro_districts',
  STORES: 'mobile_pro_stores',
  USERS: 'mobile_pro_users',
  QUESTIONS: 'mobile_pro_questions',
  RESULTS: 'mobile_pro_results',
  HUNT_RESPONSES: 'mobile_pro_hunt_responses',
  CUSTOM_SCENARIOS: 'mobile_pro_custom_scenarios',
  INITIALIZED: 'mobile_pro_initialized'
};

const get = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const StorageService = {
  // Check if we need to seed the database
  init: () => {
    const isInit = localStorage.getItem(DB_KEYS.INITIALIZED);
    if (!isInit) {
      StorageService.saveDistricts(INITIAL_DISTRICTS);
      StorageService.saveStores(INITIAL_STORES);
      StorageService.saveUsers(INITIAL_USERS);
      StorageService.saveQuestions(INITIAL_QUESTIONS);
      StorageService.saveCustomScenarios([]);
      localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
    }
  },

  getDistricts: () => get<District[]>(DB_KEYS.DISTRICTS, INITIAL_DISTRICTS),
  getStores: () => get<Store[]>(DB_KEYS.STORES, INITIAL_STORES),
  getUsers: () => get<User[]>(DB_KEYS.USERS, INITIAL_USERS),
  getQuestions: () => get<Question[]>(DB_KEYS.QUESTIONS, INITIAL_QUESTIONS),
  getResults: () => get<QuizResult[]>(DB_KEYS.RESULTS, []),
  getHuntResponses: () => get<HuntResponse[]>(DB_KEYS.HUNT_RESPONSES, []),
  getCustomScenarios: () => get<HuntScenario[]>(DB_KEYS.CUSTOM_SCENARIOS, []),
  
  getAllScenarios: () => {
    const custom = StorageService.getCustomScenarios();
    return [...HUNT_SCENARIOS, ...custom];
  },

  saveDistricts: (data: District[]) => set(DB_KEYS.DISTRICTS, data),
  saveStores: (data: Store[]) => set(DB_KEYS.STORES, data),
  saveUsers: (data: User[]) => set(DB_KEYS.USERS, data),
  saveQuestions: (data: Question[]) => set(DB_KEYS.QUESTIONS, data),
  saveResults: (data: QuizResult[]) => set(DB_KEYS.RESULTS, data),
  saveHuntResponses: (data: HuntResponse[]) => set(DB_KEYS.HUNT_RESPONSES, data),
  saveCustomScenarios: (data: HuntScenario[]) => set(DB_KEYS.CUSTOM_SCENARIOS, data),

  addResult: (result: Omit<QuizResult, 'id'>) => {
    const results = StorageService.getResults();
    const newResult = { ...result, id: Math.random().toString(36).substr(2, 9) };
    StorageService.saveResults([newResult, ...results]);
    return newResult;
  },

  addHuntResponse: (response: Omit<HuntResponse, 'id'>) => {
    const responses = StorageService.getHuntResponses();
    const newResponse = { ...response, id: Math.random().toString(36).substr(2, 9) };
    StorageService.saveHuntResponses([newResponse, ...responses]);
    return newResponse;
  },

  addCustomScenario: (scenario: HuntScenario) => {
    const scenarios = StorageService.getCustomScenarios();
    StorageService.saveCustomScenarios([scenario, ...scenarios]);
  },

  exportAllData: () => {
    const fullState = {
      districts: StorageService.getDistricts(),
      stores: StorageService.getStores(),
      users: StorageService.getUsers(),
      questions: StorageService.getQuestions(),
      results: StorageService.getResults(),
      huntResponses: StorageService.getHuntResponses(),
      customScenarios: StorageService.getCustomScenarios()
    };
    return JSON.stringify(fullState, null, 2);
  },

  importAllData: (jsonStr: string) => {
    try {
      const state = JSON.parse(jsonStr);
      if (state.districts) StorageService.saveDistricts(state.districts);
      if (state.stores) StorageService.saveStores(state.stores);
      if (state.users) StorageService.saveUsers(state.users);
      if (state.questions) StorageService.saveQuestions(state.questions);
      if (state.results) StorageService.saveResults(state.results);
      if (state.huntResponses) StorageService.saveHuntResponses(state.huntResponses);
      if (state.customScenarios) StorageService.saveCustomScenarios(state.customScenarios);
      return true;
    } catch (e) {
      console.error("Failed to import data", e);
      return false;
    }
  },

  resetToDefaults: () => {
    localStorage.clear();
    StorageService.init();
    window.location.reload();
  }
};
