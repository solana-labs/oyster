## Quick start
- Install [nvm](https://github.com/nvm-sh/nvm)
- Use Node.js v12.16.2:
```sh
nvm install 12.16.2
nvm use 12.16.2
```
- Install [yarn](https://yarnpkg.com/) and [lerna](https://github.com/lerna/lerna) globally:
```sh
npm install yarn@1.22.10 -g
npm install lerna@3.4.3 -g
```
- Install dependencies:
```sh
yarn install --ignore-engines
yarn bootstrap
```
- Run lending:
```sh
yarn start lending
```
- Run governance-ui:
```sh
npm run start-gov
```

### Build
```sh
nvm install 12.16.2
nvm use 12.16.2

npm install yarn@1.22.10 -g
npm install lerna@3.4.3 -g

yarn install --ignore-engines
yarn build-gov
```

## Setup

Be sure to be running Node v12.16.2 and yarn version 1.22.10.

`yarn bootstrap`

Then run:

`yarn start lending`

You may have to rebuild your package more than one time to secure a
running environment.

## Known Issues

### Can't find CSS files in common

Common currently uses a less library to compile down less files into css in both the src directory for the TS server
in vscode to pick up and in the dist folder for importers like lending and proposal projects to pick up. If you do not see these files appear when running the `npm start lending` or other commands, and you see missing CSS errors,
you likely did not install the packages for common correctly. Try running:

`lerna exec npm install --scope @oyster/common` to specifically install packages for common.

Then, test that css transpiling is working:

`lerna exec npm watch-css-src --scope @oyster/common` and verify css files appear next to their less counterparts in src.

## ⚠️ Warning

Any content produced by Solana, or developer resources that Solana provides, are for educational and inspiration purposes only. Solana does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.

# Disclaimer

All claims, content, designs, algorithms, estimates, roadmaps,
specifications, and performance measurements described in this project
are done with the Solana Foundation's ("SF") best efforts. It is up to
the reader to check and validate their accuracy and truthfulness.
Furthermore nothing in this project constitutes a solicitation for
investment.

Any content produced by SF or developer resources that SF provides, are
for educational and inspiration purposes only. SF does not encourage,
induce or sanction the deployment, integration or use of any such
applications (including the code comprising the Solana blockchain
protocol) in violation of applicable laws or regulations and hereby
prohibits any such deployment, integration or use. This includes use of
any such applications by the reader (a) in violation of export control
or sanctions laws of the United States or any other applicable
jurisdiction, (b) if the reader is located in or ordinarily resident in
a country or territory subject to comprehensive sanctions administered
by the U.S. Office of Foreign Assets Control (OFAC), or (c) if the
reader is or is working on behalf of a Specially Designated National
(SDN) or a person subject to similar blocking or denied party
prohibitions.

The reader should be aware that U.S. export control and sanctions laws
prohibit U.S. persons (and other persons that are subject to such laws)
from transacting with persons in certain countries and territories or
that are on the SDN list. As a project based primarily on open-source
software, it is possible that such sanctioned persons may nevertheless
bypass prohibitions, obtain the code comprising the Solana blockchain
protocol (or other project code or applications) and deploy, integrate,
or otherwise use it. Accordingly, there is a risk to individuals that
other persons using the Solana blockchain protocol may be sanctioned
persons and that transactions with such persons would be a violation of
U.S. export controls and sanctions law. This risk applies to
individuals, organizations, and other ecosystem participants that
deploy, integrate, or use the Solana blockchain protocol code directly
(e.g., as a node operator), and individuals that transact on the Solana
blockchain through light clients, third party interfaces, and/or wallet
software.
