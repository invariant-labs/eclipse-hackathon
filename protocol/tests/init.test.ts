import { AnchorProvider } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import { INVARIANT_ADDRESS, requestAirdrop } from "./test-utils";
import { Market } from "@invariant-labs/sdk-eclipse";

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

    const market = await Market.build(
      Network.LOCAL,
      walletAnchor,
      connection,
      INVARIANT_ADDRESS
    );

    await protocol.init(owner, market);
  });
});
