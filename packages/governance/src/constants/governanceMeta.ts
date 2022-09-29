import { ENV } from '@oyster/common';

export type IGovernanceStaticMeta = {
  programId: string;
  address: string;
  name: string;
};

export const GovernanceMetaEnvMap = new Map<ENV, IGovernanceStaticMeta[]>();

GovernanceMetaEnvMap.set('localnet', [
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: '6iM3MHBk2eCePZPuKiiSYNcXrPidCwFqGWbxvBbzoouG',
    name: 'Ecosystem Assembly',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: '9Q1WMiM85qD7PbDLfRrRvisw3GYW87EvKFr4UypGPSqd',
    name: 'Treasury Watchdog',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: 'pBuoBvc4jeWcRvYABZaxtLZFfT2rnXW7G8ixLYc15bQ',
    name: 'Development Assembly',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: 'ojtWRf7eVy29bBaCcXCxkczf8XcmAFxc4K4AZewGDgQ',
    name: 'EVM Emergency Assembly',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: '',
    name: 'Grants Assembly',
  },
]);

GovernanceMetaEnvMap.set('testnet', [
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: 'HHQsjRpL35thWSG2CsvkaNmhMLGbucmfWQJ12Kjid579',
    name: 'Ecosystem Assembly',
  },
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: '5xm5T6zMRf4qQCQArWoMzDf6reLmcLWCMhtgYz6wgfFv',
    name: 'Treasury Watchdog',
  },
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: '',
    name: 'Development Assembly',
  },
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: '',
    name: 'EVM Emergency Assembly',
  },
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: '',
    name: 'Grants Assembly',
  },
]);

GovernanceMetaEnvMap.set('devnet', [
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: 'HGmZgx9cBVbXr2rTyzujLXLDqBfqZtyE5iRbrbT4rDc8',
    name: 'Ecosystem Assembly',
  },
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: 'HJYKvnRDerwKimDSHnJvNWYE6GWuHVyoNTAyxmTNAySE',
    name: 'Treasury Watchdog',
  },
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: '',
    name: 'Development Assembly',
  },
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: '',
    name: 'EVM Emergency Assembly',
  },
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: '',
    name: 'Grants Assembly',
  },
]);

GovernanceMetaEnvMap.set('mainnet-beta', [
  {
    programId: '',
    address: '',
    name: 'Ecosystem Assembly',
  },
  {
    programId: '',
    address: '',
    name: 'Treasury Watchdog',
  },
  {
    programId: '',
    address: '',
    name: 'Development Assembly',
  },
  {
    programId: '',
    address: '',
    name: 'EVM Emergency Assembly',
  },
  {
    programId: '',
    address: '',
    name: 'Grants Assembly',
  },
]);
