import { useEffect, useState } from "react";
import { Web3AuthCore } from "@web3auth/core";
import {
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import "./App.css";
import { InMemorySigner, keyStores, providers, utils } from "near-api-js";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { signTransactions } from "@near-wallet-selector/wallet-utils";
import { Network, NetworkId, Transaction } from "@near-wallet-selector/core";

const NETWORK_ID = "testnet";
const RPC_URL = "https://rpc.testnet.near.org";

type UrlParams = {
  action: string | null;
  originUrl: string | null;
  clientId: string | null;
  loginProvider: string | null;
  email: string | null;
  contractId: string | null;
  transaction: string | null;
};

function App() {
  const [web3auth, setWeb3Auth] = useState<Web3AuthCore>();
  const [urlParams, setUrlParams] = useState<UrlParams>();

  const getAccountIdFromPublicKey = (publicKeyData: Uint8Array) => {
    return Buffer.from(publicKeyData).toString("hex");
  };
  
  const getKeyPair = async (
    provider: SafeEventEmitterProvider | null,
    keyStore: keyStores.InMemoryKeyStore,
  ) => {
    if (!provider) {
      return;
    }

    const privateKey = await provider.request<string>({
      method: "private_key",
    });
  
    if (!privateKey) {
      throw new Error("No private key found");
    }
  
    const finalPrivKey = getED25519Key(privateKey).sk;
  
    const keyPair = utils.key_pair.KeyPairEd25519.fromString(
      utils.serialize.base_encode(finalPrivKey)
    );
  
    const accountId = getAccountIdFromPublicKey(keyPair.getPublicKey().data);
  
    keyStore.setKey("testnet", accountId, keyPair);
  
    return keyPair;
  };

  const signIn = async () => {
    if (!web3auth) {
      throw new Error("web3auth not found");
    }

    if (!urlParams) {
      throw new Error("urlParams not found");
    }

    if (!urlParams.originUrl) {
      throw new Error("originUrl parameter missing");
    }

    const url = new URL(urlParams.originUrl);

    const openloginProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: urlParams.loginProvider,
      }
    );

    const keyStore = new keyStores.InMemoryKeyStore();
    const signer = new InMemorySigner(keyStore);
    const keyPair = await getKeyPair(openloginProvider, keyStore);

    if (keyPair) {
      const publicKey = keyPair.getPublicKey();
      const accountId = getAccountIdFromPublicKey(publicKey.data);

      const provider = new providers.JsonRpcProvider({
        url: RPC_URL,
      });
      
      const block = await provider.block({ finality: "final" });

      const data = {
        accountId,
        message: "some message",
        blockId: block.header.hash,
        publicKey: Buffer.from(publicKey.data).toString("base64"),
        keyType: publicKey.keyType,
      };

      const signed = await signer.signMessage(
        new Uint8Array(Buffer.from(JSON.stringify(data))),
        accountId,
        NETWORK_ID
      );

      const encoded = Buffer.from(JSON.stringify({
        ...data,
        keyType: signed.publicKey.keyType,
      })).toString("base64");

      url.searchParams.set("web3authVerify", encoded);
      url.searchParams.set("signature", Buffer.from(signed.signature).toString("base64"));
      window.location.assign(url.toString());
    }
  }

  const signOut = async (web3auth: Web3AuthCore, url: URL) => {
    await web3auth.logout();  
    window.location.assign(url.toString());
  }

  const getNetworkPreset = (networkId: NetworkId): Network => {
    switch (networkId) {
      case "mainnet":
        return {
          networkId,
          nodeUrl: "https://rpc.mainnet.near.org",
          helperUrl: "https://helper.mainnet.near.org",
          explorerUrl: "https://explorer.near.org",
          indexerUrl: "https://api.kitwallet.app",
        };
      case "testnet":
        return {
          networkId,
          nodeUrl: "https://rpc.testnet.near.org",
          helperUrl: "https://helper.testnet.near.org",
          explorerUrl: "https://explorer.testnet.near.org",
          indexerUrl: "https://testnet-api.kitwallet.app",
        };
      default:
        throw Error(`Failed to find config for: '${networkId}'`);
    }
  };

  const signTransaction = async (openloginProvider: SafeEventEmitterProvider, transaction: Transaction) => {
    const keyStore = new keyStores.InMemoryKeyStore();
    const signer = new InMemorySigner(keyStore);
    const keyPair = await getKeyPair(openloginProvider, keyStore);

    if (!keyPair) {
      throw new Error("No keyPair");
    }

    const [signedTx] = await signTransactions(
      [transaction],
      signer,
      getNetworkPreset(NETWORK_ID),
    );

    return signedTx;
  };

  const approveTransaction = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized");
    }

    if (!web3auth.provider) {
      throw new Error("web3auth.provider not found");
    }

    if (!urlParams) {
      throw new Error("urlParams not found");
    }

    if (!urlParams.transaction) {
      throw new Error("urlParams.transaction not found");
    }
    
    const transaction: Transaction = JSON.parse(Buffer.from(urlParams.transaction, "base64").toString());
    
    const signedTx = await signTransaction(web3auth.provider, transaction);
    
    if (!urlParams.originUrl) {
      throw new Error("urlParams.originUrl not found");
    }

    const url = new URL(urlParams.originUrl);
    url.searchParams.set("signedTransaction", Buffer.from(signedTx.encode()).toString("base64"));

    window.location.assign(url.toString());
  };

  const parseUrlParams = (): UrlParams => {
    const url = new URL(window.location.href);

    return {
      action: url.searchParams.get("action"),
      originUrl: url.searchParams.get("originUrl"),
      clientId: url.searchParams.get("clientId"),
      loginProvider: url.searchParams.get("loginProvider"),
      email: url.searchParams.get("email"),
      contractId: url.searchParams.get("contractId"),
      transaction: url.searchParams.get("transaction"),
    };
  }

  useEffect(() => {
    const init = async () => {
      const urlParams = parseUrlParams();
      setUrlParams(urlParams);

      if (!urlParams.clientId) {
        throw new Error("clientId parameter missing");
      }

      try {
        const web3auth = new Web3AuthCore({
          clientId: urlParams.clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.OTHER,
            rpcTarget: RPC_URL
          },
        });

        setWeb3Auth(web3auth);

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            clientId: urlParams.clientId,
            network: NETWORK_ID,
            uxMode: "popup",
          },
          loginSettings: {
            curve: "ed25519",
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        await web3auth.init();

        if (!web3auth) {
          console.log("web3auth not initialized yet");
          return;
        }

        if (!urlParams.originUrl) {
          throw new Error("originUrl parameter missing");
        }

        const url = new URL(urlParams.originUrl);

        if (urlParams.action === "signOut") {
          signOut(web3auth, url);
        }
      } catch (error) {
        if (urlParams.originUrl) {
          console.log(":::::", error);
          // const url = new URL(urlParams.originUrl);
          // window.location.assign(url.toString());
        }
      }
    };

    init();
  }, []);

  

  return (
    <div>
      {urlParams && urlParams.action === "signIn" && <button onClick={signIn}>Connect</button>}
      {urlParams && urlParams.action === "signTransaction" && <button onClick={approveTransaction}>Approve</button>}
    </div>
  );
}

export default App;
