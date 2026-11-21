// Phase 3 checks: the ported domain commands against a real SQLite file.
use serde_json::{json, Value};

use crate::crypto::VaultCipher;
use crate::db::open;
use crate::repo::{folders, prompts, vault, vault_folders};

/// Fixed test key — the OS credential store is never touched by unit tests.
fn cipher() -> VaultCipher {
    VaultCipher::from_key_bytes(&[7u8; 32]).expect("test key")
}

fn setup() -> (tempfile::TempDir, rusqlite::Connection) {
    let dir = tempfile::tempdir().expect("temp dir");
    let path = dir.path().join("quickprompt.db");
    let conn = open(&path).expect("open db");
    (dir, conn)
}

fn parse<T: serde::de::DeserializeOwned>(value: Value) -> T {
    serde_json::from_value(value).expect("deserialize input")
}

fn prompt(conn: &rusqlite::Connection, title: &str, content: &str, tags: &str) -> Value {
    prompts::create(
        conn,
        parse(json!({ "title": title, "content": content, "tags": tags })),
    )
    .expect("create prompt")
}

#[test]
fn prompts_crud_pagination_and_search() {
    let (_dir, conn) = setup();
    let first = prompt(&conn, "  Alpha  ", "first body", "work");
    let second = prompts::create(
        &conn,
        parse(json!({
            "title": "Beta",
            "content": "second body",
            "created_at": "2020-01-01T00:00:00.000Z",
            "updated_at": "2020-01-01T00:00:00.000Z",
        })),
    )
    .expect("create imported prompt");

    assert_eq!(first["title"], "Alpha");
    assert_eq!(first["favorite"], 0);
    assert_eq!(second["created_at"], "2020-01-01T00:00:00.000Z");
    assert!(first["created_at"].as_str().unwrap().ends_with('Z'));

    let all = prompts::get_all(&conn).expect("all prompts");
    assert_eq!(all.len(), 2);

    let page = prompts::get_paginated(&conn, parse(json!({ "limit": 1 }))).expect("page");
    assert_eq!(page["total"], 2);
    assert_eq!(page["prompts"].as_array().unwrap().len(), 1);

    let found = prompts::get_paginated(&conn, parse(json!({ "search": "alpha" }))).expect("search");
    assert_eq!(found["total"], 1);
    assert_eq!(found["prompts"][0]["title"], "Alpha");

    let tags_only =
        prompts::get_paginated(&conn, parse(json!({ "search": "wor", "tagsOnly": true })))
            .expect("tag search");
    assert_eq!(tags_only["total"], 1);

    let missing =
        prompts::get_paginated(&conn, parse(json!({ "search": "nope" }))).expect("no match");
    assert_eq!(missing["total"], 0);

    let updated = prompts::update(
        &conn,
        first["id"].as_str().unwrap(),
        parse(json!({ "title": "  Renamed  ", "tags": "work,ideas" })),
    )
    .expect("update")
    .expect("prompt exists");
    assert_eq!(updated["title"], "Renamed");
    assert_eq!(updated["tags"], "work,ideas");

    let toggled = prompts::toggle_favorite(&conn, first["id"].as_str().unwrap()).expect("favorite");
    assert_eq!(toggled["favorite"], 1);
    let favorites_only =
        prompts::get_paginated(&conn, parse(json!({ "favoritesOnly": true }))).expect("favorites");
    assert_eq!(favorites_only["total"], 1);

    prompts::update_order(
        &conn,
        parse(json!([
            { "id": first["id"], "sort_order": 2 },
            { "id": second["id"], "sort_order": 1 }
        ])),
    )
    .expect("reorder");
    let custom = prompts::get_paginated(&conn, parse(json!({ "sortOrder": "custom" })))
        .expect("custom order");
    // Favourites sort first, then sort_order: Renamed (favourite) then Beta.
    assert_eq!(custom["prompts"][0]["title"], "Renamed");
    assert_eq!(custom["prompts"][1]["title"], "Beta");

    let tag = prompts::create_tag(&conn, "  Ideas ").expect("tag");
    assert_eq!(tag["name"], "ideas");
    let again = prompts::create_tag(&conn, "ideas").expect("existing tag");
    assert_eq!(again["id"], tag["id"]);
    assert_eq!(prompts::get_all_tags(&conn).expect("tags").len(), 1);

    prompts::delete(&conn, first["id"].as_str().unwrap()).expect("delete");
    assert_eq!(prompts::get_all(&conn).expect("remaining").len(), 1);
}

