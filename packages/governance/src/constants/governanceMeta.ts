export type IGovernanceStaticMeta = {
  programId: string
  address: string
  name: string
}

export const GovernanceMetaMap: IGovernanceStaticMeta[] = [
  // solana testnet
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: 'HHQsjRpL35thWSG2CsvkaNmhMLGbucmfWQJ12Kjid579',
    name: 'Community Governance',
  },
  {
    programId: 'GuY7y4k7s4bicCymTSeAQtgzsx1G461s1swYvBFNCKgT',
    address: '5xm5T6zMRf4qQCQArWoMzDf6reLmcLWCMhtgYz6wgfFv',
    name: 'Emergency Governance',
  },
  // solana devnet
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: 'HGmZgx9cBVbXr2rTyzujLXLDqBfqZtyE5iRbrbT4rDc8',
    name: 'Community Governance',
  },
  {
    programId: '5oLTQBvjQjvsZqRNHsdE6pn8nW13Mw6EEMvQfjQ8C6pN',
    address: 'HJYKvnRDerwKimDSHnJvNWYE6GWuHVyoNTAyxmTNAySE',
    name: 'Emergency Governance',
  },
  // localnet
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: '6iM3MHBk2eCePZPuKiiSYNcXrPidCwFqGWbxvBbzoouG',
    name: 'Community Governance',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: '9Q1WMiM85qD7PbDLfRrRvisw3GYW87EvKFr4UypGPSqd',
    name: 'Emergency Governance',
  },
  {
    programId: '82pQHEmBbW6CQS8GzLP3WE2pCgMUPSW2XzpuSih3aFDk',
    address: 'pBuoBvc4jeWcRvYABZaxtLZFfT2rnXW7G8ixLYc15bQ',
    name: 'Maintenance Governance',
  },
];
