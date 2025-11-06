/**
 * Board Store
 * Manages boards and their layouts with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, BoardLayout } from '../types/board';
import { logger } from '../utils/logger';

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  layouts: Map<string, BoardLayout>;

  // Actions
  createBoard: (name: string, listIds?: string[]) => Board;
  deleteBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  setCurrentBoard: (id: string) => void;
  updateBoardLayout: (boardId: string, layout: Partial<BoardLayout>) => void;
  reorderLists: (boardId: string, listOrder: string[]) => void;
  addListToBoard: (boardId: string, listId: string) => void;
  removeListFromBoard: (boardId: string, listId: string) => void;
  toggleListCollapse: (boardId: string, listId: string) => void;
  getBoardById: (id: string) => Board | undefined;
  getCurrentBoard: () => Board | undefined;
  getBoardLayout: (boardId: string) => BoardLayout | undefined;
}

const DEFAULT_BOARD_ID = 'default-board';

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [
        {
          id: DEFAULT_BOARD_ID,
          name: 'My Tasks',
          lists: [],
          backgroundColor: '#1e293b',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      currentBoardId: DEFAULT_BOARD_ID,
      layouts: new Map([
        [
          DEFAULT_BOARD_ID,
          {
            boardId: DEFAULT_BOARD_ID,
            listOrder: [],
            collapsedLists: [],
            viewMode: 'board',
          },
        ],
      ]),

      /**
       * Creates a new board
       */
      createBoard: (name: string, listIds: string[] = []) => {
        logger.log('[BoardStore] Creating board:', name);

        const newBoard: Board = {
          id: `board-${Date.now()}`,
          name,
          lists: listIds,
          backgroundColor: '#1e293b',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newLayout: BoardLayout = {
          boardId: newBoard.id,
          listOrder: listIds,
          collapsedLists: [],
          viewMode: 'board',
        };

        set((state) => {
          const newLayouts = new Map(state.layouts);
          newLayouts.set(newBoard.id, newLayout);
          return {
            boards: [...state.boards, newBoard],
            layouts: newLayouts,
          };
        });

        logger.log('[BoardStore] Board created:', newBoard);
        return newBoard;
      },

      /**
       * Deletes a board (cannot delete default board)
       */
      deleteBoard: (id: string) => {
        if (id === DEFAULT_BOARD_ID) {
          logger.warn('[BoardStore] Cannot delete default board');
          return;
        }

        logger.log('[BoardStore] Deleting board:', id);

        set((state) => {
          const newLayouts = new Map(state.layouts);
          newLayouts.delete(id);
          return {
            boards: state.boards.filter((b) => b.id !== id),
            layouts: newLayouts,
            currentBoardId: state.currentBoardId === id ? DEFAULT_BOARD_ID : state.currentBoardId,
          };
        });
      },

      /**
       * Updates board properties
       */
      updateBoard: (id: string, updates: Partial<Board>) => {
        logger.log(`[BoardStore] Updating board ${id}:`, updates);

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === id
              ? { ...b, ...updates, updatedAt: new Date().toISOString() }
              : b
          ),
        }));
      },

      /**
       * Sets the current active board
       */
      setCurrentBoard: (id: string) => {
        logger.log('[BoardStore] Setting current board:', id);

        const board = get().boards.find((b) => b.id === id);
        if (!board) {
          logger.error(`[BoardStore] Board ${id} not found`);
          return;
        }

        set({ currentBoardId: id });
      },

      /**
       * Updates board layout settings
       */
      updateBoardLayout: (boardId: string, layoutUpdates: Partial<BoardLayout>) => {
        logger.log(`[BoardStore] Updating layout for board ${boardId}:`, layoutUpdates);

        set((state) => {
          const currentLayout = state.layouts.get(boardId);
          const newLayouts = new Map(state.layouts);
          if (currentLayout) {
            newLayouts.set(boardId, { ...currentLayout, ...layoutUpdates });
          } else {
            // Create new layout if it doesn't exist
            newLayouts.set(boardId, {
              boardId,
              listOrder: [],
              collapsedLists: [],
              viewMode: 'board',
              ...layoutUpdates,
            } as BoardLayout);
          }
          return { layouts: newLayouts };
        });
      },

      /**
       * Reorders lists in a board
       */
      reorderLists: (boardId: string, listOrder: string[]) => {
        logger.log(`[BoardStore] Reordering lists in board ${boardId}:`, listOrder);

        set((state) => {
          const newLayouts = new Map(state.layouts);
          const layout = state.layouts.get(boardId);
          if (layout) {
            newLayouts.set(boardId, { ...layout, listOrder });
          }

          return {
            boards: state.boards.map((b) =>
              b.id === boardId
                ? { ...b, lists: listOrder, updatedAt: new Date().toISOString() }
                : b
            ),
            layouts: newLayouts,
          };
        });
      },

      /**
       * Adds a list to a board
       */
      addListToBoard: (boardId: string, listId: string) => {
        logger.log(`[BoardStore] Adding list ${listId} to board ${boardId}`);

        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          if (!board || board.lists.includes(listId)) {
            return state;
          }

          const newLayouts = new Map(state.layouts);
          const layout = state.layouts.get(boardId);
          if (layout && !layout.listOrder.includes(listId)) {
            newLayouts.set(boardId, {
              ...layout,
              listOrder: [...layout.listOrder, listId],
            });
          }

          return {
            boards: state.boards.map((b) =>
              b.id === boardId
                ? { ...b, lists: [...b.lists, listId], updatedAt: new Date().toISOString() }
                : b
            ),
            layouts: newLayouts,
          };
        });
      },

      /**
       * Removes a list from a board
       */
      removeListFromBoard: (boardId: string, listId: string) => {
        logger.log(`[BoardStore] Removing list ${listId} from board ${boardId}`);

        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) {
            return state;
          }

          const newLayouts = new Map(state.layouts);
          const layout = state.layouts.get(boardId);
          if (layout) {
            newLayouts.set(boardId, {
              ...layout,
              listOrder: layout.listOrder.filter((id) => id !== listId),
              collapsedLists: layout.collapsedLists.filter((id) => id !== listId),
            });
          }

          return {
            boards: state.boards.map((b) =>
              b.id === boardId
                ? { ...b, lists: b.lists.filter((id) => id !== listId), updatedAt: new Date().toISOString() }
                : b
            ),
            layouts: newLayouts,
          };
        });
      },

      /**
       * Toggles collapsed state of a list in a board
       */
      toggleListCollapse: (boardId: string, listId: string) => {
        logger.log(`[BoardStore] Toggling collapse for list ${listId} in board ${boardId}`);

        set((state) => {
          const layout = state.layouts.get(boardId);
          if (!layout) {
            return state;
          }

          const newLayouts = new Map(state.layouts);
          const index = layout.collapsedLists.indexOf(listId);
          const newCollapsedLists = [...layout.collapsedLists];

          if (index !== -1) {
            newCollapsedLists.splice(index, 1);
          } else {
            newCollapsedLists.push(listId);
          }

          newLayouts.set(boardId, {
            ...layout,
            collapsedLists: newCollapsedLists,
          });

          return { layouts: newLayouts };
        });
      },

      /**
       * Gets a board by ID
       */
      getBoardById: (id: string) => {
        return get().boards.find((b) => b.id === id);
      },

      /**
       * Gets the current active board
       */
      getCurrentBoard: () => {
        const currentId = get().currentBoardId;
        if (!currentId) return undefined;
        return get().boards.find((b) => b.id === currentId);
      },

      /**
       * Gets layout for a specific board
       */
      getBoardLayout: (boardId: string) => {
        return get().layouts.get(boardId);
      },
    }),
    {
      name: 'board-storage',
      // Custom storage to handle Map serialization and contextIsolation
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Convert layouts array back to Map
          if (data.state?.layouts) {
            data.state.layouts = new Map(data.state.layouts);
          }
          return data;
        },
        setItem: (name, value) => {
          // Convert Map to array for JSON serialization
          const serialized = {
            ...value,
            state: {
              ...value.state,
              layouts: Array.from(value.state.layouts.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