#[test]
fn folders_tree_membership_and_move() {
    let (_dir, conn) = setup();
    let work = folders::create(&conn, parse(json!({ "name": " Work " }))).expect("root");
    let home = folders::create(&conn, parse(json!({ "name": "Home" }))).expect("root 2");
    let child = folders::create(
        &conn,
        parse(json!({ "name": "Sub", "parentId": work["id"] })),
    )
    .expect("child");

    assert_eq!(work["sort_order"], 0);
    assert_eq!(home["sort_order"], 1);
    assert_eq!(child["parent_id"], work["id"]);
    assert_eq!(folders::roots(&conn).expect("roots").len(), 2);
    assert_eq!(
        folders::children(&conn, work["id"].as_str().unwrap())
            .expect("children")
            .len(),
        1
    );

    let trail = folders::breadcrumb(&conn, child["id"].as_str().unwrap()).expect("breadcrumb");
    assert_eq!(trail.len(), 2);
    assert_eq!(trail[0]["name"], "Work");
    assert_eq!(trail[1]["name"], "Sub");

    let saved = prompt(&conn, "Prompt", "body", "");
    let prompt_id = saved["id"].as_str().unwrap();
    folders::add_prompt(&conn, prompt_id, work["id"].as_str().unwrap()).expect("add");
    folders::add_prompt(&conn, prompt_id, work["id"].as_str().unwrap()).expect("idempotent");

    let in_work =
        folders::get_prompts(&conn, work["id"].as_str().unwrap(), Default::default()).expect("list");
    assert_eq!(in_work["total"], 1);
    assert_eq!(in_work["prompts"][0]["id"], prompt_id);
    assert_eq!(
        folders::get_prompt_folders(&conn, prompt_id)
            .expect("prompt folders")
            .len(),
        1
    );

    folders::move_prompt(
        &conn,
        prompt_id,
        work["id"].as_str().unwrap(),
        home["id"].as_str().unwrap(),
    )
    .expect("move");
    assert_eq!(
        folders::get_prompts(&conn, home["id"].as_str().unwrap(), Default::default())
            .expect("target")
            .get("total")
            .unwrap(),
        1
    );
    assert_eq!(
        folders::get_prompts(&conn, work["id"].as_str().unwrap(), Default::default())
            .expect("source")
            .get("total")
            .unwrap(),
        0
    );

    folders::remove_prompt(&conn, prompt_id, home["id"].as_str().unwrap()).expect("remove");
    assert_eq!(
        folders::get_prompts(&conn, home["id"].as_str().unwrap(), Default::default())
            .expect("empty")
            .get("total")
            .unwrap(),
        0
    );

    assert_eq!(folders::search(&conn, "wor").expect("folder search").len(), 1);

    folders::rename(&conn, home["id"].as_str().unwrap(), " Home Base ").expect("rename");
    assert_eq!(
        folders::find(&conn, home["id"].as_str().unwrap())
            .expect("find")
            .unwrap()["name"],
        "Home Base"
    );

    folders::delete(&conn, work["id"].as_str().unwrap()).expect("delete tree");
    assert!(
        folders::find(&conn, child["id"].as_str().unwrap())
            .expect("find child")
            .is_none(),
        "subfolders cascade with foreign keys on"
    );
}

