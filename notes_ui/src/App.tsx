// src/App.tsx
import {  useMemo, useState } from 'react';
import {
    ConnectButton,
    useCurrentAccount,
    useSuiClient,
    useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID as string | undefined;

interface NoteObject {
    id: string;
    content: string;
    color: string;   // visual-only by default
    rotation: number;
}

const FALLBACK_COLORS = ['#ffeb3b', '#e91e63', '#4caf50', '#2196f3']; // yellow, pink, green, blue

export default function App() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);

    // Ensure module/type path matches your Move code:
    const noteType = useMemo(() => {
        if (!PACKAGE_ID) return '';
        return `${PACKAGE_ID}::notes_app::Note`;
    }, []);

    // Helper: local color store keyed by objectId
    const getColor = (id: string, index: number) => {
        const saved = localStorage.getItem(`note-color:${id}`);
        return saved || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
    };

    const setColor = (id: string, color: string) => {
        localStorage.setItem(`note-color:${id}`, color);
        // trigger a paint by invalidating notes (cheap)
        queryClient.invalidateQueries({ queryKey: ['notes', account?.address] });
    };

    const {
        data: notes = [],
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['notes', account?.address],
        enabled: !!account?.address && !!noteType,
        queryFn: async (): Promise<NoteObject[]> => {
            if (!account?.address || !noteType) return [];
            const res = await client.getOwnedObjects({
                owner: account.address,
                filter: { StructType: noteType },
                options: { showContent: true, showType: true },
            });

            return res.data.map((obj, index) => {
                const id = (obj.data as any)?.objectId ?? '';
                const content = (obj.data as any)?.content?.fields?.content ?? '';
                const hash = [...id].reduce((a, c) => (a + c.charCodeAt(0)) % 360, 0);
                const rotation = (hash % 8) - 4; // -4..+4 deg
                const color = getColor(id, index);
                return { id, content, color, rotation };
            });
        },
        refetchInterval: 3000,
    });

    const createMutation = useMutation({
        mutationFn: async (content: string) => {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::notes_app::create_note`,
                arguments: [tx.pure.string(content)],
            });
            return await signAndExecute({ transaction: tx, chain: 'sui:testnet' });
        },
        onSuccess: () => {
            setNewNoteContent('');
            queryClient.invalidateQueries({ queryKey: ['notes', account?.address] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::notes_app::update_note`,
                arguments: [tx.object(id), tx.pure.string(content)],
            });
            return await signAndExecute({ transaction: tx, chain: 'sui:testnet' });
        },
        onSuccess: () => {
            setEditingNote(null);
            queryClient.invalidateQueries({ queryKey: ['notes', account?.address] });
        },
        onError: (err) => console.error('Failed to update note:', err),
    });

    const handleCreateNote = () => {
        const content = newNoteContent.trim();
        if (!content || createMutation.isPending) return;
        createMutation.mutate(content);
    };

    const handleUpdateNote = () => {
        if (!editingNote?.content.trim() || updateMutation.isPending) return;
        updateMutation.mutate({ id: editingNote.id, content: editingNote.content.trim() });
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) action();
    };

    return (
        <div className="fridge-container">
            <header className="fridge-header">
                <h1>My Fridge Notes</h1>
                <div className="wallet-section"><ConnectButton /></div>
            </header>

            {!PACKAGE_ID && (
                <div className="error-banner">Missing VITE_PACKAGE_ID in .env.local</div>
            )}

            <div className="fridge-door">
                <div className="fridge-handle" />
                <div className="magnet magnet-1" />
                <div className="magnet magnet-2" />
                <div className="magnet magnet-3" />

                {queryError && (
                    <div className="error-banner">
                        Error loading notes: {(queryError as Error).message}
                    </div>
                )}

                {!account && (
                    <div className="connect-wallet-hint">🔗 Connect your wallet to pin notes.</div>
                )}

                {account && !isLoading && notes.length === 0 && (
                    <div className="empty-state">Your fridge is empty. Add your first note! 🧲</div>
                )}

                <div className="notes-grid">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="sticky-note"
                            style={{ backgroundColor: note.color, transform: `rotate(${note.rotation}deg)` }}
                        >
                            <div className="note-pin" />
                            {editingNote?.id === note.id ? (
                                <div className="note-edit">
                  <textarea
                      value={editingNote.content}
                      onChange={(e) =>
                          setEditingNote({ ...editingNote, content: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyPress(e, handleUpdateNote)}
                      className="note-textarea"
                      disabled={updateMutation.isPending}
                      autoFocus
                  />
                                    <div className="note-actions">
                                        <button
                                            onClick={handleUpdateNote}
                                            disabled={updateMutation.isPending || !editingNote.content.trim()}
                                            className="save-btn"
                                        >
                                            {updateMutation.isPending ? 'Saving…' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingNote(null)}
                                            disabled={updateMutation.isPending}
                                            className="cancel-btn"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="note-content">
                                    <p>{note.content || '(empty note)'}</p>
                                    <div className="note-toolbar">
                                        <button
                                            onClick={() => setEditingNote({ id: note.id, content: note.content })}
                                            className="edit-btn"
                                            disabled={createMutation.isPending}
                                        >
                                            Edit
                                        </button>
                                        {/* simple color palette */}
                                        <div className="color-dots">
                                            {FALLBACK_COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    title="Set color"
                                                    className="color-dot"
                                                    style={{ backgroundColor: c, outline: c === note.color ? '2px solid #333' : 'none' }}
                                                    onClick={() => setColor(note.id, c)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {account && (
                        <div className="add-note-section">
              <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, handleCreateNote)}
                  placeholder="Write your note… (Ctrl/Cmd+Enter to save)"
                  className="add-note-textarea"
                  disabled={createMutation.isPending}
              />
                            <button
                                onClick={handleCreateNote}
                                disabled={createMutation.isPending || !newNoteContent.trim()}
                                className="add-note-btn"
                            >
                                {createMutation.isPending ? 'Pinning…' : 'Pin to Fridge'}
                            </button>

                            {(createMutation.isError || updateMutation.isError) && (
                                <div className="error-message">Failed to save note. Please try again.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
