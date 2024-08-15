import { AnchorProvider } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import { requestAirdrop } from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import { getPuppetCounterAddressAndBump } from "../sdk/src/utils";
import { assert } from "chai";

describe("init", () => {
  const { wallet: walletAnchor, connection } = AnchorProvider.local();
  const owner = Keypair.generate();

  let protocol: Protocol;

  before(async () => {
    await requestAirdrop(connection, owner.publicKey, 1e14);

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);
  });

  it("init works", async () => {
    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );

    await protocol.init(owner);
  });

  it("cpi works", async () => {
    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );
    const puppet = await Puppet.build(Network.LOCAL, walletAnchor, connection);

    const [puppetCounterAddress, bump] = getPuppetCounterAddressAndBump(
      puppet.program.programId
    );

    await protocol.test(
      {
        puppetProgram: puppet.program.programId,
        counter: puppetCounterAddress,
        stateBump: bump,
      },
      owner
    );

    const stateAccount = await puppet.program.account.counter.fetch(
      puppetCounterAddress
    );
    assert.equal(stateAccount.owner?.toString(), owner.publicKey.toString());
    assert.equal(stateAccount.counter, 0);
    assert.equal(stateAccount.bump, bump);
  });
});
