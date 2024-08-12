import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createToken,
  initMarket,
  INVARIANT_ADDRESS,
  sleep,
} from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import { getPuppetCounterAddressAndBump } from "../sdk/src/utils";
import { assert } from "chai";
import { Market, Pair } from "@invariant-labs/sdk";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { fromFee } from "@invariant-labs/sdk/lib/utils";
import { FeeTier } from "@invariant-labs/sdk/lib/market";

describe("init", () => {
  const { wallet, connection } = AnchorProvider.local();
  const owner = Keypair.generate();

  before(async () => {
    await Promise.all([connection.requestAirdrop(owner.publicKey, 1e14)]);
    await sleep(1000);
  });

  it("init works", async () => {
    const protocol = await Protocol.build(Network.LOCAL, wallet, connection);
    const puppet = await Puppet.build(Network.LOCAL, wallet, connection);

    await protocol.init(owner);
  });

  it("cpi works", async () => {
    const protocol = await Protocol.build(Network.LOCAL, wallet, connection);
    const puppet = await Puppet.build(Network.LOCAL, wallet, connection);

    const [puppetCounterAddress, bump] = await getPuppetCounterAddressAndBump(
      puppet.program.programId
    );

    await protocol.test(
      {
        puppetProgram: puppet.program.programId,
        counter: puppetCounterAddress,
      },
      bump,
      owner
    );

    const stateAccount = await puppet.program.account.counter.fetch(
      puppetCounterAddress
    );
    assert.equal(stateAccount.owner.toString(), owner.publicKey.toString());
    assert.equal(stateAccount.counter, 0);
    assert.equal(stateAccount.bump, bump);
  });

  it("can deploy invariant", async () => {
    const market = await Market.build(
      Network.LOCAL,
      wallet,
      connection,
      new PublicKey(INVARIANT_ADDRESS)
    );

    const mintAuthority = Keypair.generate();
    const tokens = await Promise.all([
      createToken(connection, owner, mintAuthority),
      createToken(connection, owner, mintAuthority),
    ]);

    const feeTier: FeeTier = { fee: fromFee(new BN(20)), tickSpacing: 4 };
    const pair = new Pair(tokens[0].publicKey, tokens[1].publicKey, feeTier);

    await initMarket(market, [pair], owner, 0);
  });
});
