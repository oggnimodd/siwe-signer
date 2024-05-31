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
  const [message, setMessage] = useState("");

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

      setMessage(messageToSign);

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
    <div className="min-h-screen p-10 sm:p-20 w-full">
      <div className="max-w-lg mx-auto">
        <span>
          <strong>**</strong>Nonce can be a random string or a number without
          any spaces or special characters and should be larger than 7
          characters
        </span>

        <br />
        <br />

        {!isConnected ? (
          <div className="flex gap-x-3">
            <button onClick={() => handleConnect("io.metamask")}>
              Connect Metamask
            </button>
            <button onClick={() => handleConnect("com.coinbase.wallet")}>
              Connect Coinbase
            </button>
          </div>
        ) : authenticated ? (
          <div>
            <p>Authenticated: {address}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <div>
            <input
              autoFocus
              className="border-2 border-black px-3 py-2 rounded-sm"
              type="text"
              placeholder="Nonce"
              ref={nonceRef}
            />

            <button onClick={generateSignature}>Generate signature</button>

            {address && (
              <div className="mt-2">
                <span className="font-bold"> Address:</span>
                <p className="text-wrap" id="message">
                  {address}
                </p>
              </div>
            )}

            <br />
            {message && (
              <div className="my-2">
                <span className="font-bold"> Message:</span>
                <p className="text-wrap" id="message">
                  {message}
                </p>
              </div>
            )}

            <br />

            {signature && (
              <div className="mb-2">
                <span className="font-bold"> Signature:</span>
                <p className="break-words" id="signature">
                  {signature}
                </p>
              </div>
            )}

            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInWithEthereum;
