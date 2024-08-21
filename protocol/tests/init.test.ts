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
});
