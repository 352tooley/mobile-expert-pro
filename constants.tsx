
import { District, Store, User, UserRole, Question, HuntScenario } from './types';

export const INITIAL_DISTRICTS: District[] = [
  { id: 'd_west', name: 'DFW West' },
  { id: 'd_north', name: 'DFW North' },
  { id: 'd_south', name: 'DFW South' },
];

const WEST_STORE_NAMES = [
  'Cleburne', 'Stephenville', 'Granbury', 'Rufe Snow', 
  'Golden Triangle', '28th St', 'Weatherford', 'Clifford', 'Chisholm Trail'
];

const generateStores = (): Store[] => {
  const stores: Store[] = [];
  
  // DFW West Stores
  WEST_STORE_NAMES.forEach((name, i) => {
    stores.push({ id: `s_west_${i}`, name: `${name}`, districtId: 'd_west' });
  });

  // DFW North Placeholder Stores
  for (let i = 1; i <= 9; i++) {
    stores.push({ id: `s_north_${i}`, name: `Store ${i} - DFW North`, districtId: 'd_north' });
  }

  // DFW South Placeholder Stores
  for (let i = 1; i <= 9; i++) {
    stores.push({ id: `s_south_${i}`, name: `Store ${i} - DFW South`, districtId: 'd_south' });
  }

  return stores;
};

export const INITIAL_STORES: Store[] = generateStores();

const generateUsers = (stores: Store[]): User[] => {
  const users: User[] = [];
  
  // For each store, add a generic user for each store-level role
  stores.forEach(store => {
    users.push({ id: `u_me_${store.id}`, name: UserRole.EXPERT, role: UserRole.EXPERT, storeId: store.id, districtId: store.districtId });
    users.push({ id: `u_ram_${store.id}`, name: UserRole.RAM, role: UserRole.RAM, storeId: store.id, districtId: store.districtId });
    users.push({ id: `u_rsm_${store.id}`, name: UserRole.RSM, role: UserRole.RSM, storeId: store.id, districtId: store.districtId });
  });

  // District Managers
  INITIAL_DISTRICTS.forEach(d => {
    users.push({ id: `u_dm_${d.id}`, name: UserRole.DM, role: UserRole.DM, storeId: '', districtId: d.id });
  });

  // Regional Director
  users.push({ id: 'u_rd_1', name: UserRole.RD, role: UserRole.RD, storeId: '', districtId: '' });

  return users;
};

export const INITIAL_USERS: User[] = generateUsers(INITIAL_STORES);

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is the standard commission for a Go5G Plus line activation?',
    options: ['$10', '$20', '$35', '$40'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    text: 'Which accessory bundle provides the highest payout multiplier?',
    options: ['Power & Case', 'Protection & Power', '3+ Accessories', 'Audio & Watch'],
    correctIndex: 2,
  },
  {
    id: 'q3',
    text: 'What is the maximum AutoPay discount per line on a standard plan?',
    options: ['$2', '$5', '$10', '$15'],
    correctIndex: 1,
  },
];

export const HUNT_SCENARIOS: HuntScenario[] = [
  {
    id: 'h4',
    title: 'The Mega-Account Multi-Line Growth',
    description: 'This is a standard 5-line voice account with 5G Home Internet. Analyze the current structure. A free line is currently active (L3) and a BOGO (L5). The customer needs 5 lines for their new business. Hunt the 5.',
    phoneNumber: '425-555-0101',
    accountData: [
      { ratePlan: 'Go5G Plus (L1)', mrc: 150, discount: 0, features: 18, eip: 35, devicePromo: 35, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L2)', mrc: 'Included', discount: 0, features: 18, eip: 25, devicePromo: 25, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L3)', mrc: 35, discount: 35, features: 18, eip: 0, devicePromo: 0, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L4)', mrc: 35, discount: 0, features: 18, eip: 30, devicePromo: 30, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L5)', mrc: 35, discount: 35, features: 18, eip: 10, devicePromo: 0, autopay: 'Yes' },
      { ratePlan: '5G Home Internet', mrc: 50, discount: 20, features: 0, eip: 0, devicePromo: 0, autopay: 'Yes' }
    ]
  },
  {
    id: 'h1',
    title: 'Value Pivot Strategy',
    description: 'Customer has 3 voice lines and a tablet. One voice line is free. They are currently paying for features on every line. Help them see the value in adding 5 lines to reach the 9+ line billing tier.',
    phoneNumber: '206-555-9876',
    accountData: [
      { ratePlan: 'Go5G Plus (L1)', mrc: 150, discount: 0, features: 18, eip: 35, devicePromo: 0, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L2)', mrc: 'Included', discount: 0, features: 18, eip: 35, devicePromo: 0, autopay: 'Yes' },
      { ratePlan: 'Go5G Plus (L3)', mrc: 35, discount: 35, features: 18, eip: 0, devicePromo: 0, autopay: 'Yes' },
      { ratePlan: 'Tablet Unl', mrc: 20, discount: 0, features: 0, eip: 15, devicePromo: 15, autopay: 'No' }
    ]
  },
  {
    id: 'h2',
    title: 'Legacy Consolidation',
    description: 'An older family plan where lines were added over time. No free lines currently. This account is ripe for a Move to Go5G Plus and Hunting for 5.',
    phoneNumber: '602-555-1234',
    accountData: [
      { ratePlan: 'Legacy (L1)', mrc: 100, discount: 0, features: 9, eip: 0, devicePromo: 0, autopay: 'No' },
      { ratePlan: 'Legacy (L2)', mrc: 'Included', discount: 0, features: 9, eip: 0, devicePromo: 0, autopay: 'No' },
      { ratePlan: 'Add-on (L3)', mrc: 20, discount: 0, features: 0, eip: 25, devicePromo: 25, autopay: 'No' }
    ]
  }
];
