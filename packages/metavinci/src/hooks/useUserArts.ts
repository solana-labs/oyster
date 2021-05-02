import { TokenAccount, useUserAccounts } from '@oyster/common';
import { SafetyDepositDraft } from '../actions/createAuctionManager';
import { useMeta } from './../contexts';

export const useUserArts = (): SafetyDepositDraft[] => {
  const { metadata, masterEditions, editions, nameSymbolTuples } = useMeta();
  const { userAccounts } = useUserAccounts();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());

  const ownedMetadata = metadata.filter(
    m =>
      accountByMint.has(m.info.mint.toBase58()) &&
      (accountByMint?.get(m.info.mint.toBase58())?.info?.amount?.toNumber() ||
        0) > 0,
  );

  const possibleNameSymbols = ownedMetadata.map(m =>
    m.info.nameSymbolTuple
      ? nameSymbolTuples[m.info.nameSymbolTuple?.toBase58()]
      : undefined,
  );

  const possibleEditions = ownedMetadata.map(m =>
    m.info.edition ? editions[m.info.edition?.toBase58()] : undefined,
  );

  const possibleMasterEditions = ownedMetadata.map(m =>
    m.info.masterEdition
      ? masterEditions[m.info.masterEdition?.toBase58()]
      : undefined,
  );

  let safetyDeposits: SafetyDepositDraft[] = [];
  let i = 0;
  ownedMetadata.forEach(m => {
    let a = accountByMint.get(m.info.mint.toBase58());
    let masterA = accountByMint.get(
      possibleMasterEditions[i]?.info.masterMint?.toBase58() || '',
    );

    if (a) {
      safetyDeposits.push({
        holding: a.pubkey,
        nameSymbol: possibleNameSymbols[i],
        edition: possibleEditions[i],
        masterEdition: possibleMasterEditions[i],
        metadata: m,
        masterMintHolding: masterA?.pubkey,
      });
    }
    i++;
  });

  return safetyDeposits;
};
