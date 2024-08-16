use core::convert::TryInto;

use crate::{
    decimals::*,
    err, function, location, ok_or_mark_trace, trace,
    utils::{TrackableError, TrackableResult},
};

const MAX_TICK: i32 = 221_818;
pub const TICK_LIMIT: i32 = 44_364;
pub const LOG2_MAX_FULL_RANGE_LIQUIDITY: u32 = 85;
pub const LOG2_MAX_TOKEN_ACCURACY: u32 = 64;
pub const ONE_LP_TOKEN: u64 = 2_u64 // starting point for the price of the token in the pool
    .pow(LOG2_MAX_FULL_RANGE_LIQUIDITY - LOG2_MAX_TOKEN_ACCURACY);

#[derive(Debug)]
pub struct LiquidityResult {
    pub x: TokenAmount,
    pub y: TokenAmount,
    pub l: Liquidity,
}

#[derive(Debug)]
pub struct SingleTokenLiquidity {
    pub l: Liquidity,
    pub amount: TokenAmount,
}

#[derive(Debug, Clone)]
pub struct PositionDetails {
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub liquidity: Liquidity,
}

#[derive(Debug, Clone)]
pub struct LiquidityChangeResult {
    positions_details: PositionDetails,
    transferred_amounts: (TokenAmount, TokenAmount),
    lp_token_change: Option<TokenAmount>,
    leftover_amounts: (TokenAmount, TokenAmount),
}

// converts ticks to price with reduced precision
pub fn calculate_sqrt_price(tick_index: i32) -> Price {
    // checking if tick be converted to price (overflows if more)
    let tick = tick_index.abs();
    assert!(tick <= MAX_TICK, "tick over bounds");

    let mut price = FixedPoint::from_integer(1);

    if tick & 0x1 != 0 {
        price *= FixedPoint::new(1000049998750);
    }
    if tick & 0x2 != 0 {
        price *= FixedPoint::new(1000100000000);
    }
    if tick & 0x4 != 0 {
        price *= FixedPoint::new(1000200010000);
    }
    if tick & 0x8 != 0 {
        price *= FixedPoint::new(1000400060004);
    }
    if tick & 0x10 != 0 {
        price *= FixedPoint::new(1000800280056);
    }
    if tick & 0x20 != 0 {
        price *= FixedPoint::new(1001601200560);
    }
    if tick & 0x40 != 0 {
        price *= FixedPoint::new(1003204964963);
    }
    if tick & 0x80 != 0 {
        price *= FixedPoint::new(1006420201726);
    }
    if tick & 0x100 != 0 {
        price *= FixedPoint::new(1012881622442);
    }
    if tick & 0x200 != 0 {
        price *= FixedPoint::new(1025929181080);
    }
    if tick & 0x400 != 0 {
        price *= FixedPoint::new(1052530684591);
    }
    if tick & 0x800 != 0 {
        price *= FixedPoint::new(1107820842005);
    }
    if tick & 0x1000 != 0 {
        price *= FixedPoint::new(1227267017980);
    }
    if tick & 0x2000 != 0 {
        price *= FixedPoint::new(1506184333421);
    }
    if tick & 0x4000 != 0 {
        price *= FixedPoint::new(2268591246242);
    }
    if tick & 0x8000 != 0 {
        price *= FixedPoint::new(5146506242525);
    }
    if tick & 0x0001_0000 != 0 {
        price *= FixedPoint::new(26486526504348);
    }
    if tick & 0x0002_0000 != 0 {
        price *= FixedPoint::new(701536086265529);
    }

    // Parsing to the Price type by the end by convention (should always have 12 zeros at the end)
    if tick_index >= 0 {
        Price::from_decimal(price)
    } else {
        Price::from_decimal(FixedPoint::from_integer(1).big_div(price))
    }
}

