import { tryParseKey } from '@oyster/common';

export const voterWeightPluginValidator = async (rule: any, value: string) => {
  if (value) {
    const pubkey = tryParseKey(value);

    if (!pubkey) {
      throw new Error('Provided value is not a valid publickey');
    }
  }
};
