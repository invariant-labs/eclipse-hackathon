import { AnchorProvider } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import { sleep } from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import { getPuppetCounterAddressAndBump } from "../sdk/src/utils";
import { assert } from "chai";

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
});
