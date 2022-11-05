import { SafeEventEmitterProvider } from "@web3auth/base";
import { connect, KeyPair, keyStores,  Contract } from "near-api-js";
import { base_encode } from "near-api-js/lib/utils/serialize";
import { parseNearAmount } from "near-api-js/lib/utils/format";

export default class NearRPC {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    console.log("provider", provider);
    this.provider = provider;
  }

  makeConnection = async () => {
    const pk58 = await this.getAccount();
    const accountId = Buffer.from(pk58.data).toString('hex');
    // const accountId = "amirsaran333.testnet";

    console.log("accountId", accountId);

    const myKeyStore = new keyStores.InMemoryKeyStore();
    const keyPair = await this.getNearKeyPair();
    await myKeyStore.setKey("testnet", accountId, keyPair);

    console.log("keyPair", keyPair);


    // connections can be made to any network
    // refer https://docs.near.org/tools/near-api-js/quick-reference#connect

    const connectionConfig = {
      networkId: "testnet",
      keyStore: myKeyStore, // first create a key store
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    };
    const nearConnection = await connect(connectionConfig);

    const account = await nearConnection.account(accountId);
    console.log("account", account);

    console.log("account signer", (await account.connection.signer.getPublicKey(accountId, "testnet")));

    const contract = new Contract(account, "guest-book.testnet", {
      viewMethods: ["getMessages"],
      changeMethods: ["addMessage"],
    });
    console.log("contract", contract);
    (contract as any).addMessage({ text: "testing web3auth" }, 300000000000000).then((res: any) => {
      console.log(res);
    })
  };
  getNearKeyPair = async (): Promise<KeyPair> => {
    const privateKey = (await this.provider.request({
      method: "private_key",
    })) as string;
    
    const keyPair = KeyPair.fromString(base_encode(privateKey));
    // const keyPair = KeyPair.fromString("4PsCZH7eUghaHhX1YBuqZ69e2HwdpB7kiDt2C9LxL6CA7xgFqmrAAEit7NQerDrKCRTVSgu2EjVFqhKxvdsTew9Q");
    return keyPair;
  };

  getAccount = async () => {
    const keyPair = await this.getNearKeyPair();
    console.log("public_key", keyPair?.getPublicKey().toString());
    console.log("account_id", Buffer.from(keyPair.getPublicKey().data).toString('hex'));
    return keyPair?.getPublicKey();
  };

  getBalance = async () => {
    try {
      const keyPair = await this.getNearKeyPair();
      // keyPair.pkh is the account address.
      // const balance =
      // return balance;
    } catch (error) {
      return error;
    }
  };

  signTransaction = async () => {
    try {
      // reference https://docs.near.org/integrator/create-transactions#sign-transaction
      const keyPair = await this.getNearKeyPair();
      const amount = parseNearAmount("0.1");
    } catch (error) {
      console.error(error);
    }
  };
}
