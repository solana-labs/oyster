import { Message, PublicKey } from '@solana/web3.js';

export function getMessageAccountInfos(
  actualMessage: Message,
): { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] {
  console.log(actualMessage);
  // From Solana docs:
  /*
  
    The addresses that require signatures appear at the beginning of the account address array, 
    with addresses requesting write access first and read-only accounts following. 
    The addresses that do not require signatures follow the addresses that do, 
    again with read-write accounts first and read-only accounts following.
  */
  const { programIdIndex, accounts } = actualMessage.instructions[0];
  const accountInfosInOrder = accounts.map(a => actualMessage.accountKeys[a]);
  // If programIdIndex isnt in accountInfos, there's an off-by-one issue that happens here
  // where one account that should be writable isnt, so we take care of here...
  const totalSize =
    accountInfosInOrder.length + (accounts.includes(programIdIndex) ? 0 : 1);
  const requireSigsOnlyNotWritable =
    actualMessage.header.numReadonlySignedAccounts;
  const requireNietherSigsNorWrite =
    actualMessage.header.numReadonlyUnsignedAccounts;
  const writableOnly =
    totalSize - requireSigsOnlyNotWritable - requireNietherSigsNorWrite;
  // and adjust here...
  const readOnly =
    requireSigsOnlyNotWritable +
    requireNietherSigsNorWrite -
    (totalSize - accountInfosInOrder.length);

  let position = 0;

  let finalArray: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [];
  for (let i = 0; i < writableOnly; i++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: true,
      isSigner: false, // We force signer to false because you realistically as executor wont
      // have any of these keys present unless it happens to be your own
      // WE dont care about required signers or not
    });
    position++;
  }

  for (let i = 0; i < readOnly; i++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: false,
      isSigner: false,
    });
    position++;
  }

  for (; position < accountInfosInOrder.length; position++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: false,
      isSigner: false,
    });
  }

  return finalArray;
}
