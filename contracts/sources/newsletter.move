module shelby_newsletter::newsletter {
    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event;

    // -------------------------------------------------------
    // Errors
    // -------------------------------------------------------
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_ISSUE_NOT_FOUND: u64 = 4;

    // -------------------------------------------------------
    // Structs
    // -------------------------------------------------------

    /// Represents a single published issue
    struct Issue has store, drop, copy {
        blob_id: String,        // Shelby blob ID
        title: String,
        preview: String,        // First 200 chars, always public
        access_tier: String,    // "free" | "paid" | "nft_gated"
        price: u64,             // in Octas (0 if free)
        issue_number: u64,
        published_at: u64,      // unix timestamp
        tags: vector<String>,
    }

    /// A writer's publication — holds all their issues
    struct Publication has key {
        author: address,
        issues: vector<Issue>,
        issue_count: u64,
        total_earnings: u64,
        publish_events: event::EventHandle<PublishEvent>,
    }

    /// Access grant — records that a reader paid for a blob
    struct AccessGrant has key {
        grants: vector<GrantRecord>,
    }

    struct GrantRecord has store, drop, copy {
        blob_id: String,
        reader: address,
        granted_at: u64,
    }

    // -------------------------------------------------------
    // Events
    // -------------------------------------------------------

    struct PublishEvent has drop, store {
        blob_id: String,
        issue_number: u64,
        access_tier: String,
        price: u64,
        published_at: u64,
    }

    // -------------------------------------------------------
    // Entry functions
    // -------------------------------------------------------

    /// Initialize a publication for a new writer
    public entry fun init_publication(author: &signer) {
        let addr = signer::address_of(author);
        assert!(!exists<Publication>(addr), E_ALREADY_INITIALIZED);

        move_to(author, Publication {
            author: addr,
            issues: vector::empty<Issue>(),
            issue_count: 0,
            total_earnings: 0,
            publish_events: account::new_event_handle<PublishEvent>(author),
        });
    }

    /// Publish a new issue — stores blob_id + metadata on-chain
    public entry fun publish_issue(
        author: &signer,
        blob_id: String,
        title: String,
        preview: String,
        access_tier: String,
        price: u64,
        tags: vector<String>,
    ) acquires Publication {
        let addr = signer::address_of(author);
        assert!(exists<Publication>(addr), E_NOT_INITIALIZED);

        let pub = borrow_global_mut<Publication>(addr);
        let issue_number = pub.issue_count + 1;
        let now = timestamp::now_seconds();

        let issue = Issue {
            blob_id,
            title,
            preview,
            access_tier,
            price,
            issue_number,
            published_at: now,
            tags,
        };

        event::emit_event(&mut pub.publish_events, PublishEvent {
            blob_id: issue.blob_id,
            issue_number,
            access_tier: issue.access_tier,
            price,
            published_at: now,
        });

        vector::push_back(&mut pub.issues, issue);
        pub.issue_count = issue_number;
    }

    /// Verify whether a reader has access to a blob
    #[view]
    public fun verify_access(reader: address, blob_id: String): bool acquires AccessGrant {
        if (!exists<AccessGrant>(reader)) return false;

        let grants = &borrow_global<AccessGrant>(reader).grants;
        let i = 0;
        let len = vector::length(grants);

        while (i < len) {
            let g = vector::borrow(grants, i);
            if (g.blob_id == blob_id) return true;
            i = i + 1;
        };

        false
    }

    /// Get all issues for a publication
    #[view]
    public fun get_all_issues(author: address): vector<Issue> acquires Publication {
        assert!(exists<Publication>(author), E_NOT_INITIALIZED);
        borrow_global<Publication>(author).issues
    }

    /// Grant access after payment (called by subscription module)
    public fun grant_access(
        reader: &signer,
        blob_id: String,
    ) acquires AccessGrant {
        let addr = signer::address_of(reader);

        if (!exists<AccessGrant>(addr)) {
            move_to(reader, AccessGrant { grants: vector::empty<GrantRecord>() });
        };

        let grants = borrow_global_mut<AccessGrant>(addr);
        let record = GrantRecord {
            blob_id,
            reader: addr,
            granted_at: timestamp::now_seconds(),
        };
        vector::push_back(&mut grants.grants, record);
    }
}
