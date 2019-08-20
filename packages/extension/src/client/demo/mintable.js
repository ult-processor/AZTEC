import {
    log,
    warnLog,
} from '~utils/log';
import {
    randomInt,
} from '~utils/random';
import createNewAsset from './helpers/createNewAsset';
import sleep from './utils/sleep';
import withdraw from './tasks/withdraw';

export default async function demoMintable({
    scalingFactor = 1,
} = {}) {
    const { aztec } = window;
    await aztec.enable();


    let zkAssetAddress = ''; // ADD EXISTING ASSET ADDRESS HERE
    if (!zkAssetAddress) {
        log('Creating new asset...');
        ({
            zkAssetAddress,
        } = await createNewAsset({
            zkAssetType: 'ZkAssetMintable',
            scalingFactor,
        }));

        log('New zk mintable asset created!');
        warnLog(
            'Add this address to demo file to prevent creating new asset:',
            zkAssetAddress,
        );
    }


    const asset = await aztec.asset(zkAssetAddress);
    log(asset);
    if (!asset.isValid()) {
        log('Asset is not valid.');
        return;
    }


    const logBalances = async () => {
        await sleep(2000);
        log(`Asset balance = ${await asset.balance()}`);

        const totalSupplyBefore = await asset.totalSupplyOfLinkedToken();
        log(`Total supply of linked token = ${totalSupplyBefore}`);
    };


    await logBalances();


    const mintAmount = randomInt(1, 50);

    log('Generating mint proof...');
    const mintProof = await asset.mint(mintAmount);
    log('Mint proof generated!', mintProof.export());

    log('Minting...');
    const notes = await mintProof.send();
    log(`Successfully minted ${mintAmount}!`, notes);


    await logBalances();


    const withdrawAmount = randomInt(1, mintAmount);
    await withdraw(asset, withdrawAmount);


    await logBalances();
}