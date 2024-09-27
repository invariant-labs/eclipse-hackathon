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
import { Pair } from "@invariant-labs/sdk-eclipse";
import { fromFee } from "@invariant-labs/sdk-eclipse/lib/utils";
import { FeeTier, Market } from "@invariant-labs/sdk-eclipse/lib/market";
import { LpPoolStructure } from "../sdk/src/types";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

describe("init lp-pool", () => {
  const { wallet: walletAnchor, connection } = AnchorProvider.local();
  const owner = Keypair.generate();
  const wallet = Keypair.generate();
  const mintAuthority = Keypair.generate();

  let protocol: Protocol;
  let market: Market;
  const feeTier: FeeTier = {
    fee: fromFee(new BN(600)),
    tickSpacing: 10,
  };
  let pair: Pair;
  const initTick = 0;

  beforeEach(async () => {
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

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);
    protocol.init(owner, market);

    const [token0, token1] = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);
    pair = new Pair(token0, token1, feeTier);

    await initMarket(market, [pair], owner, initTick);
  });
  it("init", async () => {
    await protocol.initLpPool(
      {
        pair,
      },
      owner
    );
    const lpPool: LpPoolStructure = await protocol.getLpPool(pair);

    assert.ok(lpPool);
    assert.ok(lpPool.tokenX.equals(pair.tokenX));
    assert.ok(lpPool.tokenY.equals(pair.tokenY));
    assert.ok(lpPool.fee.v.eq(pair.feeTier.fee));
    assert.equal(lpPool.tickSpacing, pair.feeTier.tickSpacing);
    assert.notOk(lpPool.positionExists);
    assert.ok(lpPool.leftoverX.eq(new BN(0)));
    assert.ok(lpPool.leftoverY.eq(new BN(0)));

    const [lpToken] = protocol.getLpTokenAddressAndBump(pair);

    // create an account for the user
    const lpTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      lpToken,
      owner.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.equal(lpTokenAccountInfo.amount, 0n);
    }
  });
});
