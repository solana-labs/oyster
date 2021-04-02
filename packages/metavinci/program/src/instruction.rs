//! Instruction types

#![allow(clippy::too_many_arguments)]

use num_derive::{FromPrimitive, ToPrimitive};
use num_traits::{FromPrimitive, ToPrimitive};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
};
use std::convert::TryInto;
use std::mem::size_of;

use crate::error::AuctionError;

/// Describe how the borrow input amount should be treated
#[derive(Clone, Copy, Debug, PartialEq, FromPrimitive, ToPrimitive)]
pub enum AuctionStartType {
    /// Treat amount as reservation price that needs to be reached before auction starts
    /// This is not a hidden reservation price for english auction but a reservation price for
    /// AMM phase
    ReservationPrice,
    /// Treat amount as relative number of slots that needs to elapsed before auction starts
    RelativeSlot,
}

/// Instructions supported by the token swap program.
#[derive(Clone, Debug, PartialEq)]
pub enum AuctionInstruction {
    ///   Create Auction
    ///
    ///
    InitAuction {
        /// Owner authority which can add new reserves
        owner: Pubkey,

        /// number of shards, NFT will be fractionalized into
        shards: u64,

        /// number of shards retained by the creator of the pool (expressed as percent)
        retained_shards: u64,

        /// amount of quote token used to initialize AMM
        amount: u64,

        /// Wait time before bid is settled
        bid_timelock: u8,

        /// Type of wait before auction starts
        auction_start_type: AuctionStartType, // switch to enum

        /// Amount that defines when auction starts
        auction_start_amount: u64,
    },

    ///    Places bid by the user during  
    Bid {
        /// Bid amount
        amount: u64, // this amount should be locked and can be refunded to the bidder
    },

    ///     Settles auction after successful bid
    Settle {},

    ///     Allows shard holder withdraw tokens from vault after auction is settled
    Withdraw {
        ///  amount of shards that users is exchanging for quote token
        amount: u64,
    },

    ///     Allows shard holder withdraw tokens from vault after auction is settled
    CloseMarket {},
}

impl AuctionInstruction {
    /// Unpacks a byte buffer into a [AuctionInstruction](enum.AuctionInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input
            .split_first()
            .ok_or(AuctionError::InstructionUnpackError)?;
        Ok(match tag {
            0 => {
                let (owner, _rest) = Self::unpack_pubkey(rest)?;
                let (shards, rest) = Self::unpack_u64(rest)?;
                let (retained_shards, rest) = Self::unpack_u64(rest)?;
                let (amount, rest) = Self::unpack_u64(rest)?;
                let (bid_timelock, rest) = Self::unpack_u8(rest)?;
                let (auction_start_type, rest) = Self::unpack_u8(rest)?;
                let auction_start_type = AuctionStartType::from_u8(auction_start_type)
                    .ok_or(AuctionError::InstructionUnpackError)?;
                let (auction_start_amount, rest) = Self::unpack_u64(rest)?;

                Self::InitAuction {
                    owner,
                    shards,
                    retained_shards,
                    amount,
                    bid_timelock,
                    auction_start_type,
                    auction_start_amount,
                }
            }
            _ => return Err(AuctionError::InstructionUnpackError.into()),
        })
    }

    /// Packs a [AuctionInstruction](enum.AuctionInstruction.html) into a byte buffer.
    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(size_of::<Self>());
        match *self {
            Self::InitAuction {
                owner,
                shards,
                retained_shards,
                amount,
                bid_timelock,
                auction_start_type,
                auction_start_amount,
            } => {
                buf.push(0);
                buf.extend_from_slice(&owner.as_ref());
                buf.extend_from_slice(&shards.to_le_bytes());
                buf.extend_from_slice(&retained_shards.to_le_bytes());
                buf.extend_from_slice(&amount.to_le_bytes());
                buf.extend_from_slice(&bid_timelock.to_le_bytes());
                buf.extend_from_slice(&auction_start_type.to_u8().unwrap().to_le_bytes());
                buf.extend_from_slice(&auction_start_amount.to_le_bytes());
            }
            Self::Bid { amount } => {
                buf.push(1);
            }
            Self::Settle {} => {
                buf.push(2);
            }
            Self::Settle {} => {
                buf.push(3);
            }
            Self::Withdraw { amount } => {
                buf.push(4);
            }
            Self::CloseMarket {} => {
                buf.push(5);
            }
        }
        buf
    }

    fn unpack_pubkey(input: &[u8]) -> Result<(Pubkey, &[u8]), ProgramError> {
        if input.len() >= 32 {
            let (key, rest) = input.split_at(32);
            let pk = Pubkey::new(key);
            Ok((pk, rest))
        } else {
            Err(AuctionError::InvalidInstruction.into())
        }
    }

    fn unpack_u64(input: &[u8]) -> Result<(u64, &[u8]), ProgramError> {
        if input.len() >= 8 {
            let (amount, rest) = input.split_at(8);
            let amount = amount
                .get(..8)
                .and_then(|slice| slice.try_into().ok())
                .map(u64::from_le_bytes)
                .ok_or(AuctionError::InstructionUnpackError)?;
            Ok((amount, rest))
        } else {
            Err(AuctionError::InstructionUnpackError.into())
        }
    }

    fn unpack_u8(input: &[u8]) -> Result<(u8, &[u8]), ProgramError> {
        if !input.is_empty() {
            let (amount, rest) = input.split_at(1);
            let amount = amount
                .get(..1)
                .and_then(|slice| slice.try_into().ok())
                .map(u8::from_le_bytes)
                .ok_or(AuctionError::InstructionUnpackError)?;
            Ok((amount, rest))
        } else {
            Err(AuctionError::InstructionUnpackError.into())
        }
    }
}