#[test]
fn vault_items_round_trip_and_listing() {
    let (_dir, conn) = setup();
    let cipher = cipher();
    let created = vault::create(
        &conn,
        &cipher,
        parse(json!({
            "title": " Card ",
            "type": "login",
            "value": "secret-value",
            "notes": "notes",
            "tags": "Work, Ideas",
            "meta": { "user": "me", "blank": "" },
            "url": " https://example.com ",
            "color_bg": "#fff",
            "color_text": "#000"
        })),
    )
    .expect("create item");

    assert_eq!(created["title"], "Card");
    assert_eq!(created["type"], "login");
    assert_eq!(created["tags"], json!(["work", "ideas"]));
    assert_eq!(created["meta"], json!({ "user": "me" }));
    assert_eq!(created["url"], "https://example.com");
    assert_eq!(created["hasValue"], true);
    assert_eq!(created["favorite"], false);
    assert!(created.get("value").is_none(), "values never leave via mapRow");

    let id = created["id"].as_str().unwrap();
    let revealed = vault::reveal(&conn, &cipher, id)
        .expect("reveal")
        .expect("exists");
    assert_eq!(revealed["value"], "secret-value");

    // At rest the row holds ciphertext only, flagged as encrypted.
    let stored = conn
        .query_row(
            "SELECT value, is_encrypted FROM vault_items WHERE id = ?",
            rusqlite::params![id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?)),
        )
        .expect("stored row");
    assert_eq!(stored.1, 1, "payload is marked encrypted");
    assert!(!stored.0.contains("secret-value"), "no plaintext at rest");

    vault::update(
        &conn,
        &cipher,
        id,
        parse(json!({ "title": "Renamed", "value": "new-value", "tags": [] })),
    )
    .expect("update");
    let after = vault::reveal(&conn, &cipher, id)
        .expect("reveal")
        .expect("exists");
    assert_eq!(after["title"], "Renamed");
    assert_eq!(after["value"], "new-value");
    assert_eq!(after["tags"], json!([]));

    let listed = vault::list(&conn, parse(json!({ "search": "renamed" }))).expect("search");
    assert_eq!(listed.len(), 1);
    assert_eq!(
        vault::list(&conn, parse(json!({ "type": "note" }))).expect("wrong type").len(),
        0
    );

    let pinned = vault::toggle_pin(&conn, id).expect("pin");
    assert_eq!(pinned["pinned"], true);
    let favorite = vault::toggle_favorite(&conn, id).expect("favorite");
    assert_eq!(favorite["favorite"], true);

    vault::update_order(&conn, parse(json!([{ "id": id, "sort_order": 3 }]))).expect("order");
    assert_eq!(
        vault::get(&conn, id).expect("get").unwrap()["sort_order"],
        3
    );
}

#[test]
fn vault_attachments_and_folders() {
    let (_dir, conn) = setup();
    let cipher = cipher();
    let item = vault::create(
        &conn,
        &cipher,
        parse(json!({ "title": "With file", "value": "v" })),
    )
    .expect("item");
    let item_id = item["id"].as_str().unwrap();

    let attachment = vault::create_attachment(
        &conn,
        &cipher,
        parse(json!({
            "vaultItemId": item_id,
            "filename": " note.txt ",
            "mimeType": "text/plain",
            "data": "aGVsbG8="
        })),
    )
    .expect("attachment");
    assert_eq!(attachment["filename"], "note.txt");
    assert_eq!(attachment["size"], 8);
    assert!(attachment.get("data").is_none());

    let downloaded = vault::attachment_data(
        &conn,
        &cipher,
        attachment["id"].as_str().unwrap(),
    )
        .expect("download")
        .expect("row");
    assert_eq!(downloaded["data"], "aGVsbG8=");
    assert_eq!(
        vault::list_attachments(&conn, item_id).expect("list").len(),
        1
    );
    assert!(vault::delete_attachment(&conn, attachment["id"].as_str().unwrap()).expect("delete"));
    assert!(
        vault::attachment_data(&conn, &cipher, attachment["id"].as_str().unwrap())
            .expect("download again")
            .is_none()
    );

    let folder = vault_folders::create(&conn, parse(json!({ "name": "Secrets" }))).expect("folder");
    let folder_id = folder["id"].as_str().unwrap();
    vault_folders::add_item(&conn, item_id, folder_id).expect("add item");
    vault_folders::add_item(&conn, item_id, folder_id).expect("idempotent");

    let items = vault_folders::get_items(&conn, folder_id, Default::default()).expect("items");
    assert_eq!(items["total"], 1);
    assert_eq!(items["items"][0]["id"], item_id);
    assert_eq!(
        vault_folders::get_item_folders(&conn, item_id)
            .expect("item folders")
            .len(),
        1
    );

    let trail = vault_folders::breadcrumb(&conn, folder_id).expect("breadcrumb");
    assert_eq!(trail[0]["name"], "Secrets");
    assert_eq!(vault_folders::search(&conn, "sec").expect("search").len(), 1);

    vault_folders::remove_item(&conn, item_id, folder_id).expect("remove");
    assert_eq!(
        vault_folders::get_items(&conn, folder_id, Default::default())
            .expect("empty")
            .get("total")
            .unwrap(),
        0
    );

    vault::delete(&conn, item_id).expect("delete item");
    assert!(vault::get(&conn, item_id).expect("get").is_none());
}
