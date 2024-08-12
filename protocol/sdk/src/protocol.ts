import {
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getProtocolProgramAddress, Network } from "./network";
import { IWallet } from "./wallet";
import { BN, Program } from "@coral-xyz/anchor";
import { IDL, Protocol as ProtocolProgram } from "./idl/protocol";
import { ITransaction, TestAccounts } from "./types";
import {
  getProgramAuthorityAddressAndBump,
  getProtocolStateAddress,
  getProtocolStateAddressAndBump,
  signAndSend,
} from "./utils";
import { PROTOCOL_STATE_SEED } from "./consts";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export class Protocol {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<ProtocolProgram>;

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    const programAddress = getProtocolProgramAddress(network);
    this.program = new Program(IDL, programAddress);
  }

  getProgramAuthority() {
    const [programAuthority, nonce] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_STATE_SEED)],
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
    const [programAuthority, programAuthorityBump] =
      getProgramAuthorityAddressAndBump(this.program.programId);

    const [state] = getProtocolStateAddressAndBump(this.program.programId);

    return await this.program.methods
      .init(programAuthorityBump)
      .accounts({
        admin: signer.publicKey,
        programAuthority,
        state,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async test(
    accounts: TestAccounts,
    stateBump: number,
    signer: Keypair
  ): Promise<any> {
    const { tx } = await this.testTx(accounts, stateBump, signer);

    return await signAndSend(tx, [signer], this.connection);
  }

  async testTx(
    accounts: TestAccounts,
    stateBump: number,
    signer: Keypair
  ): Promise<ITransaction> {
    const ix = await this.testIx(accounts, stateBump, signer);

    return {
      tx: new Transaction().add(ix),
    };
  }

  async testIx(
    accounts: TestAccounts,
    stateBump: number,
    signer: Keypair
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .test(stateBump)
      .accounts({
        payer: signer.publicKey,
        systemProgram: SystemProgram.programId,
        ...accounts,
      })
      .instruction();
  }

  async mint(
    tokenMint: PublicKey,
    to: PublicKey,
    amount: BN,
    signer: Keypair
  ): Promise<any> {
    const { tx } = await this.mintTx(tokenMint, to, amount);
    return await signAndSend(tx, [signer], this.connection);
  }

  async mintTx(
    tokenMint: PublicKey,
    to: PublicKey,
    amount: BN
  ): Promise<ITransaction> {
    const ix = await this.mintIx(tokenMint, to, amount);
    return {
      tx: new Transaction().add(ix),
    };
  }

  async mintIx(
    tokenMint: PublicKey,
    to: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    const state = getProtocolStateAddress(this.program.programId);
    const [programAuthority] = getProgramAuthorityAddressAndBump(
      this.program.programId
    );

    return await this.program.methods
      .mint(amount)
      .accounts({
        state,
        programAuthority,
        tokenMint,
        to,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }
}
