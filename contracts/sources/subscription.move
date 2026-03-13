module shelby_newsletter::subscription {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use shelby_newsletter::newsletter;

    // -------------------------------------------------------
    // Errors
    // -------------------------------------------------------
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_SUBSCRIPTION_EXPIRED: u64 = 2;
    const E_ALREADY_SUBSCRIBED: u64 = 3;

    // Monthly price in Octas (5 APT)
    const MONTHLY_PRICE: u64 = 500_000_000;
    // Annual price in Octas (50 APT)
    const ANNUAL_PRICE: u64 = 5_000_000_000;
    // Seconds in 30 days
    const MONTH_SECONDS: u64 = 2_592_000;
    // Seconds in 365 days
    const YEAR_SECONDS: u64 = 31_536_000;

    // -------------------------------------------------------
    // Structs
    // -------------------------------------------------------

    struct SubscriptionRecord has store, drop, copy {
        publication: address,
        tier: String,           // "monthly" | "annual" | "founding"
        started_at: u64,
        expires_at: u64,        // 0 = never (founding)
    }

    struct Subscriptions has key {
        records: vector<SubscriptionRecord>,
        total_paid: u64,
    }

    struct EarningsVault has key {
        balance: u64,
    }

    // -------------------------------------------------------
    // Entry functions
    // -------------------------------------------------------

    /// Subscribe to a publication (monthly or annual)
    public entry fun subscribe(
        reader: &signer,
        publication: address,
        tier: String,
    ) acquires Subscriptions, EarningsVault {
        let reader_addr = signer::address_of(reader);
        let now = timestamp::now_seconds();

        let (price, expires_at) = if (tier == std::string::utf8(b"monthly")) {
            (MONTHLY_PRICE, now + MONTH_SECONDS)
        } else if (tier == std::string::utf8(b"annual")) {
            (ANNUAL_PRICE, now + YEAR_SECONDS)
        } else {
            abort E_INSUFFICIENT_PAYMENT
        };

        // Transfer payment to publication vault
        let payment = coin::withdraw<AptosCoin>(reader, price);
        if (!exists<EarningsVault>(publication)) {
            // Initialize vault for new publication (first subscriber)
            // In practice, writer calls init_vault separately
        };
        // TODO: deposit to EarningsVault when initialized

        // Record subscription
        if (!exists<Subscriptions>(reader_addr)) {
            move_to(reader, Subscriptions {
                records: vector::empty<SubscriptionRecord>(),
                total_paid: 0,
            });
        };

        let subs = borrow_global_mut<Subscriptions>(reader_addr);
        vector::push_back(&mut subs.records, SubscriptionRecord {
            publication,
            tier,
            started_at: now,
            expires_at,
        });
        subs.total_paid = subs.total_paid + price;

        // Return coin to avoid drop abort (temp until vault ready)
        coin::deposit(publication, payment);
    }

    /// Pay for a single article (pay-per-read)
    public entry fun pay_per_read(
        reader: &signer,
        publication: address,
        blob_id: String,
        amount: u64,
    ) acquires EarningsVault {
        let payment = coin::withdraw<AptosCoin>(reader, amount);
        coin::deposit(publication, payment);

        // Grant access on-chain
        newsletter::grant_access(reader, blob_id);
    }

    /// Check if a reader has an active subscription
    #[view]
    public fun check_subscription(
        reader: address,
        publication: address,
    ): bool acquires Subscriptions {
        if (!exists<Subscriptions>(reader)) return false;

        let subs = &borrow_global<Subscriptions>(reader).records;
        let now = timestamp::now_seconds();
        let i = 0;
        let len = vector::length(subs);

        while (i < len) {
            let sub = vector::borrow(subs, i);
            if (sub.publication == publication) {
                // expires_at == 0 means founding/lifetime
                if (sub.expires_at == 0 || sub.expires_at > now) {
                    return true
                };
            };
            i = i + 1;
        };

        false
    }

    /// Writer withdraws accumulated earnings
    public entry fun withdraw_earnings(
        author: &signer,
    ) acquires EarningsVault {
        let addr = signer::address_of(author);
        assert!(exists<EarningsVault>(addr), 0);

        let vault = borrow_global_mut<EarningsVault>(addr);
        let amount = vault.balance;
        vault.balance = 0;

        let coins = coin::withdraw<AptosCoin>(author, amount);
        coin::deposit(addr, coins);
    }
}
