import { CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import detectEthereumProvider from "@metamask/detect-provider";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { BigNumber, ethers } from "ethers";
import React, {
  ReactChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EthereumWallet, EthereumWalletConnectWallet, EthereumWeb3Wallet, Wallet } from "wormhole-wallet-aggregator";
import { useGetWalletsForChain } from "wormhole-wallet-aggregator-react";
import metamaskIcon from "../icons/metamask-fox.svg";
import walletconnectIcon from "../icons/walletconnect.svg";
import { EVM_RPC_MAP } from "../utils/metaMaskChainParameters";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

export type Provider = ethers.providers.Web3Provider | undefined;
export type Signer = ethers.Signer | undefined;

export enum ConnectType {
  METAMASK,
  WALLETCONNECT,
}

export interface Connection {
  connectType: ConnectType;
  name: string;
  icon: string;
}

interface IEthereumProviderContext {
  connect(connectType: ConnectType): void;
  disconnect(): void;
  provider: Provider;
  chainId: number | undefined;
  signer: Signer;
  signerAddress: string | undefined;
  providerError: string | null;
  availableConnections: Connection[];
  connectType: ConnectType | undefined;
}

const EthereumProviderContext = React.createContext<IEthereumProviderContext>({
  connect: (connectType: ConnectType) => {},
  disconnect: () => {},
  provider: undefined,
  chainId: undefined,
  signer: undefined,
  signerAddress: undefined,
  providerError: null,
  availableConnections: [],
  connectType: undefined,
});

export const EthereumProviderProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const [providerError, setProviderError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<Signer>(undefined);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(
    undefined
  );
  const [wallet, setWallet] = useState<Wallet | undefined>();

  const getWalletsForChain = useGetWalletsForChain();
  const availableWallets = getWalletsForChain(CHAIN_ID_ETH) as EthereumWallet[];
  const availableConnections: Connection[] = availableWallets.map((w: Wallet) => ({
    icon: w instanceof EthereumWeb3Wallet ? metamaskIcon : walletconnectIcon,
    name: w.getName(),
    connectType: w instanceof EthereumWeb3Wallet ? ConnectType.METAMASK : ConnectType.WALLETCONNECT
  }))

  const [connectType, setConnectType] = useState<ConnectType | undefined>(
    undefined
  );

  const disconnect = useCallback(async () => {
    await wallet?.disconnect();
    setWallet(undefined);
    setProviderError(null);
    setProvider(undefined);
    setChainId(undefined);
    setSigner(undefined);
    setSignerAddress(undefined);
    setConnectType(undefined);
  }, []);

  const connect = useCallback(async (connectType: ConnectType) => {
    const wallet = availableWallets.find(w => (connectType === ConnectType.METAMASK && w instanceof EthereumWeb3Wallet) ||
                                (connectType === ConnectType.WALLETCONNECT && w instanceof EthereumWalletConnectWallet))!;
    await wallet.connect();
    setWallet(wallet);

    const provider = wallet.getProvider()!;
    const network = await provider.getNetwork();
    const signer = wallet.getSigner();
    const signerAddress = wallet.getPublicKey()!;

    setProvider(provider);
    setConnectType(connectType);
    setChainId(network.chainId);
    setSigner(signer);
    setSignerAddress(signerAddress);
  }, []);

  const contextValue = useMemo(
    () => ({
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
      availableConnections,
      connectType,
    }),
    [
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
      availableConnections,
      connectType,
    ]
  );
  return (
    <EthereumProviderContext.Provider value={contextValue}>
      {children}
    </EthereumProviderContext.Provider>
  );
};
export const useEthereumProvider = () => {
  return useContext(EthereumProviderContext);
};