pub fn get_max_liquidity(
    x: TokenAmount,
    y: TokenAmount,
    lower_tick: i32,
    upper_tick: i32,
    current_sqrt_price: Price,
    rounding_up: bool,
) -> TrackableResult<LiquidityResult> {
    if lower_tick < -MAX_TICK || upper_tick > MAX_TICK {
        return Err(err!("Invalid Ticks"));
    }
    if lower_tick >= upper_tick {
        return Err(err!("lower tick >= upper tick"));
    }
    let lower_sqrt_price = calculate_sqrt_price(lower_tick);
    let upper_sqrt_price = calculate_sqrt_price(upper_tick);

    let result_by_y = ok_or_mark_trace!(get_liquidity_by_y_sqrt_price(
        y,
        lower_sqrt_price,
        upper_sqrt_price,
        current_sqrt_price,
        rounding_up,
    ))?;
    let result_by_x = ok_or_mark_trace!(get_liquidity_by_x_sqrt_price(
        x,
        lower_sqrt_price,
        upper_sqrt_price,
        current_sqrt_price,
        rounding_up,
    ))?;

    let result = if result_by_x.l > result_by_y.l {
        if result_by_x.amount <= y {
            LiquidityResult {
                x,
                y: result_by_x.amount,
                l: result_by_x.l,
            }
        } else {
            LiquidityResult {
                x: result_by_y.amount,
                y,
                l: result_by_y.l,
            }
        }
    } else {
        if result_by_y.amount <= x {
            LiquidityResult {
                x: result_by_y.amount,
                y,
                l: result_by_y.l,
            }
        } else {
            LiquidityResult {
                x,
                y: result_by_x.amount,
                l: result_by_x.l,
            }
        }
    };

    Ok(result)
}

