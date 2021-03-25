import { PublicKey } from '@solana/web3.js';
import { TokenSwapLayout, TokenSwapLayoutV1 } from '../models/tokenSwap';

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);
export let TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export let LENDING_PROGRAM_ID = new PublicKey(
  'LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi',
);

export let SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
export let BPF_UPGRADE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);

export let SYSTEM = new PublicKey('11111111111111111111111111111111');

let WORMHOLE_BRIDGE: {
  pubkey: PublicKey;
  bridge: string;
  wrappedMaster: string;
};

let TIMELOCK: {
  programId: PublicKey;
  programAccountId: PublicKey;
};

let SWAP_PROGRAM_ID: PublicKey;
let SWAP_PROGRAM_LEGACY_IDS: PublicKey[];
let SWAP_PROGRAM_LAYOUT: any;

export const LEND_HOST_FEE_ADDRESS = process.env.REACT_APP_LEND_HOST_FEE_ADDRESS
  ? new PublicKey(`${process.env.REACT_APP_LEND_HOST_FEE_ADDRESS}`)
  : undefined;

console.debug(`Lend host fee address: ${LEND_HOST_FEE_ADDRESS?.toBase58()}`);

export const ENABLE_FEES_INPUT = false;

// legacy pools are used to show users contributions in those pools to allow for withdrawals of funds
export const PROGRAM_IDS = [
  {
    name: 'mainnet-beta',
    timelock: () => ({
      programAccountId: new PublicKey(
        '9gBhDCCKV7KELLFRY8sAJZXqDmvUfmNzFzpB2b4FUVVr',
      ),
      programId: new PublicKey('9iAeqqppjn7g1Jn8o2cQCqU5aQVV3h4q9bbWdKRbeC2w'),
    }),
    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [
        // TODO: uncomment to enable legacy contract
        // new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
      ],
    }),
  },
  {
    name: 'testnet',
    timelock: () => ({
      programAccountId: new PublicKey(
        '7CxEuz8Qtius9aCyJqGnWZyBNvf6WTTNmA8G26BdMTSF',
      ),
      programId: new PublicKey('8DevpkpN6CsdczP6rQ64CHraApXFrq96oGm4VjSNCs4q'),
    }),
    wormhole: () => ({
      pubkey: new PublicKey('5gQf5AUhAgWYgUCt9ouShm9H7dzzXUsLdssYwe5krKhg'),
      bridge: '0x251bBCD91E84098509beaeAfF0B9951859af66D3',
      wrappedMaster: 'E39f0b145C0aF079B214c5a8840B2B01eA14794c',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },
  {
    name: 'devnet',
    timelock: () => ({
      programAccountId: new PublicKey(
        '2tNnNbgf2WR7TFs4nriuNrKkVyq5bTwv9JTtNhzATnYK',
      ),
      programId: new PublicKey('CzdHe5RxnXKoRk4TrJRX8Q5BPRYqW8SPXpEkQth4drsv'),
    }),
    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('6Cust2JhvweKLh4CVo1dt21s2PJ86uNGkziudpkNPaCj'),
        layout: TokenSwapLayout,
      },
      legacy: [new PublicKey('BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ')],
    }),
  },
  {
    name: 'localnet',
    timelock: () => ({
      programAccountId: new PublicKey(
        '5jmddiXrpvPp587iRvhtAnNrJa2PNMFRm5cxFW6yCG14',
      ),
      programId: new PublicKey('3KEiR9eX7isb8xeFzTzbLZij8tKH6YFYUbMyjBp8ygDK'),
    }),
    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('369YmCWHGxznT7GGBhcLZDRcRoGWmGKFWdmtiPy78yj7'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },
];

export const setProgramIds = (envName: string) => {
  let instance = PROGRAM_IDS.find(env => env.name === envName);
  if (!instance) {
    return;
  }

  WORMHOLE_BRIDGE = instance.wormhole();

  let swap = instance.swap();

  SWAP_PROGRAM_ID = swap.current.pubkey;
  SWAP_PROGRAM_LAYOUT = swap.current.layout;
  SWAP_PROGRAM_LEGACY_IDS = swap.legacy;

  TIMELOCK = instance.timelock();

  if (envName === 'mainnet-beta') {
    LENDING_PROGRAM_ID = new PublicKey(
      'LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi',
    );
  }
};

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    swap: SWAP_PROGRAM_ID,
    swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
    swapLayout: SWAP_PROGRAM_LAYOUT,
    lending: LENDING_PROGRAM_ID,
    wormhole: WORMHOLE_BRIDGE,
    timelock: TIMELOCK,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
  };
};
