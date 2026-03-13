export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x059302e333eb4300c4a9c656bcb848beb05cdcdfe2345c3c159a3aa16ccd591c';

export const NEWSLETTER_MODULE = `${CONTRACT_ADDRESS}::newsletter`;
export const SUBSCRIPTION_MODULE = `${CONTRACT_ADDRESS}::subscription`;

export const FUNCTIONS = {
  INIT_PUBLICATION:  `${NEWSLETTER_MODULE}::init_publication`,
  PUBLISH_ISSUE:     `${NEWSLETTER_MODULE}::publish_issue`,
  GET_PUBLICATION:   `${NEWSLETTER_MODULE}::get_publication`,
  GET_ALL_ISSUES:    `${NEWSLETTER_MODULE}::get_all_issues`,
  VERIFY_ACCESS:     `${NEWSLETTER_MODULE}::verify_access`,
  GRANT_ACCESS:      `${NEWSLETTER_MODULE}::grant_access`,

  SUBSCRIBE:           `${SUBSCRIPTION_MODULE}::subscribe`,
  CHECK_SUBSCRIPTION:  `${SUBSCRIPTION_MODULE}::check_subscription`,
  WITHDRAW_EARNINGS:   `${SUBSCRIPTION_MODULE}::withdraw_earnings`,
  INIT_VAULT:          `${SUBSCRIPTION_MODULE}::init_vault`,
} as const;
