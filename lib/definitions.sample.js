module.exports = {
  default_roles: {
    user: [
      'get_account'
    ],
    admin: [
      'full_access'
    ]
  },
  default_role: 'user',
  default_settings: {
    // key: value pairs
    multisite: false,
    mailchimp_enabled: false,
    mailchimp_api_key: '',
    stripe_enabled: false,
    stripe_api_key: '',
    shopify_enabled: false,
    shopify_shop_name: '',
    shopify_api_key: '',
    shopify_api_secret: '',
    ups_enabled: false,
    // need to get this API information and create the nodeJS npm module for it.
    usps_enabled: false,
    fedex_enabled: false
  },
  default_admin: 'admin@uh-sem-blee.com',
  default_password: 'p@55w0rd',
  reserved_usernames: [
    'default',
    'admin',
    'administrator',
    'moderator',
    'root',
    'system'
  ]
}