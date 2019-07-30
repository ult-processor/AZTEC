import secp256k1 from '@aztec/secp256k1';
import assetModel from '~database/models/asset';
import addressModel from '~database/models/address';
import {
    get,
} from '~utils/storage';
import {
    fromAction,
} from '~utils/noteStatus';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    argsError,
} from '~utils/error';
import {
    createNote,
} from '~utils/note';

export default async function createNoteFromBalance(args, ctx) {
    const {
        assetId,
        amount,
        // userAccess,
        owner,
    } = args;
    const {
        user: {
            address: userAddress,
            linkedPublicKey,
        },
        session: {
            pwDerivedKey,
        },
        keyStore,
    } = ctx;

    const asset = await assetModel.get({
        id: assetId,
    });

    if (!asset) {
        throw argsError('asset.notFound', {
            messageOptions: {
                asset: assetId,
            },
        });
    }

    const {
        balance,
    } = asset;
    if (balance < amount) {
        throw argsError('asset.balance.notEnough');
    }

    // TODO
    // to pick a note we need to do the following
    // - split the expected note value into a normally distributed array
    //   of buckets that sum to > than the note value
    // - minimise the notes used
    // - itterate until we have 5 solutions
    // - score each solution
    // - getDistribution(value);
    const ownerAddress = owner || userAddress;
    const privateKey = keyStore.exportPrivateKey(pwDerivedKey);
    const spendingKey = secp256k1.ec.keyFromPrivate(privateKey);
    const note = await createNote(
        `0x${spendingKey.getPublic(true, 'hex')}`,
        amount,
        ownerAddress,
    );
    const {
        noteHash,
    } = note.exportNote();
    const viewingKey = encryptedViewingKey(
        linkedPublicKey,
        note.getView(),
    );
    if (!viewingKey) {
        throw argsError('note.viewingKey.encrypt', {
            owner: ownerAddress,
            linkedPublicKey,
        });
    }

    // TODO
    // implement getKeyById in Model
    const assetKey = await get(assetId);
    let ownerKey = ownerAddress
        ? await get(ownerAddress)
        : '';
    if (!ownerKey) {
        ({
            key: ownerKey,
        } = await addressModel.set({
            address: ownerAddress,
        }) || {});
    }

    return {
        hash: noteHash,
        viewingKey: viewingKey.toString(),
        value: amount,
        asset: assetKey,
        owner: ownerKey,
        status: fromAction('CREATE'),
    };
}