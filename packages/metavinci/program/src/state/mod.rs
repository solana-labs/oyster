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
pub trait AuctionState {
    /// Is the auction initialized, with data written to it
    fn is_initialized(&self) -> bool;
    /// Bump seed used to generate the program address / authority
    fn nonce(&self) -> u8;
    /// Token program ID associated with the swap
    fn token_program_id(&self) -> &Pubkey;
    /// Address of NFT vault account
    fn vault_account(&self) -> &Pubkey;
    /// Address of quote treasury token account
    fn treasury_quote_account(&self) -> &Pubkey;
    /// Address of pool token mint
    fn token_swap_pool(&self) -> &Pubkey;
    /// Address of lp treasury token account - stores lp tokens deposited to AMM
    fn treasury_lp_account(&self) -> &Pubkey;

    /// Address of quote token mint
    fn quote_mint(&self) -> &Pubkey;
    /// Address of NFT token mint
    fn vault_mint(&self) -> &Pubkey;
    /// Address of LP token mint
    fn lp_mint(&self) -> &Pubkey;
}
