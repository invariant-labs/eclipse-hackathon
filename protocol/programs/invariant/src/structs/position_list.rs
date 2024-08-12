use anchor_lang::prelude::*;

use crate::account_size;

#[account(zero_copy(unsafe))]
#[repr(packed)]
#[derive(PartialEq, Default, Debug, InitSpace)]
pub struct PositionList {
    pub head: u32,
    pub bump: u8,
}

account_size!(PositionList);
