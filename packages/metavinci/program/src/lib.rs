#![deny(missing_docs)]

//! Fractional non-fungible-token program for the Solana blockchain that exposes AMM and Auction mechanics for NFTs.

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

#[cfg(not(feature = "no-entrypoint"))]
mod entrypoint;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

solana_program::declare_id!("vinRJ4LvgnNjgeS9aDEw7YvE7UywgTMA3F1GbjRmVxW");
