module shelby_newsletter::social {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event;

    struct Comment has store, drop, copy {
        id: u64,
        blob_id: String,
        author: address,
        content: String,
        parent_id: u64,
        created_at: u64,
        likes: u64,
    }

    struct Comments has key {
        list: vector<Comment>,
        count: u64,
        comment_events: event::EventHandle<CommentEvent>,
    }

    struct Likes has key {
        blob_ids: vector<String>,
        count: u64,
    }

    struct Follows has key {
        following: vector<address>,
    }

    struct CommentEvent has drop, store {
        blob_id: String,
        author: address,
        content: String,
        created_at: u64,
    }

    public entry fun add_comment(
        author: &signer,
        blob_id: String,
        content: String,
        parent_id: u64,
    ) acquires Comments {
        let author_addr = signer::address_of(author);
        let now = timestamp::now_seconds();

        if (!exists<Comments>(author_addr)) {
            move_to(author, Comments {
                list: vector::empty<Comment>(),
                count: 0,
                comment_events: account::new_event_handle<CommentEvent>(author),
            });
        };

        let comments = borrow_global_mut<Comments>(author_addr);
        let id = comments.count + 1;

        event::emit_event(&mut comments.comment_events, CommentEvent {
            blob_id, author: author_addr, content, created_at: now,
        });

        vector::push_back(&mut comments.list, Comment {
            id, blob_id, author: author_addr, content,
            parent_id, created_at: now, likes: 0,
        });

        comments.count = id;
    }

    public entry fun like_article(user: &signer, blob_id: String) acquires Likes {
        let addr = signer::address_of(user);
        if (!exists<Likes>(addr)) {
            move_to(user, Likes { blob_ids: vector::empty<String>(), count: 0 });
        };
        let likes = borrow_global_mut<Likes>(addr);
        vector::push_back(&mut likes.blob_ids, blob_id);
        likes.count = likes.count + 1;
    }

    public entry fun unlike_article(user: &signer, blob_id: String) acquires Likes {
        let addr = signer::address_of(user);
        if (!exists<Likes>(addr)) return;
        let likes = borrow_global_mut<Likes>(addr);
        let i = 0;
        let len = vector::length(&likes.blob_ids);
        while (i < len) {
            if (*vector::borrow(&likes.blob_ids, i) == blob_id) {
                vector::remove(&mut likes.blob_ids, i);
                likes.count = likes.count - 1;
                return
            };
            i = i + 1;
        };
    }

    #[view]
    public fun has_liked(user: address, blob_id: String): bool acquires Likes {
        if (!exists<Likes>(user)) return false;
        let likes = &borrow_global<Likes>(user).blob_ids;
        let i = 0;
        let len = vector::length(likes);
        while (i < len) {
            if (*vector::borrow(likes, i) == blob_id) return true;
            i = i + 1;
        };
        false
    }

    public entry fun follow(user: &signer, author: address) acquires Follows {
        let user_addr = signer::address_of(user);
        if (!exists<Follows>(user_addr)) {
            move_to(user, Follows { following: vector::empty<address>() });
        };
        let follows = borrow_global_mut<Follows>(user_addr);
        vector::push_back(&mut follows.following, author);
    }

    public entry fun unfollow(user: &signer, author: address) acquires Follows {
        let user_addr = signer::address_of(user);
        if (!exists<Follows>(user_addr)) return;
        let follows = borrow_global_mut<Follows>(user_addr);
        let i = 0;
        let len = vector::length(&follows.following);
        while (i < len) {
            if (*vector::borrow(&follows.following, i) == author) {
                vector::remove(&mut follows.following, i);
                return
            };
            i = i + 1;
        };
    }

    #[view]
    public fun is_following(user: address, author: address): bool acquires Follows {
        if (!exists<Follows>(user)) return false;
        let following = &borrow_global<Follows>(user).following;
        let i = 0;
        let len = vector::length(following);
        while (i < len) {
            if (*vector::borrow(following, i) == author) return true;
            i = i + 1;
        };
        false
    }
}
