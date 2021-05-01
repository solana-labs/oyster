import * as solanaWeb3 from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import assert from 'assert';
// @ts-ignore
import * as BufferLayout from 'buffer-layout';
import * as bs58 from 'bs58';
import { AssetMeta } from '../bridge';

export interface Lockup {
  lockupAddress: PublicKey;
  amount: BN;
  toChain: number;
  sourceAddress: PublicKey;
  targetAddress: Uint8Array;
  assetAddress: Uint8Array;
  assetChain: number;
  assetDecimals: number;
  nonce: number;
  vaa: Uint8Array;
  vaaTime: number;
  pokeCounter: number;
  signatureAccount: PublicKey;
  initialized: boolean;
}

export interface Signature {
  signature: number[];
  index: number;
}

export const CHAIN_ID_SOLANA = 1;

class SolanaBridge {
  endpoint: string;
  connection: solanaWeb3.Connection;
  programID: PublicKey;
  tokenProgram: PublicKey;

  constructor(
    endpoint: string,
    connection: solanaWeb3.Connection,
    programID: PublicKey,
    tokenProgram: PublicKey,
  ) {
    this.endpoint = endpoint;
    this.programID = programID;
    this.tokenProgram = tokenProgram;
    this.connection = connection;
  }

  createPokeProposalInstruction(
    proposalAccount: PublicKey,
  ): TransactionInstruction {
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
      {
        instruction: 5, // PokeProposal instruction
      },
      data,
    );

    const keys = [
      { pubkey: proposalAccount, isSigner: false, isWritable: true },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programID,
      data,
    });
  }
  // fetchAssetMeta fetches the AssetMeta for an SPL token
  async fetchAssetMeta(mint: PublicKey): Promise<AssetMeta> {
    // @ts-ignore
    let configKey = await this.getConfigKey();
    let seeds: Array<Buffer> = [
      Buffer.from('meta'),
      configKey.toBuffer(),
      mint.toBuffer(),
    ];
    // @ts-ignore
    let metaKey = (
      await solanaWeb3.PublicKey.findProgramAddress(seeds, this.programID)
    )[0];
    let metaInfo = await this.connection.getAccountInfo(metaKey);
    if (metaInfo == null || metaInfo.lamports == 0) {
      return {
        address: mint.toBuffer(),
        chain: CHAIN_ID_SOLANA,
        decimals: 0,
      };
    } else {
      const dataLayout = BufferLayout.struct([
        BufferLayout.u8('assetChain'),
        BufferLayout.blob(32, 'assetAddress'),
      ]);
      let wrappedMeta = dataLayout.decode(metaInfo?.data);

      return {
        address: wrappedMeta.assetAddress,
        chain: wrappedMeta.assetChain,
        decimals: 0,
      };
    }
  }
  // fetchSignatureStatus fetches the signatures for a VAA
  async fetchSignatureStatus(signatureStatus: PublicKey): Promise<Signature[]> {
    let signatureInfo = await this.connection.getAccountInfo(
      signatureStatus,
      'single',
    );
    if (signatureInfo == null || signatureInfo.lamports == 0) {
      throw new Error('not found');
    } else {
      const dataLayout = BufferLayout.struct([
        BufferLayout.blob(20 * 65, 'signaturesRaw'),
      ]);
      let rawSignatureInfo = dataLayout.decode(signatureInfo?.data);

      let signatures: Signature[] = [];
      for (let i = 0; i < 20; i++) {
        let data = rawSignatureInfo.signaturesRaw.slice(65 * i, 65 * (i + 1));
        let empty = true;
        for (let v of data) {
          if (v != 0) {
            empty = false;
            break;
          }
        }
        if (empty) continue;

        signatures.push({
          signature: data,
          index: i,
        });
      }

      return signatures;
    }
  }

  parseLockup(address: PublicKey, data: Buffer): Lockup {
    const dataLayout = BufferLayout.struct([
      uint256('amount'),
      BufferLayout.u8('toChain'),
      BufferLayout.blob(32, 'sourceAddress'),
      BufferLayout.blob(32, 'targetAddress'),
      BufferLayout.blob(32, 'assetAddress'),
      BufferLayout.u8('assetChain'),
      BufferLayout.u8('assetDecimals'),
      BufferLayout.seq(BufferLayout.u8(), 1), // 4 byte alignment because a u32 is following
      BufferLayout.u32('nonce'),
      BufferLayout.blob(1001, 'vaa'),
      BufferLayout.seq(BufferLayout.u8(), 3), // 4 byte alignment because a u32 is following
      BufferLayout.u32('vaaTime'),
      BufferLayout.u32('lockupTime'),
      BufferLayout.u8('pokeCounter'),
      BufferLayout.blob(32, 'signatureAccount'),
      BufferLayout.u8('initialized'),
    ]);

    let parsedAccount = dataLayout.decode(data);

    return {
      lockupAddress: address,
      amount: new BN(parsedAccount.amount, 2, 'le'),
      assetAddress: parsedAccount.assetAddress,
      assetChain: parsedAccount.assetChain,
      assetDecimals: parsedAccount.assetDecimals,
      initialized: parsedAccount.initialized == 1,
      nonce: parsedAccount.nonce,
      sourceAddress: new PublicKey(parsedAccount.sourceAddress),
      targetAddress: parsedAccount.targetAddress,
      toChain: parsedAccount.toChain,
      vaa: parsedAccount.vaa,
      vaaTime: parsedAccount.vaaTime,
      signatureAccount: new PublicKey(parsedAccount.signatureAccount),
      pokeCounter: parsedAccount.pokeCounter,
    };
  }

  // fetchAssetMeta fetches the AssetMeta for an SPL token
  async fetchTransferProposals(tokenAccount: PublicKey): Promise<Lockup[]> {
    let accountRes = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          this.programID.toString(),
          {
            commitment: 'single',
            filters: [
              { dataSize: 1184 },
              {
                memcmp: {
                  offset: 33,
                  bytes: tokenAccount.toString(),
                },
              },
            ],
          },
        ],
      }),
    });
    let raw_accounts = (await accountRes.json())['result'];

    let accounts: Lockup[] = [];
    for (let acc of raw_accounts) {
      let pubkey = new PublicKey(acc.pubkey);
      accounts.push(this.parseLockup(pubkey, bs58.decode(acc.account.data)));
    }

    return accounts;
  }

  AccountLayout = BufferLayout.struct([
    publicKey('mint'),
    publicKey('owner'),
    uint64('amount'),
    BufferLayout.u32('option'),
    publicKey('delegate'),
    BufferLayout.u8('is_initialized'),
    BufferLayout.u8('is_native'),
    BufferLayout.u16('padding'),
    uint64('delegatedAmount'),
  ]);

  async getConfigKey(): Promise<PublicKey> {
    // @ts-ignore
    return (
      await solanaWeb3.PublicKey.findProgramAddress(
        [Buffer.from('bridge')],
        this.programID,
      )
    )[0];
  }
}

