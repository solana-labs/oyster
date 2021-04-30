export const LABELS = {
  CONNECT_LABEL: 'Connect Wallet',
  AUDIT_WARNING:
    'Oyster is an unaudited software project used for internal purposes at the Solana Foundation. This app is not for public use.',
  FOOTER:
    'This page was produced by the Solana Foundation ("SF") for internal educational and inspiration purposes only. SF does not encourage, induce or sanction the deployment, integration or use of Oyster or any similar application (including its code) in violation of applicable laws or regulations and hereby prohibits any such deployment, integration or use. Anyone using this code or a derivation thereof must comply with applicable laws and regulations when releasing related software.',
  MENU_HOME: 'Proposals',
  NEW_PROPOSAL: 'Add new proposal',
  MENU_DASHBOARD: 'Dashboard',
  APP_TITLE: 'Oyster Proposals',
  CONNECT_BUTTON: 'Connect',
  WALLET_TOOLTIP: 'Wallet public key',
  WALLET_BALANCE: 'Wallet balance',
  SETTINGS_TOOLTIP: 'Settings',
  DASHBOARD_INFO: 'Connect to a wallet to view proposals.',
  DESCRIPTION: 'Description',
  PROPOSAL: 'Proposal',
  NO_LOAD: 'Unable to load markdown. Click to view.',
  SIG_GIVEN: 'Signatories',
  VOTES_REQUIRED: 'Votes Required',
  VOTES_CAST: 'Votes In Favor',
  ADMIN_PANEL: 'Admin Panel',
  COPY_FAILED_ADDRESSES_TO_INPUT: 'Copy failed addresses to the input',
  COPY_FAILED_ADDRESSES_TO_CLIPBOARD: 'Copy failed addresses to clipboard',
  FAILED_SIGNERS_COPIED_TO_INPUT: 'Failed signers copied to input!',
  FAILED_SIGNERS_COPIED_TO_CLIPBOARD: 'Failed signers copied to clipboard!',
  FAILED_HOLDERS_COPIED_TO_INPUT:
    'Failed governance token holders copied to input!',
  FAILED_HOLDERS_COPIED_TO_CLIPBOARD:
    'Failed governance token holders copied to clipboard!',
  COMMA_SEPARATED_KEYS: 'Comma separated base58 pubkeys',
  SIGNERS: 'Signers',
  ADD_SIGNERS: 'Add Signers',
  ADMIN_ACCOUNT_NOT_DEFINED: 'Admin account is not defined',
  SIG_ACCOUNT_NOT_DEFINED: 'Signature account is not defined',
  ENTER_AT_LEAST_ONE_PUB_KEY: 'Please enter at least one pub key.',
  PUB_KEY_FAILED:
    " Pub key  failed. Please check your inspector tab for more information. We'll continue onward and add this to a list for you to re-upload in a later save.",
  ADD: 'Add',
  REMOVE: 'Remove',
  ADDING_OR_REMOVING: 'Type',

  ADDING_GOVERNANCE_TOKENS: 'Adding governance tokens',
  PLEASE_WAIT: 'Please wait...',
  GOVERNANCE_TOKENS_ADDED: 'Governance tokens added.',
  NEW_VOTED_ACCOUNT_ADDED: 'New vote account added.',
  ADDING_NEW_VOTE_ACCOUNT: 'Adding new vote account...',
  PROPOSAL_MINT_TYPE: 'Who votes?',
  TRANSACTION: 'Transaction - ',
  CANT_GIVE_ZERO_TOKENS: "Can't give zero tokens to a user!",
  BULK_TOKENS: 'Token Holders',
  COMMA_SEPARATED_KEYS_AND_VOTES:
    'base58 pubkey, vote count, base58 pubkey, vote count, ...',
  SINGLE_HOLDER: 'Token Holder',
  AMOUNT: 'Amount',
  SINGLE_KEY: 'base58 pubkey',
  TOKEN_MODE: 'Mode',
  BULK: 'Bulk',
  SINGLE: 'Single',
  ADD_GOVERNANCE_TOKENS: 'Add Governance Tokens',
  ADD_COUNCIL_TOKENS: 'Add Council Tokens',
  ACTIONS: 'Actions',

  VOTE_YEAH: 'Yeah',
  VOTE_YEAH_QUESTION: 'Vote Yeah?',
  VOTE_YEAH_MSG: 'Vote in favour of the proposal.',
  VOTING_YEAH: 'Voting for the proposal',
  VOTED_YEAH: 'Voted for the proposal',

  VOTE_NAY: 'Nay',
  VOTE_NAY_QUESTION: 'Vote Nay?',
  VOTE_NAY_MSG: 'Vote against the proposal.',
  VOTING_NAY: 'Voting against the proposal',
  VOTED_NAY: 'Voted against the proposal',

  TOKENS_VOTED_FOR_THE_PROPOSAL: 'tokens voted for the proposal',
  TOKENS_VOTED_AGAINST_THE_PROPOSAL: 'tokens voted against the proposal',

  EXECUTING: 'Executing...',
  EXECUTED: 'Executed.',

  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',

  WITHDRAW_VOTE: 'Withdraw My Vote',
  WITHDRAW_YOUR_VOTE_QUESTION: 'Withdraw your vote?',
  WITHDRAW_YOUR_VOTE_MSG:
    'Once you withdraw your vote it won’t count towards the proposal voting outcome.',
  WITHDRAW: 'Withdraw',
  WITHDRAWING_YOUR_VOTE: 'Withdrawing your vote',
  VOTE_WITHDRAWN: 'Your vote has been withdrawn',

  REFUND_TOKENS: 'Refund My Tokens',
  REFUND_YOUR_TOKENS_QUESTION: 'Refund your tokens?',
  REFUND_YOUR_TOKENS_MSG:
    'The proposal has been voted. Refunding your tokens won’t change the outcome.',
  REFUND: 'Refund',
  REFUNDING_YOUR_TOKENS: 'Refunding your tokens',
  TOKENS_REFUNDED: 'Your voting tokens have been refunded',

  REGISTER_GOVERNANCE: 'Register',

  PROGRAM_ID: 'Program ID',
  INSTRUCTION: 'Instruction',

  GOVERNANCE: 'Governance Token Holders',
  COUNCIL: 'The Council',
  GOVERNANCE_MINT: 'Governance Mint ID',
  USE_COUNCIL_MINT: 'Allow Council Mint?',
  COUNCIL_MINT: 'Council Mint ID',

  VOTE_PERCENT_THRESHOLD: 'Vote Threshold (%)',

  SELECT_PROPOSAL_TYPE: 'Select the type of proposals this app will generate',
  SELECT_EXECUTION_TYPE: 'Select how transactions will be executed',

  SELECT_VOTING_ENTRY_RULE:
    'Select the rules for registering to vote in proposals',
  MINIMUM_SLOT_WAITING_PERIOD: 'Minimum slots between proposal and vote',
  SELECT_CONFIG: 'Select Governed Program',
  CONFIG: 'Governed Program',
  GIST_PLACEHOLDER: 'Github Gist link',
  NAME: 'Name',
  PUBLIC_KEY: 'Public Key',
  MENU_GOVERNANCE: 'My Governed Programs',
  LEAVE_BLANK_IF_YOU_WANT_ONE: 'Leave blank if you want one made for you',
  ADDITIONAL_VOTING_MSG:
    ' Please note that during voting, if you withdraw your tokens, your vote will not count towards the voting total. You must wait for the vote to complete in order for your withdrawal to not affect the voting.',
  SLOT_MUST_BE_NUMERIC: 'Slot can only be numeric',
  SLOT_MUST_BE_GREATER_THAN: 'Slot must be greater than or equal to ',
  DELAY: 'Slot Delay',

  MIN_SLOT_MUST_BE_NUMERIC: 'Minimum Slot Waiting Period can only be numeric',
  TIME_LIMIT_MUST_BE_NUMERIC: 'Time Limit can only be numeric',
  PROGRAM_ID_IS_NOT_A_VALID_PUBLIC_KEY: (programId: string) =>
    `Program ID: '${programId}' is not a valid public key`,
  GOVERNANCE_MINT_IS_NOT_A_VALID_PUBLIC_KEY: (programId: string) =>
    `Governance Mint ID: '${programId}' is not a valid public key`,
  COUNCIL_MINT_IS_NOT_A_VALID_PUBLIC_KEY: (programId: string) =>
    `Council Mint ID: '${programId}' is not a valid public key`,

  TIME_LIMIT: 'Voting Time Limit',
  THIS_CONFIG_LACKS_COUNCIL: 'This program does not have a council.',
  GIT_CONTENT_EXCEEDED:
    'Gist Github API limit exceeded. Click to view on Github directly.',
  ACCOUNT: 'Account',
  COUNT: 'Count',
  VOTE_TYPE: 'Vote Type',
  LARGEST_VOTERS_BUBBLE: 'Top Voters Visualization',
  LARGEST_VOTERS_TABLE: 'Top Voters',
  PERCENTAGE: 'Percentage',
};
