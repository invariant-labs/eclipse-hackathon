use core::convert::TryInto;

use crate::{
    decimals::*,
    err, function, location, ok_or_mark_trace, trace,
    utils::{TrackableError, TrackableResult},
};

const MAX_TICK: i32 = 221_818;
pub const TICK_LIMIT: i32 = 44_364;

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

    if current_sqrt_price < lower_sqrt_price {
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
        let sqrt_price_diff = upper_sqrt_price
            .checked_sub(lower_sqrt_price)
            .map_err(|_| err!("Underflow while calculating sqrt price difference"))?;
        let liquidity = Liquidity::new(
            (U256::from(y.get())
                .checked_mul(U256::from(Price::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::MUL))?
                .checked_mul(U256::from(Liquidity::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::MUL))?
                .checked_div(U256::from(sqrt_price_diff.get()))
                .ok_or_else(|| err!(TrackableError::DIV))?)
            .try_into()
            .map_err(|_| err!("Overflow while calculating liquidity"))?,
        );
        return Ok(SingleTokenLiquidity {
            l: liquidity,
            amount: TokenAmount::new(0),
        });
    }

    let sqrt_price_diff = current_sqrt_price
        .checked_sub(lower_sqrt_price)
        .map_err(|_| err!("Underflow while calculating sqrt price difference"))?;
    let liquidity = Liquidity::new(
        (U256::from(y.get())
            .checked_mul(U256::from(Price::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_mul(U256::from(Liquidity::from_integer(1).get()))
            .ok_or_else(|| err!(TrackableError::MUL))?
            .checked_div(U256::from(sqrt_price_diff.get()))
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
            ((U256::from(common)
                .checked_add(U256::from(Liquidity::from_integer(1).get()))
                .ok_or_else(|| err!(TrackableError::ADD))?
                .checked_sub(U256::from(1))
                .ok_or_else(|| err!(TrackableError::SUB))?)
            .checked_div(U256::from(Liquidity::from_integer(1).get())))
            .ok_or_else(|| err!(TrackableError::DIV))?
            .try_into()
            .map_err(|_| err!("Overflow while casting to TokenAmount"))?,
        )
    } else {
        TokenAmount::new(
            (U256::from(common).checked_div(U256::from(Liquidity::from_integer(1).get())))
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

fn compute_lp_share_change(
    provide_liquidity: bool,
    liquidity_delta: Liquidity,
    x_before: TokenAmount, //fee + reserve + amount
    y_before: TokenAmount, //fee + reserve + amount
    tick_spacing: u16,
    current_tick_index: i32,
    current_sqrt_price: Price,
) -> TrackableResult<LiquidityChangeResult> {
    let max_tick = get_max_tick(tick_spacing);
    let min_tick = -max_tick;

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

    let new_liquidity = if provide_liquidity {
        Liquidity::new(current_liquidity.l.v + liquidity_delta.v)
    } else {
        current_liquidity
            .l
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

    // since the second position doesn't have an error,
    // the only way for leftovers to appear is from creating the initial position with fee
    let leftover_x = x_before - old_position_amounts.0;
    let leftover_y = y_before - old_position_amounts.1;

    if liquidity_delta.v == 0 {
        return Ok(LiquidityChangeResult {
            positions_details: PositionDetails {
                lower_tick: min_tick,
                upper_tick: max_tick,
                liquidity: new_liquidity,
            },
            transferred_amounts: (TokenAmount::new(0), TokenAmount::new(0)),
            leftover_amounts: (leftover_x, leftover_y),
        });
    }

    let (transferred_x, transferred_y) = if provide_liquidity {
        (
            new_position_amounts.0 - old_position_amounts.0,
            new_position_amounts.1 - old_position_amounts.1,
        )
    } else {
        (
            old_position_amounts.0 - new_position_amounts.0,
            old_position_amounts.1 - new_position_amounts.1,
        )
    };

    if transferred_x.v == 0 && transferred_y.v == 0 {
        Err(err!("Liquidity delta too small"))?
    }

    Ok(LiquidityChangeResult {
        positions_details: PositionDetails {
            lower_tick: min_tick,
            upper_tick: max_tick,
            liquidity: new_liquidity,
        },
        transferred_amounts: (transferred_x, transferred_y),
        leftover_amounts: (leftover_x, leftover_y),
    })
}

#[test]
fn test_compute_lp_share_change() {
    {
        let delta_liquidity = Liquidity::new(1);
        let current_liquidity = get_max_liquidity(
            TokenAmount::new(1000),
            TokenAmount::new(1000),
            -get_max_tick(1),
            get_max_tick(1),
            Price::from_integer(1),
            true,
        )
        .unwrap();

        let val = compute_lp_share_change(
            true,
            delta_liquidity,
            TokenAmount::new(1000),
            TokenAmount::new(1000),
            1,
            0,
            Price::from_integer(1),
        )
        .unwrap();
        assert_eq!(val.positions_details.liquidity.v, 1122110650);
        assert_eq!(
            val.positions_details.liquidity,
            current_liquidity.l + delta_liquidity
        );

        assert_eq!(
            val.transferred_amounts,
            (TokenAmount::new(1), TokenAmount::new(1))
        );
        assert_eq!(
            val.leftover_amounts,
            (TokenAmount::new(0), TokenAmount::new(0))
        );
    }
    {
        let delta_liquidity = Liquidity::new(10000);
        let current_liquidity = get_max_liquidity(
            TokenAmount::new(1000),
            TokenAmount::new(1000),
            -get_max_tick(1),
            get_max_tick(1),
            Price::from_integer(1),
            true,
        )
        .unwrap();

        let val = compute_lp_share_change(
            true,
            delta_liquidity,
            TokenAmount::new(1000),
            TokenAmount::new(1000),
            1,
            0,
            Price::from_integer(1),
        )
        .unwrap();
        assert_eq!(val.positions_details.liquidity.v, 1122120649);
        assert_eq!(
            val.positions_details.liquidity,
            current_liquidity.l + delta_liquidity
        );

        assert_eq!(
            val.transferred_amounts,
            (TokenAmount::new(1), TokenAmount::new(1))
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
            current_liquidity.l - Liquidity::new(1),
            TokenAmount::new(1),
            TokenAmount::new(1),
            1,
            0,
            Price::from_integer(1),
        )
        .unwrap_err();
        // withdraw at the exact amount
        compute_lp_share_change(
            false,
            current_liquidity.l,
            TokenAmount::new(1),
            TokenAmount::new(1),
            1,
            0,
            Price::from_integer(1),
        )
        .unwrap();
    }
}
