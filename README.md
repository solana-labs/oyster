## Setup

This is a yarn 2 monorepository. It works off of a yarn 2 cjs dump version-controlled in the repo so that everybody
has the same version. Each folder is it's own workspace, and the workspaces can link together via package.json additions.
Each workspace can in addition be published and version controlled ultimately, so that one workspace can depend on a static
version on another instead of the current setup, which is more of a symlinking, similar to the way Lerna used to allow it.

"""
yarn install
"""

## Running an app

"""
yarn workspace lending start
"""

In general, to run a package.json script in a project, just do """yarn workspace project script-name"""

## Clearing the cache in yarn 2

DO NOT DELETE THE .YARN FOLDER. It is not like the old node_modules, which has been deprecated. Use """yarn cache clean""".

## ⚠️ Warning

Any content produced by Solana, or developer resources that Solana provides, are for educational and inspiration purposes only. Solana does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.
