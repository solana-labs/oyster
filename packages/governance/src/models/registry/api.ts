export function getProgramVersion(programId: string, env: string) {
  switch (programId) {
    // MNGO
    case 'GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J':
      return 1;
    // SOCEAN
    case '5hAykmD4YGcQ7Am3N7nC9kyELq6CThAkU82nhNKDJiCy':
      return 1;
    // SCTF1
    case 'gSF1T5PdLc2EutzwAyeExvdW27ySDtFp88ri5Aymah6':
      return 1;
    // Governance (default)
    case 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw':
      return env === 'localnet' ? 2 : 1;
    default:
      return 2;
  }
}
