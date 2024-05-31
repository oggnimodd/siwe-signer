import { useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useSignMessage,
  useDisconnect,
  Connector,
  CreateConnectorFn,
} from "wagmi";
import { SiweMessage } from "siwe";

export type SupportedWalletProvider = "metamask" | "coinbase";

export interface WalletInfo {
  id: "io.metamask" | "com.coinbase.wallet";
  icon: string;
  label: string;
  connector?: () => Connector | CreateConnectorFn;
  downloadLink?: string;
}

export const supportedWallets: Record<SupportedWalletProvider, WalletInfo> = {
  coinbase: {
    id: "com.coinbase.wallet",
    icon: "/images/marketplace/wallet/coinbase.svg",
    label: "Coinbase Wallet",
    downloadLink: "https://www.coinbase.com/wallet",
  },
  metamask: {
    id: "io.metamask",
    icon: "/images/marketplace/wallet/metamask.png",
    label: "Metamask",
    downloadLink: "https://metamask.io/download/",
  },
};

const CORRECT_CHAIN_ID = 97;

const SignInWithEthereum = () => {
  const nonceRef = useRef<HTMLInputElement>(null);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [authenticated, setAuthenticated] = useState(false);
  const [signature, setSignature] = useState("");

  const handleConnect = async (walletId: WalletInfo["id"]) => {
    const walletInfo = Object.values(supportedWallets).find(
      (x) => x.id === walletId
    );
    const connector = connectors.find((x) => x.id === walletId) as Connector;

    if (!connector) {
      // TODO: display modal with link to download wallet extension
      console.log("Wallet not found");
      return;
    }

    try {
      await connector.switchChain?.({
        chainId: CORRECT_CHAIN_ID,
      });

      await connectAsync({
        connector: walletInfo?.connector ? walletInfo.connector() : connector,
      });

      // router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  const generateSignature = async () => {
    try {
      const nonce = nonceRef.current?.value;

      if (!nonce) {
        alert("Nonce is required");
        return;
      }

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum",
        uri: window.location.origin,
        version: "1",
        chainId: CORRECT_CHAIN_ID, // Use the expected chain ID here
        nonce,
      });

      const messageToSign = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageToSign });

      setSignature(signature);
      nonceRef.current.value = "";

      // const verifyResponse = await axios.post("/api/verify", {
      //   message: messageToSign,
      //   signature,
      //   address,
      // });
      // if (verifyResponse.data.authenticated) {
      //   setAuthenticated(true);
      // } else {
      //   setAuthenticated(false);
      // }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    disconnect();
    setAuthenticated(false);
  };

  return (
    <div>
      <span>
        <strong>**</strong>Nonce can be a random string or a number without any
        spaces or special characters and shoule be larger than 7 characters
      </span>

      <br />
      <br />

      {!isConnected ? (
        <>
          <button onClick={() => handleConnect("io.metamask")}>
            Connect Metamask
          </button>
          <button onClick={() => handleConnect("com.coinbase.wallet")}>
            Connect Coinbase
          </button>
        </>
      ) : authenticated ? (
        <div>
          <p>Authenticated: {address}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      ) : (
        <div>
          <input type="text" placeholder="Nonce" ref={nonceRef} />

          <button onClick={generateSignature}>Generate signature</button>

          {signature && <p id="signature">{signature}</p>}

          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default SignInWithEthereum;
