use anchor_lang::prelude::*;
use std::convert::TryInto;

// Define errors, custom error code: 300 + idx => 0x12C + 0x${idx}
#[error_code(offset = 300)]
pub enum ErrorCode {
    #[msg("[S001] ErrorExample")] //0x12C (300)
    ErrorExample,
    #[msg("Provided authority is different than expected")]
    InvalidAuthority = 1, // 301
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
