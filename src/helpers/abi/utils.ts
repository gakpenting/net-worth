import memoize from 'lodash/memoize';
import { isAddress } from '@ethersproject/address';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';

import { JsonRpcProvider } from '@ethersproject/providers';
import { pack } from '@ethersproject/solidity';
import { hexDataLength, isHexString } from '@ethersproject/bytes';
import {
  FormatTypes,
  Fragment,
  FunctionFragment,
  Interface,
  ParamType
} from '@ethersproject/abi';
import { BigNumberish } from '@ethersproject/bignumber';
import { JsonFragment } from '@ethersproject/abi/src.ts/fragments';
import { InterfaceDecoder } from '@/helpers/abi/decoder';
import { parseAmount, parseValueInput } from '@/helpers/utils';

interface Collectable {
  id: string;
  name: string;
  address: string;
  tokenName?: string;
  logoUri?: string;
}

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string;
}





const EXPLORER_API_URLS = {
  '1': 'https://api.etherscan.io/api',
  '4': 'https://api-rinkeby.etherscan.io/api',
  '100': 'https://blockscout.com/xdai/mainnet/api',
  '73799': 'https://volta-explorer.energyweb.org/api',
  '246': 'https://explorer.energyweb.org/api',
  '137': 'https://api.polygonscan.com/api',
  '56': 'https://api.bscscan.com/api',
  '42161': 'https://api.arbiscan.io/api'
};

const GNOSIS_SAFE_TRANSACTION_API_URLS = {
  '1': 'https://safe-transaction.gnosis.io/api/v1/',
  '4': 'https://safe-transaction.rinkeby.gnosis.io/api/v1/',
  '100': 'https://safe-transaction.xdai.gnosis.io/api/v1/',
  '73799': 'https://safe-transaction.volta.gnosis.io/api/v1/',
  '246': 'https://safe-transaction.ewc.gnosis.io/api/v1/',
  '137': 'https://safe-transaction.polygon.gnosis.io/api/v1/',
  '56': 'https://safe-transaction.bsc.gnosis.io/api/v1/',
  '42161': 'https://safe-transaction.arbitrum.gnosis.io/api/v1/'
};

const ERC20ContractABI = [
  'function transfer(address recipient, uint256 amount) public virtual override returns (bool)'
];

const ERC721ContractABI = [
  'function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable'
];

const MultiSendABI = ['function multiSend(bytes memory transactions)'];

const MULTISEND_CONTRACT_ADDRESS = '0x8D29bE29923b68abfDD21e541b9374737B49cdAD';

export const ETHEREUM_COIN: Token = {
  name: 'Ethereum',
  decimals: 18,
  symbol: 'ETH',
  logoUri: 'https://gnosis-safe.io/app/static/media/token_eth.bc98bd46.svg',
  address: 'main'
};

type ABI = string | Array<Fragment | JsonFragment | string>;

export const mustBeEthereumAddress = memoize((address: string) => {
  const startsWith0x = address?.startsWith('0x');
  const isValidAddress = isAddress(address);
  return startsWith0x && isValidAddress;
});

export const mustBeEthereumContractAddress = memoize(
  async (network: string, address: string) => {
    const provider = getProvider(network) as JsonRpcProvider;
    const contractCode = await provider.getCode(address);

    return (
      contractCode && contractCode.replace('0x', '').replace(/0/g, '') !== ''
    );
  },
  (url, contractAddress) => `${url}_${contractAddress}`
);

const fetchContractABI = memoize(
  async (url: string, contractAddress: string) => {
    const params = new URLSearchParams({
      module: 'contract',
      action: 'getAbi',
      address: contractAddress
    });

    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      return { status: 0, result: '' };
    }

    return response.json();
  },
  (url, contractAddress) => `${url}_${contractAddress}`
);

export const getContractABI = async (
  network: string,
  contractAddress: string
): Promise<string> => {
  const apiUrl = EXPLORER_API_URLS[network];

  if (!apiUrl) {
    return '';
  }

  const isEthereumAddress = mustBeEthereumAddress(contractAddress);
  const isEthereumContractAddress = await mustBeEthereumContractAddress(
    network,
    contractAddress
  );

  if (!isEthereumAddress || !isEthereumContractAddress) {
    return '';
  }

  try {
    const { result, status } = await fetchContractABI(apiUrl, contractAddress);

    if (status === '0') {
      return '';
    }

    return result;
  } catch (e) {
    console.error('Failed to retrieve ABI', e);
    return '';
  }
};

