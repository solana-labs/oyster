const Web3 = require('web3');
const provider = 'https://main-rpc.linkpool.io';
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

export const getETHAccountBalance = async (
  publicAddress: string,
): Promise<string> => {
  const rawBalanceInETH = await web3.eth.getBalance(publicAddress);

  return rawBalanceInETH;
};
