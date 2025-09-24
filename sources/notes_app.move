/*
/// Module: notes_app
module notes_app::notes_app;
*/
module notes_app :: notes{
    use std::string;
    use sui::tx_context;
    use sui::tx_context::TxContext;

    /// Note Struct to hold note data
    public struct Note has key {
        id: UID,
        content: string::String,
    }

    /// Public Function: create_note - creates a new note
    public entry fun create_note(content:  string::String, ctx: &mut TxContext) {
        let note = Note {
            id: object::new(ctx),
            content,
        };
        transfer :: transfer(note, tx_context:: sender(ctx));

    }

    /// Public Function: update_note - updates the content of an existing note
    public entry fun update_note(note: &mut Note, new_content:  string::String) {
        note.content = new_content;
    }

    /// Public Function: get_content - retrieves the content of a note
    public fun get_content(note: &Note):  string::String {
        note.content
    }
}

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