pub fn get_liquidity_by_x_sqrt_price(
    x: TokenAmount,
    lower_sqrt_price: Price,
    upper_sqrt_price: Price,
    current_sqrt_price: Price,
    rounding_up: bool,
) -> TrackableResult<SingleTokenLiquidity> {
    if upper_sqrt_price < current_sqrt_price {
        return Err(err!("Upper Sqrt Price < Current Sqrt Price"));
    }

    if lower_sqrt_price > current_sqrt_price {
        return Err(err!("Lower Sqrt Price > Current Sqrt Price"));
    }

    let nominator = current_sqrt_price.big_mul(upper_sqrt_price);
    let denominator = upper_sqrt_price
        .checked_sub(current_sqrt_price)
        .map_err(|_| err!("Underflow while calculating denominator"))?;
    let liquidity = Liquidity::new(
        (U256::from(x.get())
            .checked_mul(U256::from(nominator.get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_mul(U256::from(Liquidity::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_div(U256::from(denominator.get()))
            .ok_or_else(|| err!(TrackableError::DIV))?)
        .try_into()
        .map_err(|_| err!("Overflow in calculating liquidity"))?,
    );

    let sqrt_price_diff = current_sqrt_price
        .checked_sub(lower_sqrt_price)
        .map_err(|_| err!("Underflow while calculating sqrt price difference"))?;
    let y = calculate_y(sqrt_price_diff, liquidity, rounding_up)?;
    Ok(SingleTokenLiquidity {
        l: liquidity,
        amount: y,
    })
}

pub fn get_liquidity_by_y_sqrt_price(
    y: TokenAmount,
    lower_sqrt_price: Price,
    upper_sqrt_price: Price,
    current_sqrt_price: Price,
    rounding_up: bool,
) -> TrackableResult<SingleTokenLiquidity> {
    if current_sqrt_price < lower_sqrt_price {
        return Err(err!("Current Sqrt Price < Lower Sqrt Price"));
    }

    if upper_sqrt_price <= current_sqrt_price {
        return Err(err!("Upper Sqrt Price < Lower Sqrt Price"));
    }

    let sqrt_price_diff = current_sqrt_price
        .checked_sub(lower_sqrt_price)
        .map_err(|_| err!("Underflow while calculating sqrt price difference"))?;
    let liquidity = Liquidity::new(
        (U192::from(y.get())
            .checked_mul(U192::from(Price::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_mul(U192::from(Liquidity::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_div(U192::from(sqrt_price_diff.get()))
            .ok_or_else(|| err!(TrackableError::DIV))?)
        .try_into()
        .map_err(|_| err!("Overflow while calculating liquidity"))?,
    );
    let denominator = current_sqrt_price.big_mul(upper_sqrt_price);
    let nominator = upper_sqrt_price
        .checked_sub(current_sqrt_price)
        .map_err(|_| err!("Underflow while calculating nominator"))?;

    let x = calculate_x(nominator, denominator, liquidity, rounding_up)?;

    Ok(SingleTokenLiquidity {
        l: liquidity,
        amount: x,
    })
}

pub fn calculate_x(
    nominator: Price,
    denominator: Price,
    liquidity: Liquidity,
    rounding_up: bool,
) -> TrackableResult<TokenAmount> {
    let common = liquidity.big_mul(nominator).big_div(denominator).get();

    Ok(if rounding_up {
        TokenAmount::new(
            ((U192::from(common)
                .checked_add(U192::from(Liquidity::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::ADD))?
                .checked_sub(U192::from(1))
                .ok_or_else(|| err!(TrackableError::SUB))?)
            .checked_div(U192::from(Liquidity::from_integer(1).get())))
            .ok_or_else(|| err!(TrackableError::DIV))?
            .try_into()
            .map_err(|_| err!("Overflow while casting to TokenAmount"))?,
        )
    } else {
        TokenAmount::new(
            (common.checked_div(Liquidity::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::DIV))?
                .try_into()
                .map_err(|_| err!("Overflow while casting to TokenAmount"))?,
        )
    })
}

pub fn calculate_y(
    sqrt_price_diff: Price,
    liquidity: Liquidity,
    rounding_up: bool,
) -> TrackableResult<TokenAmount> {
    let shifted_liquidity = liquidity
        .get()
        .checked_div(Liquidity::from_integer(1).get())
        .ok_or_else(|| err!(TrackableError::DIV))?;
    Ok(if rounding_up {
        TokenAmount::new(
            ((U256::from(sqrt_price_diff.get()).checked_mul(U256::from(shifted_liquidity)))
                .ok_or_else(|| err!(TrackableError::MUL))?
                .checked_add(U256::from(
                    Price::from_integer(1)
                        .get()
                        .checked_sub(1)
                        .ok_or_else(|| err!("Overflow while calculating TokenAmount"))?,
                ))
                .ok_or_else(|| err!(TrackableError::ADD))?)
            .checked_div(U256::from(Price::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::DIV))?
            .try_into()
            .map_err(|_| err!("Overflow in calculating TokenAmount"))?,
        )
    } else {
        TokenAmount::new(
            (U256::from(sqrt_price_diff.get())
                .checked_mul(U256::from(shifted_liquidity))
                .ok_or_else(|| err!(TrackableError::MUL))?
                .checked_div(U256::from(Price::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::DIV))?)
            .try_into()
            .map_err(|_| err!("Overflow in calculating TokenAmount"))?,
        )
    })
}

// delta x = (L * delta_sqrt_price) / (lower_sqrt_price * higher_sqrt_price)
pub fn get_delta_x(
    sqrt_price_a: Price,
    sqrt_price_b: Price,
    liquidity: Liquidity,
    up: bool,
) -> Option<TokenAmount> {
    let delta_price = if sqrt_price_a > sqrt_price_b {
        sqrt_price_a - sqrt_price_b
    } else {
        sqrt_price_b - sqrt_price_a
    };

    // log(2,  2^16 * 10^24 * 2^128 / 10^6 ) = 203.7
    let nominator = delta_price.big_mul_to_value(liquidity);
    match up {
        true => Price::big_div_values_to_token_up(
            nominator,
            sqrt_price_a.big_mul_to_value(sqrt_price_b),
        ),
        false => Price::big_div_values_to_token(
            nominator,
            sqrt_price_a.big_mul_to_value_up(sqrt_price_b),
        ),
    }
}

// delta y = L * delta_sqrt_price
pub fn get_delta_y(
    sqrt_price_a: Price,
    sqrt_price_b: Price,
    liquidity: Liquidity,
    up: bool,
) -> Option<TokenAmount> {
    let delta_price = if sqrt_price_a > sqrt_price_b {
        sqrt_price_a - sqrt_price_b
    } else {
        sqrt_price_b - sqrt_price_a
    };

    match match up {
        true => delta_price
            .big_mul_to_value_up(liquidity)
            .checked_add(Price::almost_one())
            .unwrap()
            .checked_div(Price::one())
            .unwrap()
            .try_into(),
        false => delta_price
            .big_mul_to_value(liquidity)
            .checked_div(Price::one())
            .unwrap()
            .try_into(),
    } {
        Ok(x) => Some(TokenAmount::new(x)),
        Err(_) => None,
    }
}

// converts ticks to price with reduced precision
pub fn calculate_price_sqrt(tick_index: i32) -> Price {
    // checking if tick be converted to price (overflows if more)
    let tick = tick_index.abs();
    assert!(tick <= MAX_TICK, "tick over bounds");

    let mut price = FixedPoint::from_integer(1);

    if tick & 0x1 != 0 {
        price *= FixedPoint::new(1000049998750);
    }
    if tick & 0x2 != 0 {
        price *= FixedPoint::new(1000100000000);
    }
    if tick & 0x4 != 0 {
        price *= FixedPoint::new(1000200010000);
    }
    if tick & 0x8 != 0 {
        price *= FixedPoint::new(1000400060004);
    }
    if tick & 0x10 != 0 {
        price *= FixedPoint::new(1000800280056);
    }
    if tick & 0x20 != 0 {
        price *= FixedPoint::new(1001601200560);
    }
    if tick & 0x40 != 0 {
        price *= FixedPoint::new(1003204964963);
    }
    if tick & 0x80 != 0 {
        price *= FixedPoint::new(1006420201726);
    }
    if tick & 0x100 != 0 {
        price *= FixedPoint::new(1012881622442);
    }
    if tick & 0x200 != 0 {
        price *= FixedPoint::new(1025929181080);
    }
    if tick & 0x400 != 0 {
        price *= FixedPoint::new(1052530684591);
    }
    if tick & 0x800 != 0 {
        price *= FixedPoint::new(1107820842005);
    }
    if tick & 0x1000 != 0 {
        price *= FixedPoint::new(1227267017980);
    }
    if tick & 0x2000 != 0 {
        price *= FixedPoint::new(1506184333421);
    }
    if tick & 0x4000 != 0 {
        price *= FixedPoint::new(2268591246242);
    }
    if tick & 0x8000 != 0 {
        price *= FixedPoint::new(5146506242525);
    }
    if tick & 0x0001_0000 != 0 {
        price *= FixedPoint::new(26486526504348);
    }
    if tick & 0x0002_0000 != 0 {
        price *= FixedPoint::new(701536086265529);
    }

    // Parsing to the Price type by the end by convention (should always have 12 zeros at the end)
    if tick_index >= 0 {
        Price::from_decimal(price)
    } else {
        Price::from_decimal(FixedPoint::from_integer(1).big_div(price))
    }
}

pub fn calculate_amount_delta(
    current_sqrt_price: Price,
    liquidity_delta: Liquidity,
    liquidity_sign: bool,
    current_tick_index: i32,
    lower_tick: i32,
    upper_tick: i32,
) -> Result<(TokenAmount, TokenAmount), String> {
    // assume that upper_tick > lower_tick
    let mut amount_x = TokenAmount::new(0);
    let mut amount_y = TokenAmount::new(0);

    if current_tick_index < lower_tick {
        amount_x = get_delta_x(
            calculate_price_sqrt(lower_tick),
            calculate_price_sqrt(upper_tick),
            liquidity_delta,
            liquidity_sign,
        )
        .unwrap();
    } else if current_tick_index < upper_tick {
        // calculating price_sqrt of current_tick is not required - can by pass
        amount_x = get_delta_x(
            current_sqrt_price,
            calculate_price_sqrt(upper_tick),
            liquidity_delta,
            liquidity_sign,
        )
        .unwrap();
        amount_y = get_delta_y(
            calculate_price_sqrt(lower_tick),
            current_sqrt_price,
            liquidity_delta,
            liquidity_sign,
        )
        .unwrap();
    } else {
        amount_y = get_delta_y(
            calculate_price_sqrt(lower_tick),
            calculate_price_sqrt(upper_tick),
            liquidity_delta,
            liquidity_sign,
        )
        .unwrap()
    }

    Ok((amount_x, amount_y))
}

pub fn get_max_tick(tick_spacing: u16) -> i32 {
    let limit_by_space = TICK_LIMIT
        .checked_sub(1)
        .unwrap()
        .checked_mul(tick_spacing.into())
        .unwrap();
    limit_by_space.min(MAX_TICK)
}

pub fn get_min_tick(tick_spacing: u16) -> i32 {
    let limit_by_space = (-TICK_LIMIT)
        .checked_add(1)
        .unwrap()
        .checked_mul(tick_spacing.into())
        .unwrap();
    limit_by_space.max(-MAX_TICK)
}

pub fn liquidity_to_lp_token_amount(
    lp_token_supply: TokenAmount,
    current_liquidity: Liquidity,
    liquidity_delta: Liquidity,
    rounding_up: bool,
) -> TrackableResult<TokenAmount> {
    if current_liquidity.get() == 0 {
        return Ok(TokenAmount::new(
            (liquidity_delta.get() / ONE_LP_TOKEN as u128)
                .try_into()
                .map_err(|_| err!("Conversion to LpToken failed"))?,
        ));
    }

    if rounding_up {
        let mut amount = TokenAmount::new(
            U192::from(liquidity_delta.get())
                .checked_mul(U192::from(lp_token_supply.get()))
                .ok_or(err!(TrackableError::MUL))?
                .checked_add(U192::from(
                    current_liquidity
                        .get()
                        .checked_sub(1)
                        .ok_or(err!(TrackableError::SUB))?,
                ))
                .ok_or(err!(TrackableError::ADD))?
                .checked_div(U192::from(current_liquidity.get()))
                .ok_or(err!(TrackableError::DIV))?
                .try_into()
                .map_err(|_| err!("Conversion to LpToken failed"))?,
        );

        return Ok(amount);
    }

    let amount = TokenAmount::new(
        U192::from(liquidity_delta.get())
            .checked_mul(U192::from(lp_token_supply.get()))
            .ok_or(err!(TrackableError::MUL))?
            .checked_div(U192::from(current_liquidity.get()))
            .ok_or(err!(TrackableError::DIV))?
            .try_into()
            .map_err(|_| err!("Conversion to LpToken failed"))?,
    );

    Ok(amount)
}

pub fn lp_token_amount_to_liquidity(
    lp_token_supply: TokenAmount,
    current_liquidity: Liquidity,
    lp_token_amount_delta: TokenAmount,
) -> TrackableResult<Liquidity> {
    if lp_token_supply.get() == 0 {
        return Ok(Liquidity::new(
            (lp_token_amount_delta.get() * ONE_LP_TOKEN) as u128,
        ));
    }

    let amount = Liquidity::new(
        U192::from(lp_token_amount_delta.get())
            .checked_mul(U192::from(current_liquidity.get()))
            .ok_or(err!(TrackableError::MUL))?
            .checked_div(U192::from(lp_token_supply.get()))
            .ok_or(err!(TrackableError::DIV))?
            .try_into()
            .map_err(|_| err!("Conversion to LpToken failed"))?,
    );

    Ok(amount)
}
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_liquidity_to_lp_token_amount() {
        let result = liquidity_to_lp_token_amount(
            TokenAmount::new(100),
            Liquidity::new(1000),
            Liquidity::new(10),
            false,
        )
        .unwrap();
        assert_eq!(result, TokenAmount::new(1));

        let result = lp_token_amount_to_liquidity(
            TokenAmount::new(101),
            Liquidity::new(1010),
            TokenAmount::new(1),
        )
        .unwrap();
        assert_eq!(result, Liquidity::new(10));
    }

    #[test]
    fn test_liquidity_to_lp_token_amount_limits() {
        let liquidity_delta = Liquidity::new(2_u128.pow(83) + 1);
        let current_liquidity = Liquidity::new(2_u128.pow(84) + 1);
        let init_supply = TokenAmount::new(2_u64.pow(63) + 1);

        let lp_tokens_minted =
            liquidity_to_lp_token_amount(init_supply, current_liquidity, liquidity_delta, false)
                .unwrap();
        assert_eq!(lp_tokens_minted, TokenAmount::new(4611686018427387904));

        let new_liquidity_delta = lp_token_amount_to_liquidity(
            init_supply + lp_tokens_minted,
            current_liquidity + liquidity_delta,
            lp_tokens_minted,
        )
        .unwrap();

        assert!(new_liquidity_delta.lt(&liquidity_delta));
        assert_eq!(
            new_liquidity_delta,
            Liquidity::new(9671406556917033396950358)
        );

        let new_lp_tokens_minted = liquidity_to_lp_token_amount(
            init_supply + lp_tokens_minted,
            current_liquidity + liquidity_delta,
            new_liquidity_delta,
            true,
        )
        .unwrap();

        assert_eq!(new_lp_tokens_minted, lp_tokens_minted);
    }

    pub fn compute_max_liquidity_position(
        x_before: TokenAmount,
        y_before: TokenAmount,
        min_tick: i32,
        max_tick: i32,
        current_tick_index: i32,
        current_sqrt_price: Price,
    ) -> TrackableResult<(TokenAmount, TokenAmount, Liquidity)> {
        let current_liquidity = get_max_liquidity(
            x_before,
            y_before,
            min_tick,
            max_tick,
            current_sqrt_price,
            true,
        )?;

        let old_position_amounts = calculate_amount_delta(
            current_sqrt_price,
            current_liquidity.l,
            true,
            current_tick_index,
            min_tick,
            max_tick,
        )
        .map_err(|_| err!("Failed to calculate old lp share token cost"))?;
        return Ok((
            old_position_amounts.0,
            old_position_amounts.1,
            current_liquidity.l,
        ));
    }

    fn compute_lp_share_change(
        provide_liquidity: bool,
        lp_token_supply: TokenAmount,
        liquidity_delta: Liquidity,
        x_before: TokenAmount, //fee + reserve + amount
        y_before: TokenAmount, //fee + reserve + amount
        tick_spacing: u16,
        current_tick_index: i32,
        current_sqrt_price: Price,
    ) -> TrackableResult<LiquidityChangeResult> {
        let max_tick = get_max_tick(tick_spacing);
        let min_tick = -max_tick;
        let (old_x, old_y, current_liquidity) = compute_max_liquidity_position(
            x_before,
            y_before,
            min_tick,
            max_tick,
            current_tick_index,
            current_sqrt_price,
        )?;

        // since the second position doesn't have an error,
        // the only way for leftovers to appear is from creating the initial position with fee
        let leftover_x = x_before - old_x;
        let leftover_y = y_before - old_y;

        if liquidity_delta.v == 0 {
            return Ok(LiquidityChangeResult {
                positions_details: PositionDetails {
                    lower_tick: min_tick,
                    upper_tick: max_tick,
                    liquidity: current_liquidity,
                },
                lp_token_change: None,
                transferred_amounts: (TokenAmount::new(0), TokenAmount::new(0)),
                leftover_amounts: (leftover_x, leftover_y),
            });
        }

        let new_liquidity = if provide_liquidity {
            current_liquidity
                .checked_add(liquidity_delta)
                .map_err(|_| err!(TrackableError::ADD))?
        } else {
            current_liquidity
                .checked_sub(liquidity_delta)
                .map_err(|_| err!(TrackableError::SUB))?
        };

        let new_position_amounts = calculate_amount_delta(
            current_sqrt_price,
            new_liquidity,
            true,
            current_tick_index,
            min_tick,
            max_tick,
        )
        .map_err(|_| err!("Failed to calculate new lp share token cost"))?;

        let (transferred_x, transferred_y) = if provide_liquidity {
            (
                new_position_amounts.0 - old_x,
                new_position_amounts.1 - old_y,
            )
        } else {
            (
                old_x - new_position_amounts.0,
                old_y - new_position_amounts.1,
            )
        };

        if transferred_x == TokenAmount::new(0) && transferred_y == TokenAmount::new(0) {
            Err(err!("Liquidity delta too small to create a deposit"))?
        }

        let lp_token_change = liquidity_to_lp_token_amount(
            lp_token_supply,
            current_liquidity,
            liquidity_delta,
            !provide_liquidity,
        )?;

        if lp_token_change == TokenAmount::new(0) {
            Err(err!("Liquidity delta too small to change LpToken amount"))?
        }

        Ok(LiquidityChangeResult {
            positions_details: PositionDetails {
                lower_tick: min_tick,
                upper_tick: max_tick,
                liquidity: new_liquidity,
            },
            lp_token_change: Some(lp_token_change),
            transferred_amounts: (transferred_x, transferred_y),
            leftover_amounts: (leftover_x, leftover_y),
        })
    }

    #[test]
    fn test_compute_lp_share_change() {
        {
            let delta_liquidity = Liquidity::new(ONE_LP_TOKEN as u128 * 1);
            let current_liquidity = get_max_liquidity(
                TokenAmount::new(0),
                TokenAmount::new(0),
                -get_max_tick(1),
                get_max_tick(1),
                Price::from_integer(1),
                true,
            )
            .unwrap();

            let val = compute_lp_share_change(
                true,
                TokenAmount(0),
                delta_liquidity,
                TokenAmount::new(0),
                TokenAmount::new(0),
                1,
                0,
                Price::from_integer(1),
            )
            .unwrap();
            assert_eq!(val.positions_details.liquidity.v, ONE_LP_TOKEN as u128);
            assert_eq!(
                val.positions_details.liquidity,
                current_liquidity.l + delta_liquidity
            );

            assert_eq!(val.lp_token_change.unwrap(), TokenAmount::new(1));

            assert_eq!(
                val.transferred_amounts,
                (TokenAmount::new(2), TokenAmount::new(2))
            );
            assert_eq!(
                val.leftover_amounts,
                (TokenAmount::new(0), TokenAmount::new(0))
            );
        }
        {
            let delta_liquidity = Liquidity::new(ONE_LP_TOKEN as u128 * 100);
            let current_liquidity = get_max_liquidity(
                TokenAmount::new(1000),
                TokenAmount::new(1000),
                -get_max_tick(1),
                get_max_tick(1),
                Price::from_integer(1),
                true,
            )
            .unwrap();

            let token_supply = liquidity_to_lp_token_amount(
                TokenAmount::new(0),
                Liquidity::new(0),
                current_liquidity.l,
                false,
            )
            .unwrap();

            let val = compute_lp_share_change(
                true,
                token_supply,
                delta_liquidity,
                TokenAmount::new(1000),
                TokenAmount::new(1000),
                1,
                0,
                Price::from_integer(1),
            )
            .unwrap();
            assert_eq!(val.positions_details.liquidity.v, 1331825849);
            assert_eq!(
                val.positions_details.liquidity,
                current_liquidity.l + delta_liquidity
            );

            assert_eq!(val.lp_token_change.unwrap(), TokenAmount::new(99));
            assert_eq!(
                val.transferred_amounts,
                (TokenAmount::new(187), TokenAmount::new(187))
            );
            assert_eq!(
                val.leftover_amounts,
                (TokenAmount::new(0), TokenAmount::new(0))
            );
        }
        {
            // withdraw below 0
            compute_lp_share_change(
                false,
                TokenAmount::new(1),
                Liquidity::new(1),
                TokenAmount::new(0),
                TokenAmount::new(0),
                1,
                0,
                Price::from_integer(1),
            )
            .unwrap_err();
        }
        {
            let current_liquidity = get_max_liquidity(
                TokenAmount::new(1),
                TokenAmount::new(1),
                -get_max_tick(1),
                get_max_tick(1),
                Price::from_integer(1),
                true,
            )
            .unwrap();
            // withdraw below liquidity amount
            compute_lp_share_change(
                false,
                TokenAmount::new(1),
                current_liquidity.l - Liquidity::new(1),
                TokenAmount::new(1),
                TokenAmount::new(1),
                1,
                0,
                Price::from_integer(1),
            )
            .unwrap_err();
        }
        {
            let current_liquidity = get_max_liquidity(
                TokenAmount::new(1000),
                TokenAmount::new(1000),
                -get_max_tick(1),
                get_max_tick(1),
                Price::from_integer(1),
                true,
            )
            .unwrap();
            // withdraw at the exact amount
            let result = compute_lp_share_change(
                false,
                TokenAmount::new(217),
                current_liquidity.l,
                TokenAmount::new(1000),
                TokenAmount::new(1000),
                1,
                0,
                Price::from_integer(1),
            )
            .unwrap();

            assert_eq!(result.lp_token_change.unwrap().0, 217)
        }
    }

    #[test]
    fn get_max_liquidity_full_range_limit_tick_spacing_100() {
        let max_liquidity = get_max_liquidity(
            TokenAmount::new(u64::MAX - 2_u64.pow(24)),
            TokenAmount::new(u64::MAX - 2_u64.pow(24)),
            -get_max_tick(100),
            get_max_tick(100),
            Price::from_integer(1),
            true,
        )
        .unwrap();
        assert_eq!(max_liquidity.l.v, 18447025555601329581907199); // < 2^84
    }

    #[test]
    fn get_max_liquidity_full_range_limit_tick_spacing_1() {
        let max_liquidity = get_max_liquidity(
            TokenAmount::new(u64::MAX - 2_u64.pow(24)),
            TokenAmount::new(u64::MAX - 2_u64.pow(24)),
            -get_max_tick(1),
            get_max_tick(1),
            Price::from_integer(1),
            true,
        )
        .unwrap();
        assert_eq!(max_liquidity.l.v, 20699287982049910463681759); // < 2^85
    }
}
