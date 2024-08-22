import { BN } from "@coral-xyz/anchor";
import {
  calculateAmountDelta,
  computeLpShareChange,
  getLiquidityByXInFullRange,
  getLiquidityByYInFullRange,
  getMaxLiquidity,
  liquidityToLpTokenAmount,
  lpTokenAmountToLiquidity,
} from "../sdk/src/math";
import { assert } from "chai";
import { getMaxTick, getMinTick } from "@invariant-labs/sdk-eclipse/lib/utils";
import { ONE_LP_TOKEN } from "../sdk/src/consts";

describe("math", () => {
  const minTick = getMinTick(1);
  const maxTick = -minTick;
  const providedAmount = new BN(430000);
  const sqrtPriceTickIndex = 100;
  const sqrtPrice = { v: new BN(1005012269622000000000000n) };
  const tickSpacing = 1;
  const liquidityDelta = { v: new BN(485220000000) };

  it("get liquidity by x works", () => {
    const { liquidity, y } = getLiquidityByXInFullRange(
      providedAmount,
      sqrtPrice,
      true,
      tickSpacing
    );

    assert.ok(liquidity.v.eq(new BN(485220000000)));
    assert.ok(y.eq(new BN(434852)));
  });

  it("get liquidity by y works", () => {
    const { liquidity, x } = getLiquidityByYInFullRange(
      providedAmount,
      sqrtPrice,
      true,
      tickSpacing
    );

    assert.ok(liquidity.v.eq(new BN(479806066830)));
    assert.ok(x.eq(new BN(425203)));
  });

  it("calculate amount delta works", () => {
    const { x, y } = calculateAmountDelta(
      sqrtPrice,
      liquidityDelta,
      true,
      sqrtPriceTickIndex,
      minTick,
      maxTick
    );

    assert.ok(x.v.eq(new BN(430000)));
    assert.ok(y.v.eq(new BN(434852)));
  });

  it("get max liquidity works", () => {
    const { liquidity } = getMaxLiquidity(
      { v: new BN(2n ** 64n - 1n - 2n ** 24n) },
      { v: new BN(2n ** 64n - 1n - 2n ** 24n) },
      getMinTick(100),
      getMaxTick(100),
      { v: new BN(10n ** 24n) },
      true
    );

    assert.ok(liquidity.v.eq(new BN(18447025809048884511436060n)));
  });

  it("liquidity to lp token amount works", () => {
    const result = liquidityToLpTokenAmount(
      { v: new BN(100) },
      { v: new BN(1000) },
      { v: new BN(10) },
      false
    );

    assert.ok(result.v.eq(new BN(1n)));
  });

  it("lp token amount to liquidity works", () => {
    const result = lpTokenAmountToLiquidity(
      { v: new BN(101) },
      { v: new BN(1010) },
      { v: new BN(1) }
    );

    assert.ok(result.v.eq(new BN(10n)));
  });

  it("compute lp share change works", () => {
    const deltaLiquidity = { v: new BN(ONE_LP_TOKEN * 1) };
    const currentLiquidity = getMaxLiquidity(
      { v: new BN(0) },
      { v: new BN(0) },
      -getMaxTick(1),
      getMaxTick(1),
      { v: new BN(10n ** 24n) },
      true
    );
    const val = computeLpShareChange(
      true,
      { v: new BN(0) },
      deltaLiquidity,
      { v: new BN(0) },
      { v: new BN(0) },
      1,
      0,
      { v: new BN(10n ** 24n) }
    );

    assert.ok(val.positionDetails.liquidity.v.eq(new BN(ONE_LP_TOKEN)));
    assert.ok(
      val.positionDetails.liquidity.v.eq(
        currentLiquidity.liquidity.v.add(deltaLiquidity.v)
      )
    );
    assert.ok(val.lpTokenChange?.v.eq(new BN(1)));
    assert.ok(val.transferredAmounts[0].v.eq(new BN(2)));
    assert.ok(val.transferredAmounts[1].v.eq(new BN(2)));
    assert.ok(val.leftoverAmounts[0].v.eq(new BN(0)));
    assert.ok(val.leftoverAmounts[1].v.eq(new BN(0)));
  });
});
