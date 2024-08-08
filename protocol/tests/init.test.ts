import { AnchorProvider } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import { sleep } from "./test-utils";
import { getStateAddress } from "../sdk/src/utils";
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

    await protocol.init(owner);
  });
});
