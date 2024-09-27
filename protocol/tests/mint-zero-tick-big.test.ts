import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createTokenMint,
  initMarket,
  INVARIANT_ADDRESS,
  requestAirdrop,
} from "./test-utils";
import { assert } from "chai";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Pair } from "@invariant-labs/sdk-eclipse";
import {
  fromFee,
  getMaxTick,
  getMinTick,
} from "@invariant-labs/sdk-eclipse/lib/utils";
import {
  CreateTick,
  FeeTier,
  Market,
} from "@invariant-labs/sdk-eclipse/lib/market";
import { lpTokenAmountToLiquidity, ONE_LP_TOKEN } from "../sdk/src";

describe("mint lp token", () => {
  const { wallet: walletAnchor, connection } = AnchorProvider.local();
  const owner = Keypair.generate();
  const wallet = Keypair.generate();
  const mintAuthority = Keypair.generate();

  let protocol: Protocol;
  let market: Market;
  const feeTier: FeeTier = {
    fee: fromFee(new BN(600)),
    tickSpacing: 5,
  };
  let pair: Pair;
  let userTokenXAccountAddress: PublicKey;
  let userTokenYAccountAddress: PublicKey;
  let positionAddress: PublicKey;

  const lowerTick = getMinTick(feeTier.tickSpacing ? feeTier.tickSpacing : 0);
  const upperTick = getMaxTick(feeTier.tickSpacing ? feeTier.tickSpacing : 0);
  const initTick = 0;

  const positionId = 0;

  before(async () => {
    let giveSOL = [owner.publicKey, mintAuthority.publicKey, wallet.publicKey];
    await Promise.all(
      giveSOL.map((account) => requestAirdrop(connection, account, 1e14))
    );

    market = await Market.build(
      Network.LOCAL,
      walletAnchor,
      connection,
      INVARIANT_ADDRESS
    );

    const [token0, token1] = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);
    pair = new Pair(token0, token1, feeTier);
  });
  describe("with initTick = 0", async () => {
    before(async () => {
      await initMarket(market, [pair], owner, initTick);

      protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);
      await protocol.init(owner, market);

      const lowerTickVars: CreateTick = {
        pair,
        index: lowerTick,
        payer: owner.publicKey,
      };
      const upperTickVars: CreateTick = {
        pair,
        index: upperTick,
        payer: owner.publicKey,
      };
      await market.createTick(lowerTickVars, owner);
      await market.createTick(upperTickVars, owner);

      const xOwnerAmount = 1e15;
      const yOwnerAmount = 1e15;

      const userTokenXAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        owner,
        pair.tokenX,
        owner.publicKey
      );
      const userTokenYAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        owner,
        pair.tokenY,
        owner.publicKey
      );

      await mintTo(
        connection,
        owner,
        pair.tokenX,
        userTokenXAccount.address,
        mintAuthority,
        xOwnerAmount
      );
      await mintTo(
        connection,
        owner,
        pair.tokenY,
        userTokenYAccount.address,
        mintAuthority,
        yOwnerAmount
      );
      userTokenXAccountAddress = getAssociatedTokenAddressSync(
        pair.tokenX,
        owner.publicKey
      );
      userTokenYAccountAddress = getAssociatedTokenAddressSync(
        pair.tokenY,
        owner.publicKey
      );

      positionAddress = (
        await market.getPositionAddress(protocol.programAuthority, positionId)
      ).positionAddress;
    });

    it("big init mint", async () => {
      await protocol.initLpPool(
        {
          pair,
        },
        owner
      );

      const [tokenLp] = protocol.getLpTokenAddressAndBump(pair);
      const accountLpAddress = getAssociatedTokenAddressSync(
        tokenLp,
        owner.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const getlpTokenAccount = async () => {
        return getAccount(
          connection,
          accountLpAddress,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
      };

      await protocol.mintLpToken(
        {
          pair,
          invariant: market,
          liquidityDelta: new BN(ONE_LP_TOKEN * 200000000),
          position: positionAddress,
          accountX: userTokenXAccountAddress,
          accountY: userTokenYAccountAddress,
        },
        owner
      );

      let accountLp = await getlpTokenAccount();
      let lpPool = await protocol.getLpPool(pair);
      assert.equal(accountLp.amount, 200000000n);
      assert.equal(lpPool.leftoverX, 0);
      assert.equal(lpPool.leftoverY, 0);

      let failed = false;
      try {
        await protocol.mintLpToken(
          {
            pair,
            invariant: market,

            liquidityDelta: new BN(ONE_LP_TOKEN - 1),
            position: positionAddress,
            accountX: userTokenXAccountAddress,
            accountY: userTokenYAccountAddress,
          },
          owner
        );
      } catch (e) {
        failed = true;
      }

      assert(failed, "Mint below expected liquidity amount worked");

      await protocol.mintLpToken(
        {
          pair,
          invariant: market,
          liquidityDelta: new BN(ONE_LP_TOKEN),
          position: positionAddress,
          accountX: userTokenXAccountAddress,
          accountY: userTokenYAccountAddress,
        },
        owner
      );
      lpPool = await protocol.getLpPool(pair);
      accountLp = await getlpTokenAccount();
      const position = await market.getPosition(
        protocol.programAuthority,
        positionId
      );
      assert.equal(accountLp.amount, 200000001n);
      assert.equal(lpPool.leftoverX, 0);
      assert.equal(lpPool.leftoverY, 0);

      let deltaLiquidity = lpTokenAmountToLiquidity(
        { v: new BN(accountLp.amount) },
        position.liquidity,
        { v: new BN(1) },
        true
      );

      await protocol.mintLpToken(
        {
          pair,
          invariant: market,
          liquidityDelta: deltaLiquidity.v,
          position: positionAddress,
          accountX: userTokenXAccountAddress,
          accountY: userTokenYAccountAddress,
        },
        owner
      );

      lpPool = await protocol.getLpPool(pair);
      accountLp = await getlpTokenAccount();
      assert.equal(accountLp.amount, 200000002n);
      assert.equal(lpPool.leftoverX, 0);
      assert.equal(lpPool.leftoverY, 0);
    });
  });
});
