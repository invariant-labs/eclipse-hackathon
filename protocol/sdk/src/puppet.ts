import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getPuppetProgramAddress, Network } from "./network";
import { IWallet } from "./wallet";
import { Program } from "@coral-xyz/anchor";
import { Puppet as PuppetProgram } from "./idl/puppet";
import { PUPPET_SEED } from "./consts";
import { signAndSend } from "./utils";
import { ITransaction } from "./types";
import IDL from "./idl/puppet.json";

export class Puppet {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<PuppetProgram>;
  public programAuthority: PublicKey = PublicKey.default;

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    this.program = new Program(IDL as PuppetProgram);
  }

  async getProgramAuthority() {
    const [programAuthority, nonce] = PublicKey.findProgramAddressSync(
      [Buffer.from(PUPPET_SEED)],
      this.program.programId
    );

    return {
      programAuthority,
      nonce,
    };
  }

  public static async build(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ): Promise<Puppet> {
    const instance = new Puppet(network, wallet, connection);
    instance.programAuthority = (
      await instance.getProgramAuthority()
    ).programAuthority;

    return instance;
  }
}