export const isWriteFunction = (method: FunctionFragment) => {
  if (!method.stateMutability) return true;
  return !['view', 'pure'].includes(method.stateMutability);
};

export const getABIWriteFunctions = (abi: Fragment[]) => {
  const abiInterface = new Interface(abi);
  return (
    abiInterface.fragments
      // Return only contract's functions
      .filter(FunctionFragment.isFunctionFragment)
      .map(FunctionFragment.fromObject)
      // Return only write functions
      .filter(isWriteFunction)
      // Sort by name
      .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
  );
};

const extractMethodArgs = (values: string[]) => (param: ParamType, index) => {
  const value = values[index];
  if (param.baseType === 'array') {
    return JSON.parse(value);
  }
  return value;
};

export const getContractTransactionData = (
  abi: string,
  method: FunctionFragment,
  values: string[]
) => {
  const contractInterface = new Interface(abi);
  const parameterValues = method.inputs.map(extractMethodArgs(values));
  return contractInterface.encodeFunctionData(method, parameterValues);
};

export const getAbiFirstFunctionName = (abi: ABI): string => {
  const abiInterface = new Interface(abi);
  return abiInterface.fragments[0].name;
};

export const getERC20TokenTransferTransactionData = (
  recipientAddress: string,
  amount: BigNumberish
): string => {
  const contractInterface = new Interface(ERC20ContractABI);
  return contractInterface.encodeFunctionData('transfer', [
    recipientAddress,
    amount
  ]);
};

export const getERC721TokenTransferTransactionData = (
  fromAddress: string,
  recipientAddress: string,
  id: BigNumberish
): string => {
  const contractInterface = new Interface(ERC721ContractABI);
  return contractInterface.encodeFunctionData('safeTransferFrom', [
    fromAddress,
    recipientAddress,
    id
  ]);
};

export const getOperation = to => {
  if (to === MULTISEND_CONTRACT_ADDRESS) return '1';
  return '0';
};

export const parseMethodToABI = (method: FunctionFragment) => {
  return [method.format(FormatTypes.full)];
};

const callGnosisSafeTransactionApi = async (network: string, url: string) => {
  const apiUrl = GNOSIS_SAFE_TRANSACTION_API_URLS[network];
  const response = await fetch(apiUrl + url);
  return response.json();
};

export const getGnosisSafeBalances = memoize(
  (network, safeAddress) => {
    const endpointPath = `/safes/${safeAddress}/balances/`;
    return callGnosisSafeTransactionApi(network, endpointPath);
  },
  (safeAddress, network) => `${safeAddress}_${network}`
);

export const getGnosisSafeCollectibles = memoize(
  (network, safeAddress) => {
    const endpointPath = `/safes/${safeAddress}/collectibles/`;
    return callGnosisSafeTransactionApi(network, endpointPath);
  },
  (safeAddress, network) => `${safeAddress}_${network}`
);

export const getGnosisSafeToken = memoize(
  async (network, tokenAddress): Promise<Token> => {
    const endpointPath = `/tokens/${tokenAddress}`;
    return callGnosisSafeTransactionApi(network, endpointPath);
  },
  (tokenAddress, network) => `${tokenAddress}_${network}`
);

export const removeHexPrefix = (hexString: string) => {
  return hexString.startsWith('0x') ? hexString.substr(2) : hexString;
};






const shrinkCollectableData = (collectable): Collectable => {
  return {
    id: collectable.id,
    name: collectable.name,
    address: collectable.address,
    tokenName: collectable.tokenName,
    logoUri: collectable.logoUri
  };
};






export const fetchTextSignatures = async (
  methodSignature: string
): Promise<string[]> => {
  const url = new URL('/api/v1/signatures', 'https://www.4byte.directory');
  url.searchParams.set('hex_signature', methodSignature);
  url.searchParams.set('ordering', 'created_at');
  const response = await fetch(url.toString());
  const { results } = await response.json();
  return results.map(signature => signature.text_signature);
};

const getMethodSignature = (data: string) => {
  const methodSignature = data.substr(0, 10);
  if (isHexString(methodSignature) && methodSignature.length === 10) {
    return methodSignature;
  }
  return null;
};







