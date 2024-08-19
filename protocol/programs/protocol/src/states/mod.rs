mod lp_pool;
mod state;

pub use lp_pool::LpPool;
pub use state::State;

pub const LP_TOKEN_IDENT: &'static [u8] = b"lp_tokenv1";

pub trait DerivedAccountIdentifier {
    const IDENT: &'static [u8];
}

#[macro_export]
macro_rules! size {
    ($name: ident) => {
        impl $name {
            pub const LEN: usize = $name::INIT_SPACE + 8;
        }
    };
}
