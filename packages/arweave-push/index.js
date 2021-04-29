// [START functions_http_form_data]
/**
 * Parses a 'multipart/form-data' upload request
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
const path = require('path');
const Arweave = require('arweave');
const { Storage } = require('@google-cloud/storage');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { Account, Connection } = require('@solana/web3.js');
const mimeType = require('mime-types');
const fetch = require('node-fetch');

const storage = new Storage();
const BUCKET_NAME = 'us.artifacts.principal-lane-200702.appspot.com';
const FOLDER_NAME = 'arweave';
const ARWEAVE_KEYNAME = 'arweave.json';
const SOLANA_KEYNAME = 'arweave-sol-container.json';
const CLUSTER = 'https://devnet.solana.com';
//const CLUSTER = 'https://api.mainnet-beta.solana.com';
const SYSTEM = '11111111111111111111111111111111';
const MEMO = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const KEYHOLDER = {};
const FAIL = 'fail';
const SUCCESS = 'success';
const LAMPORT_MULTIPLIER = 10 ** 9;
const WINSTON_MULTIPLIER = 10 ** 12;
const RESERVED_TXN_MANIFEST = 'manifest.json';

function generateManifest(pathMap, indexPath) {
  const manifest = {
    manifest: 'arweave/paths',
    version: '0.1.0',
    paths: pathMap,
  };

  if (indexPath) {
    if (!Object.keys(pathMap).includes(indexPath)) {
      throw new Error(
        `--index path not found in directory paths: ${indexPath}`,
      );
    }
    manifest.index = {
      path: indexPath,
    };
  }

  return manifest;
}

const getKey = async function (name) {
  if (KEYHOLDER[name]) return KEYHOLDER[name];

  const options = {
    destination: os.tmpdir() + '/' + name,
  };

  // Downloads the file
  await storage
    .bucket(BUCKET_NAME)
    .file(FOLDER_NAME + '/' + name)
    .download(options);

  console.log(`Key downloaded to ${os.tmpdir()}/${name}`);

  let rawdata = fs.readFileSync(os.tmpdir() + '/' + name);
  let key;
  try {
    key = JSON.parse(rawdata);
  } catch (e) {
    key = rawdata.toString();
  }

  KEYHOLDER[name] = key;
  return KEYHOLDER[name];
};

// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require('busboy');
const arweaveConnection = Arweave.init({
  host: 'arweave.net', // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: 'https', // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: true, // Enable network request logging
});

// FYI no streaming uploads as yet
// https://gist.github.com/CDDelta/e2af7e02314b2e0c3b5f9eb616c645a6
// Need to read entire thing into memory - Limits us to 2GB files. TODO come back and implemnet.
exports.uploadFile = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    // Return a "method not allowed" error
    return res.status(405).end();
  }
  const solanaKey = await getKey(SOLANA_KEYNAME);
  const solanaConnection = new Connection(CLUSTER, 'recent');
  const solanaWallet = new Account(solanaKey);
  const arweaveWallet = await getKey(ARWEAVE_KEYNAME);
  console.log('Connections established.');
  const busboy = new Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();

  const fieldPromises = [];

  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname, val) => {
    console.log('I see ' + fieldname);
    fieldPromises.push(
      new Promise(async (res, _) => {
        if (fieldname === 'transaction') {
          try {
            console.log('Calling out for txn', val);
            const transaction = await solanaConnection.getParsedConfirmedTransaction(
              val,
              'confirmed',
            );
            console.log('I got the transaction');
            // We expect the first command to be a SOL send from them to our holding account.
            // Then after that it's memos of sha256 hashes of file contents.
            const expectedSend =
              transaction.transaction.message.instructions[0];

            const isSystem = expectedSend.programId.toBase58() === SYSTEM;
            const isToUs =
              expectedSend.parsed.info.destination ===
              solanaWallet.publicKey.toBase58();
            console.log(
              'Expected to send is',
              JSON.stringify(expectedSend.parsed),
            );
            if (isSystem && isToUs) {
              const amount = expectedSend.parsed.info.lamports;
              const remainingMemos = transaction.transaction.message.instructions.filter(
                i => i.programId.toBase58() === MEMO,
              );
              const memoMessages = remainingMemos.map(m => m.parsed);
              res({
                name: fieldname,
                amount,
                memoMessages,
              });
            } else
              throw new Error(
                'No payment found because either the program wasnt the system program or it wasnt to the holding account',
              );
          } catch (e) {
            console.log(fieldname, e);
            console.log('Setting txn anyway');
            res({
              name: fieldname,
              amount: 0,
              memoMessages: [],
            });
          }
        } else if (fieldname === 'tags') {
          try {
            res({
              name: fieldname,
              ...JSON.parse(val),
            });
          } catch (e) {
            console.log(fieldname, e);
            res({
              name: fieldname,
            });
          }
        }
      }),
    );
  });

  const fileWrites = [];

  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, filename) => {
    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    console.log(`Processed file ${filename}`);
    const filepath = path.join(tmpdir, filename);

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    // File was processed by Busboy; wait for it to be written.
    // Note: GCF may not persist saved files across invocations.
    // Persistent files must be kept in other locations
    // (such as Cloud Storage buckets).
    const promise = new Promise((resolve, reject) => {
      file.on('end', () => {
        writeStream.end();
      });
      writeStream.on('finish', resolve({ status: SUCCESS, filepath }));
      writeStream.on(
        'error',
        reject({ status: FAIL, filepath, error: 'failed to save' }),
      );
    });

    fileWrites.push(promise);
  });

  // Triggered once all uploaded files are processed by Busboy.
  // We still need to wait for the disk writes (saves) to complete.
  const body = { messages: [] };

  busboy.on('finish', async () => {
    console.log('Finish');
    const filepaths = [
      ...(await Promise.all(fileWrites)),
      { filepath: RESERVED_TXN_MANIFEST, status: SUCCESS },
    ];
    const fields = await Promise.all(fieldPromises);
    const anchor = (await arweaveConnection.api.get('tx_anchor')).data;

    console.log('The one guy is ' + fields.map(f => f.name).join(','));
    const txn = fields.find(f => f.name === 'transaction');
    const fieldTags = fields.find(f => f.name === 'tags');

    if (!txn || !txn.amount) {
      body.error = 'No transaction found with payment';
      res.end(JSON.stringify(body));
      return;
    }

    let runningTotal = txn.amount;

    const conversionRates = JSON.parse(
      await (
        await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana,arweave&vs_currencies=usd',
        )
      ).text(),
    );

    // To figure out how much solana is required, multiply ar byte cost by this number
    const arMultiplier =
      conversionRates.arweave.usd / conversionRates.solana.usd;

    const paths = {};
    for (let i = 0; i < filepaths.length; i++) {
      const f = filepaths[i];
      if (f.status == FAIL) {
        body.messages.push(f);
      } else {
        const { filepath } = f;
        const parts = filepath.split('/');
        const filename = parts[parts.length - 1];
        try {
          let data, fileSizeInBytes, mime;
          if (filepath == RESERVED_TXN_MANIFEST) {
            const manifest = await generateManifest(paths, 'metadata.json');
            data = Buffer.from(JSON.stringify(manifest), 'utf8');
            fileSizeInBytes = data.byteLength;
            mime = 'application/x.arweave-manifest+json';
          } else {
            data = fs.readFileSync(filepath);

            // Have to get separate Buffer since buffers are stateful
            const hashSum = crypto.createHash('sha256');
            hashSum.update(data.toString());
            const hex = hashSum.digest('hex');

            if (!txn.memoMessages.find(m => m === hex)) {
              body.messages.push({
                filename,
                status: FAIL,
                error: `Unable to find proof that you paid for this file, your hash is ${hex}, comparing to ${txn.memoMessages.join(
                  ',',
                )}`,
              });
              continue;
            }

            const stats = fs.statSync(filepath);
            fileSizeInBytes = stats.size;
            mime = mimeType.lookup(filepath);
          }

          const costSizeInWinstons = parseInt(
            await (
              await fetch(
                'https://arweave.net/price/' + fileSizeInBytes.toString(),
              )
            ).text(),
          );

          const costToStoreInSolana =
            (costSizeInWinstons * arMultiplier) / WINSTON_MULTIPLIER;

          runningTotal -= costToStoreInSolana * LAMPORT_MULTIPLIER;
          if (runningTotal > 0) {
            const transaction = await arweaveConnection.createTransaction(
              { data: data, last_tx: anchor },
              arweaveWallet,
            );
            transaction.addTag('Content-Type', mime);
            if (fieldTags) {
              const tags =
                fieldTags[filepath.split('/')[filepath.split('/').length - 1]];
              if (tags) tags.map(t => transaction.addTag(t.name, t.value));
            }

            await arweaveConnection.transactions.sign(
              transaction,
              arweaveWallet,
            );
            await arweaveConnection.transactions.post(transaction);
            body.messages.push({
              filename,
              status: SUCCESS,
              transactionId: transaction.id,
            });
            paths[filename] = { id: transaction.id };
          } else {
            body.messages.push({
              filename,
              status: FAIL,
              error: `Not enough funds provided to push this file, you need at least ${costToStoreInSolana} SOL or ${costSize} AR`,
            });
          }
        } catch (e) {
          console.log(e);
          body.messages.push({ filename, status: FAIL, error: e.toString() });
        }
      }
    }

    res.end(JSON.stringify(body));
  });
  busboy.end(req.rawBody);
};
// [END functions_http_form_data]
