
export enum UserRole {
  EXPERT = 'Mobile Expert',
  RAM = 'RAM',
  RSM = 'RSM',
  DM = 'District Manager',
  RD = 'Regional Director'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  storeId: string;
  districtId: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
  districtId: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  storeName: string;
  storeId: string;
  districtName: string;
  districtId: string;
  score: number;
  total: number;
  timestamp: number;
}

export interface AccountRow {
  ratePlan: string;
  mrc: number | 'Included';
  discount: number;
  features: number;
  eip: number;
  devicePromo: number;
  autopay: 'Yes' | 'No';
}

export interface HuntScenario {
  id: string;
  title: string;
  description: string;
  accountData: AccountRow[];
  aiInstructions?: string; // Leader-provided context for the AI persona
  createdBy?: string;
  isCustom?: boolean;
  phoneNumber?: string; // Gate for audit access
}

export interface HuntResponse {
  id: string;
  userId: string;
  userName: string;
  scenarioTitle: string;
  solution: string;
  timestamp: number;
  storeName: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
}
