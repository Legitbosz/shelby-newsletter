export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0';

export const NEWSLETTER_MODULE = `${CONTRACT_ADDRESS}::newsletter`;
export const SUBSCRIPTION_MODULE = `${CONTRACT_ADDRESS}::subscription`;

export const FUNCTIONS = {
  // Newsletter module
  PUBLISH_ISSUE:    `${NEWSLETTER_MODULE}::publish_issue`,
  GET_PUBLICATION:  `${NEWSLETTER_MODULE}::get_publication`,
  GET_ALL_ISSUES:   `${NEWSLETTER_MODULE}::get_all_issues`,
  VERIFY_ACCESS:    `${NEWSLETTER_MODULE}::verify_access`,

  // Subscription module
  SUBSCRIBE:           `${SUBSCRIPTION_MODULE}::subscribe`,
  CHECK_SUBSCRIPTION:  `${SUBSCRIPTION_MODULE}::check_subscription`,
  WITHDRAW_EARNINGS:   `${SUBSCRIPTION_MODULE}::withdraw_earnings`,
  MINT_FOUNDING_NFT:   `${SUBSCRIPTION_MODULE}::mint_founding_nft`,
} as const;
