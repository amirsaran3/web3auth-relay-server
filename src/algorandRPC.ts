import { SafeEventEmitterProvider } from "@web3auth/base";
import algosdk from "algosdk";

export default class AlgorandRPC {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  getAlgorandKeyPair = async (): Promise<any> => {
    var account = algosdk.generateAccount();
    var passphrase = algosdk.secretKeyToMnemonic(account.sk);
    console.log("My address: " + account.addr);
    console.log("My passphrase: " + passphrase);
  };
}
