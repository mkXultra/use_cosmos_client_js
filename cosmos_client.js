const { cosmosclient, proto, rest } =  require("@cosmos-client/core")
const Long = require('long')

const host = "http://localhost:1317"
const chainId = 'ununifi-test-private-m1'
async function init(mnt) {
  const sdk = new cosmosclient.CosmosSDK(host, chainId);
  const bech32Prefix = "ununifi"
      cosmosclient.config.setBech32Prefix({
        accAddr: bech32Prefix,
        accPub: bech32Prefix + cosmosclient.AddressPrefix.Public,
        valAddr:
          bech32Prefix + cosmosclient.AddressPrefix.Validator + cosmosclient.AddressPrefix.Operator,
        valPub:
          bech32Prefix +
          cosmosclient.AddressPrefix.Validator +
          cosmosclient.AddressPrefix.Operator +
          cosmosclient.AddressPrefix.Public,
        consAddr:
          bech32Prefix +
          cosmosclient.AddressPrefix.Validator +
          cosmosclient.AddressPrefix.Consensus,
        consPub:
          bech32Prefix +
          cosmosclient.AddressPrefix.Validator +
          cosmosclient.AddressPrefix.Consensus +
          cosmosclient.AddressPrefix.Public,
      });
  const privKey = await cosmosclient
    .generatePrivKeyFromMnemonic(mnt)
    .then((buffer) => new proto.cosmos.crypto.secp256k1.PrivKey({ key: buffer }));
  const pubKey = privKey.pubKey();
  const address = cosmosclient.AccAddress.fromPublicKey(pubKey);
  const fromAddress = address;
  const toAddress = address;
  const account = await rest.auth
      .account(sdk, fromAddress)
      .then((res) => cosmosclient.codec.protoJSONToInstance(cosmosclient.codec.castProtoJSONOfProtoAny(res.data.account)))
    .catch((error) => {
      console.log("🚀 ~ file: cosmos_client.js ~ line 41 ~ init ~ error", error)
      return null
    });

  if (!(account instanceof proto.cosmos.auth.v1beta1.BaseAccount)) {
    console.log(account);
    return;
  }
    // build tx
    const msgSend = new proto.cosmos.bank.v1beta1.MsgSend({
      from_address: fromAddress.toString(),
      to_address: toAddress.toString(),
      amount: [{ denom: 'uguu', amount: '1' }],
    });

    const txBody = new proto.cosmos.tx.v1beta1.TxBody({
      messages: [cosmosclient.codec.instanceToProtoAny(msgSend)],
    });
    const authInfo = new proto.cosmos.tx.v1beta1.AuthInfo({
      signer_infos: [
        {
          public_key: cosmosclient.codec.instanceToProtoAny(pubKey),
          mode_info: {
            single: {
              mode: proto.cosmos.tx.signing.v1beta1.SignMode.SIGN_MODE_DIRECT,
            },
          },
          sequence: account.sequence,
        },
      ],
      fee: {
        gas_limit: Long.fromString('200000'),
      },
    });
    console.log("🚀 ~ file: cosmos_client.js ~ line 74 ~ init ~ authInfo", authInfo)
   const txBuilder = new cosmosclient.TxBuilder(sdk, txBody, authInfo);
    const signDocBytes = txBuilder.signDocBytes(account.account_number);
    txBuilder.addSignature(privKey.sign(signDocBytes));

    // broadcast
    const res = await rest.tx.broadcastTx(sdk, {
      tx_bytes: txBuilder.txBytes(),
      mode: rest.tx.BroadcastTxMode.Block,
    });
    // console.log(JSON.parse(res.data.tx_response.raw_log,"",2));
    console.log(
      JSON.stringify(JSON.parse(res.data.tx_response.raw_log),"", 2)
      );
}
const mnt = "december document forest series squeeze click retire apology party project trade grocery innocent object glow gym gravity search vibrant fragile security swallow idea cook"
init("figure web rescue rice quantum sustain alert citizen woman cable wasp eyebrow monster teach hockey giant monitor hero oblige picnic ball never lamp distance")
// init(mnt)