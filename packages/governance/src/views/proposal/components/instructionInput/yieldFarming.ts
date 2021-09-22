import { PublicKey } from '@solana/web3.js';

import { getAssociatedTokenAddress } from '../../../../tools/sdk/token/splToken';

export function isYieldFarmingGovernance(governancePk: PublicKey) {
  // TODO: add governance metadata to capture available instruction types
  const yfGovernances = [
    'EVhURne36yBfuTfqwn1W2hWdi6i3Vhau9n4FE8ehHbKM', // SCTF1 Realm
    'BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ', // Yield Farming Realm
  ];

  return yfGovernances.includes(governancePk.toBase58());
}

export function getRaySrmLpUserAccount(governancePk: PublicKey) {
  // TODO: define these addresses as derived ones from seeds or preferably fetch the accounts for given user
  switch (governancePk.toBase58()) {
    case 'EVhURne36yBfuTfqwn1W2hWdi6i3Vhau9n4FE8ehHbKM':
      return new PublicKey('4wmxLsrtQh7KhyhKiDPpxLNfPn6o3QzD68mWdJrHHsuH');
    case 'BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ':
      return new PublicKey('CjvTxyoZPfSg1aDchw79RmwFfkuWb5v1obhCt4dfw9mq');
    default:
      throw new Error(
        `User account is not defined for ${governancePk.toBase58()}  governance`,
      );
  }
}

export async function getRAYGovernanceAta(governancePk: PublicKey) {
  let rayAta = await getAssociatedTokenAddress(
    new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), // RAY mint
    governancePk,
  );

  // temp. workaround until the accounts are fixed for the dev 'Yield Farming' realm
  if (
    governancePk.equals(
      new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'),
    )
  ) {
    // The accounts owned by BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ governance are not ATAs and we have to overwrite them
    rayAta = new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf');
  }

  return rayAta;
}

export async function getSRMGovernanceAta(governancePk: PublicKey) {
  let srmAta = await getAssociatedTokenAddress(
    new PublicKey('SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'), // SRM mint
    governancePk,
  );

  // temp. workaround until the accounts are fixed for the dev 'Yield Farming' realm
  if (
    governancePk.equals(
      new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'),
    )
  ) {
    // The accounts owned by BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ governance are not ATAs and we have to overwrite them
    srmAta = new PublicKey('EfQU385sk18VwfVaxZ1aiDXfvHg9jdbzqGm9Qg7261wh');
  }

  return srmAta;
}
