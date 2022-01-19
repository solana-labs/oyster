import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

export async function sendTransaction(connection: Connection, instructions: TransactionInstruction[], signers: Keypair[], feePayer: Keypair) {
  let transaction = new Transaction({ feePayer: feePayer.publicKey })
  transaction.add(...instructions)
  signers.push(feePayer);
  let tx = await connection.sendTransaction(transaction, signers)

  await connection.confirmTransaction(tx);
}

export async function requestAirdrop(connection: Connection, walletPk: PublicKey) {
  const airdropSignature = await connection.requestAirdrop(
    walletPk,
    LAMPORTS_PER_SOL,
  );

  await connection.confirmTransaction(airdropSignature);
}