// Taken from https://github.com/solana-labs/solana-program-library
// Licensed under Apache 2.0

export class u64 extends BN {
  /**
   * Convert to Buffer representation
   */
  toBuffer(): Buffer {
    const a = super.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length === 8) {
      return b;
    }
    assert(b.length < 8, 'u64 too large');

    const zeroPad = Buffer.alloc(8);
    b.copy(zeroPad);
    return zeroPad;
  }

  /**
   * Construct a u64 from Buffer representation
   */
  static fromBuffer(buffer: Buffer): u64 {
    assert(buffer.length === 8, `Invalid buffer length: ${buffer.length}`);
    return new BN(
      // @ts-ignore
      [...buffer]
        .reverse()
        .map(i => `00${i.toString(16)}`.slice(-2))
        .join(''),
      16,
    );
  }
}

function padBuffer(b: Buffer, len: number): Buffer {
  const zeroPad = Buffer.alloc(len);
  b.copy(zeroPad, len - b.length);
  return zeroPad;
}

export class u256 extends BN {
  /**
   * Convert to Buffer representation
   */
  toBuffer(): Buffer {
    const a = super.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length === 32) {
      return b;
    }
    assert(b.length < 32, 'u256 too large');

    const zeroPad = Buffer.alloc(32);
    b.copy(zeroPad);
    return zeroPad;
  }

  /**
   * Construct a u256 from Buffer representation
   */
  static fromBuffer(buffer: number[]): u256 {
    assert(buffer.length === 32, `Invalid buffer length: ${buffer.length}`);
    return new BN(
      // @ts-ignore
      [...buffer]
        .reverse()
        .map(i => `00${i.toString(16)}`.slice(-2))
        .join(''),
      16,
    );
  }
}

/**
 * Layout for a public key
 */
export const publicKey = (property: string = 'publicKey'): Object => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property: string = 'uint64'): Object => {
  return BufferLayout.blob(8, property);
};

/**
 * Layout for a 256-bit unsigned value
 */
export const uint256 = (property: string = 'uint256'): Object => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a Rust String type
 */
export const rustString = (property: string = 'string') => {
  const rsl = BufferLayout.struct(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ],
    property,
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return data.chars.toString('utf8');
  };

  rsl.encode = (str: string, buffer: Buffer, offset: number) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, buffer, offset);
  };

  return rsl;
};

export { SolanaBridge };
