
module notes_app :: notes{
    use std::string;


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

    // Test-only constructor so tests can create Note values without accessing private fields
    #[test_only]
    public fun make_note_for_test(content: string::String, ctx: &mut TxContext): Note {
        Note {
            id: object::new(ctx),
            content,
        }
    }
}

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
