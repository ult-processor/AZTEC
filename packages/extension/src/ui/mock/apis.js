import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import realApis from '~ui/apis';
import {
    addresses,
    assets,
    pastTransactions,
} from './data';

const mock = async (data) => {
    await sleep(randomInt(2000));
    const fakeData = {
        ...data,
        mock: true,
        timestamp: Date.now(),
    };
    return fakeData;
};

const mergeApis = (defaultApis, customApis = {}) => {
    const mockApis = {};
    Object.keys(defaultApis).forEach((name) => {
        if (typeof defaultApis[name] === 'object') {
            mockApis[name] = mergeApis(defaultApis[name], customApis[name]);
        } else {
            mockApis[name] = customApis[name] || mock;
        }
    });

    return mockApis;
};

export default mergeApis(realApis, {
    auth: {
        getCurrentUser: () => ({
            address: addresses[0],
        }),
        createKeyStore: () => ({
            linkedPublicKey: 'linked_public_key',
        }),
        generateLinkedPublicKey: realApis.auth.generateLinkedPublicKey,
    },
    account: {
        getExtensionAccount: address => ({
            address,
            linkedPublicKey: 'linked_public_key',
        }),
    },
    asset: {
        getAssets: async () => assets,
        getDomainAssets: async () => assets,
        getPastTransactions: async (assetAddress = '', count = 2) => {
            const transactions = !assetAddress
                ? pastTransactions
                : pastTransactions
                    .filter(({ asset }) => asset.address === assetAddress);

            return !count
                ? transactions
                : transactions.slice(0, count);
        },
    },
    note: {
        fetchNote: noteHash => ({
            noteHash,
            value: randomInt(100),
            asset: assets[0],
        }),
    },
});
