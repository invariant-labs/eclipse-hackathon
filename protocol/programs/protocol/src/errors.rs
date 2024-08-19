use anchor_lang::prelude::*;
use std::convert::TryInto;

// Define errors, custom error code: 300 + idx => 0x12C + 0x${idx}
#[error_code(offset = 300)]
pub enum ErrorCode {
    #[msg("[S001] ErrorExample")] //0x12C (300)
    ErrorExample,
    #[msg("Provided authority is different than expected")]
    InvalidAuthority = 1, //0x12D (301)
    #[msg("Provided mint account is different than expected")]
    InvalidMint = 2, //0x12E (302)
    #[msg("Provided owner account is different than expected")]
    InvalidOwner = 3, //0x12F (303)
    #[msg("Provided Invariant authority is different than expected")]
    InvalidInvariantAuthority = 4, //0x130 (304)
    #[msg("Provided Token Program for Token is different than expected")]
    InvalidTokenProgram = 5, //0x131 (305)
}

impl TryInto<ErrorCode> for u32 {
    type Error = (); // Error if u32 is out of range

    fn try_into(self) -> std::result::Result<ErrorCode, ()> {
        if (300..=320).contains(&self) {
            Ok(unsafe { std::mem::transmute(self - 300) })
        } else {
            Err(())
        }
    }
}
