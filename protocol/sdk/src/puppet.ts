import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getPuppetProgramAddress, Network } from "./network";
import { IWallet } from "./wallet";
import { Program, utils } from "@coral-xyz/anchor";
import { IDL, Puppet as PuppetProgram } from "./idl/puppet";
import { PUPPET_COUNTER_SEED } from "./consts";
import { signAndSend } from "./utils";
import { ITransaction } from "./types";

export class Puppet {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<PuppetProgram>;
  public counterAddressAndBump: [PublicKey, number];

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    const programAddress = getPuppetProgramAddress(network);
    this.program = new Program(IDL, programAddress);
    this.counterAddressAndBump = PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode(PUPPET_COUNTER_SEED))],
      this.program.programId
    );
  }

  getCounterAddressAndBump() {
    return this.counterAddressAndBump;
  }

  getCounterAddress() {
    return this.counterAddressAndBump[0];
  }

  public static async build(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ): Promise<Puppet> {
    const instance = new Puppet(network, wallet, connection);

    return instance;
  }
}
