import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getProgramAddress, Network } from "./network";
import { IWallet } from "./wallet";
import { Program } from "@coral-xyz/anchor";
import { IDL, Protocol as ProtocolProgram } from "./idl/protocol";
import { ITransaction } from "./types";
import { SEED } from "./consts";
import { signAndSend } from "./utils";

export class Protocol {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<ProtocolProgram>;
  public programAuthority: PublicKey = PublicKey.default;

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    const programAddress = getProgramAddress(network);
    this.program = new Program(IDL, programAddress);
  }

  async getProgramAuthority() {
    const [programAuthority, nonce] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED)],
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
  ): Promise<Protocol> {
    const instance = new Protocol(network, wallet, connection);
    instance.programAuthority = (
      await instance.getProgramAuthority()
    ).programAuthority;

    return instance;
  }

  async init(signer: Keypair): Promise<any> {
    const { tx } = await this.initTx(signer);

    return await signAndSend(tx, [signer], this.connection);
  }

  async initTx(signer: Keypair): Promise<ITransaction> {
    const ix = await this.initIx(signer);
    return {
      tx: new Transaction().add(ix),
    };
  }

  async initIx(signer: Keypair): Promise<TransactionInstruction> {
    return await this.program.methods
      .init()
      .accounts({
        payer: signer.publicKey,
      })
      .instruction();
  }
}
