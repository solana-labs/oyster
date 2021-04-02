//! State transition types

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use enum_dispatch::enum_dispatch;
use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Trait representing access to program state across all versions
#[enum_dispatch]
pub trait BidState {
    /// Is the auction initialized, with data written to it
    fn is_initialized(&self) -> bool;
    /// Token program ID associated with the swap
    fn amount(&self) -> &Pubkey;
    /// Address of quote vault account
    fn vault_account(&self) -> &Pubkey;
    /// Address of NFT vault account
    fn vote_slot(&self) -> &u64;
}
