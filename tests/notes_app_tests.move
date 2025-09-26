// notes_app/tests/notes_app_tests.move

#[test_only]
module notes_app::notes_test {
    use std::string;
    use sui::test_utils::{destroy};
    use std::unit_test::assert_eq;
    use notes_app::notes;




    #[test]
    fun test_create_note() {
        let mut ctx = tx_context::dummy();
        let content = string::utf8(b"hello world");

        // construct the Note locally (same shape as notes::Note)
        let note = notes::make_note_for_test(content, &mut ctx);

        // compare strings using the helper
        let got = notes::get_content(&note);
        let expected = string::utf8(b"hello world");

        assert_eq!(got, expected);

        // destroy so tests don't leak objects
        destroy(note);
    }

    #[test]
    fun test_update_note() {
        let mut ctx = tx_context::dummy();
        let old_content = string::utf8(b"old");

        let mut note = notes::make_note_for_test(old_content, &mut ctx);

        let new_content = string::utf8(b"new");

        // call your update function (mutates in place)
        notes::update_note(&mut note, new_content);

        let got = notes::get_content(&note);
        let expected = string::utf8(b"new");
        assert_eq!(got, expected);

        destroy(note);
    }

    #[test]
    fun test_get_content() {
        let mut ctx = tx_context::dummy();
        let content = string::utf8(b"test content");

        let note = notes::make_note_for_test(content, &mut ctx);

        let got = notes::get_content(&note);
        let expected = string::utf8(b"test content");
        assert_eq!(got, expected);

        destroy(note);
    }
}
