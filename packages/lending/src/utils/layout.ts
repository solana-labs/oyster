import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';

/**
 * Layout for a public key
 */
export const publicKey = (property = 'publicKey') => {
  const layout = BufferLayout.blob(32, property);

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  const publicKeyLayout = layout as BufferLayout.Layout<any> as BufferLayout.Layout<PublicKey>;

  publicKeyLayout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new PublicKey(data);
  };

  publicKeyLayout.encode = (key: PublicKey, buffer: Buffer, offset: number) => {
    return _encode(key.toBuffer(), buffer, offset);
  };

  return publicKeyLayout;
};

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property = 'uint64') => {
  const layout = BufferLayout.blob(8, property);

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  const bnLayout = layout as BufferLayout.Layout<any> as BufferLayout.Layout<BN>;

  bnLayout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new BN(
      [...data]
        .reverse()
        .map(i => `00${i.toString(16)}`.slice(-2))
        .join(''),
      16,
    );
  };

  bnLayout.encode = (num: BN, buffer: Buffer, offset: number) => {
    const a = num.toArray().reverse();
    let b = Buffer.from(a);
    if (b.length !== 8) {
      const zeroPad = Buffer.alloc(8);
      b.copy(zeroPad);
      b = zeroPad;
    }
    return _encode(b, buffer, offset);
  };

  return bnLayout;
};

// TODO: wrap in BN (what about decimals?)
export const uint128 = (property = 'uint128') => {
  const layout = BufferLayout.blob(16, property);

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  const bnLayout = layout as BufferLayout.Layout<any> as BufferLayout.Layout<BN>;

  bnLayout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return new BN(
      [...data]
        .reverse()
        .map(i => `00${i.toString(16)}`.slice(-2))
        .join(''),
      16,
    );
  };

  bnLayout.encode = (num: BN, buffer: Buffer, offset: number) => {
    const a = num.toArray().reverse();
    let b = Buffer.from(a);
    if (b.length !== 16) {
      const zeroPad = Buffer.alloc(16);
      b.copy(zeroPad);
      b = zeroPad;
    }

    return _encode(b, buffer, offset);
  };

  return bnLayout;
};

interface RustString {
  length: number;
  lengthPadding: number;
  chars: Buffer;
}

/**
 * Layout for a Rust String type
 */
export const rustString = (property = 'string') => {
  const layout = BufferLayout.struct<RustString>(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ],
    property,
  );

  const _decode = layout.decode.bind(layout);
  const _encode = layout.encode.bind(layout);

  const stringLayout = layout as BufferLayout.Layout<any> as BufferLayout.Layout<string>;

  stringLayout.decode = (buffer: Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return data.chars.toString('utf8');
  };

  stringLayout.encode = (str: string, buffer: Buffer, offset: number) => {
    // @TODO: does this need length/padding?
    const data = {
      chars: Buffer.from(str, 'utf8'),
    } as RustString;
    return _encode(data, buffer, offset);
  };

  return stringLayout;
};
