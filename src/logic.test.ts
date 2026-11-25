import { describe, it, expect } from 'vitest';
import {
  COLUMNS, ROWS, SHAPES, type Board, type PieceType,
  createBoard, createPiece, rotate, collides, mergePiece, clearLines,
  lineClearScore, levelForLines, dropInterval, shuffledBag,
} from './logic';

function fullRow(type: PieceType = 'I'): (PieceType | null)[] {
  return Array<PieceType | null>(COLUMNS).fill(type);
}

describe('createBoard', () => {
  it('creates an empty board with the correct size', () => {
    const board = createBoard();
    expect(board).toHaveLength(ROWS);
    board.forEach((row) => expect(row).toHaveLength(COLUMNS));
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });

  it('creates independent rows', () => {
    const board = createBoard();
    board[0][0] = 'T';
    expect(board[1][0]).toBeNull();
  });
});

describe('createPiece', () => {
  it('spawns pieces centered at the top', () => {
    const piece = createPiece('I');
    expect(piece.type).toBe('I');
    expect(piece.y).toBe(0);
    expect(piece.x).toBe(3);
    expect(createPiece('O').x).toBe(4);
  });

  it('copies the shape so the original is not changed', () => {
    const piece = createPiece('T');
    piece.matrix[0][0] = 9;
    expect(SHAPES.T[0][0]).toBe(0);
  });
});

describe('rotate', () => {
  it('rotates a matrix clockwise', () => {
    expect(rotate([[1, 1, 1, 1]])).toEqual([[1], [1], [1], [1]]);
    expect(rotate(SHAPES.T)).toEqual([[1, 0], [1, 1], [1, 0]]);
  });

  it('returns to the original shape after four rotations', () => {
    let matrix = SHAPES.L;
    for (let i = 0; i < 4; i++) matrix = rotate(matrix);
    expect(matrix).toEqual(SHAPES.L);
  });
});

describe('collides', () => {
  it('detects no collision on an empty board', () => {
    expect(collides(createBoard(), createPiece('T'))).toBe(false);
  });

  it('detects the left and right walls', () => {
    const board = createBoard();
    const piece = { ...createPiece('O'), x: 0 };
    expect(collides(board, piece, -1, 0)).toBe(true);
    const right = { ...createPiece('O'), x: COLUMNS - 2 };
    expect(collides(board, right, 1, 0)).toBe(true);
  });

  it('detects the floor', () => {
    const piece = { ...createPiece('O'), y: ROWS - 2 };
    expect(collides(createBoard(), piece, 0, 1)).toBe(true);
  });

  it('detects blocks already on the board', () => {
    const board = createBoard();
    board[1][4] = 'Z';
    expect(collides(board, createPiece('O'), 0, 0)).toBe(true);
  });
});

describe('mergePiece', () => {
  it('writes the piece into a copy of the board', () => {
    const board = createBoard();
    const merged = mergePiece(board, { ...createPiece('O'), y: ROWS - 2 });
    expect(merged[ROWS - 1][4]).toBe('O');
    expect(merged[ROWS - 2][5]).toBe('O');
    expect(board[ROWS - 1][4]).toBeNull();
  });
});

describe('clearLines', () => {
  it('clears nothing when no row is full', () => {
    const result = clearLines(createBoard());
    expect(result.cleared).toBe(0);
    expect(result.board).toHaveLength(ROWS);
  });

  it('removes full rows and adds empty rows on top', () => {
    const board: Board = createBoard();
    board[ROWS - 1] = fullRow();
    board[ROWS - 2] = fullRow();
    board[ROWS - 3][0] = 'S';
    const result = clearLines(board);
    expect(result.cleared).toBe(2);
    expect(result.board).toHaveLength(ROWS);
    expect(result.board[ROWS - 1][0]).toBe('S');
    expect(result.board[0].every((cell) => cell === null)).toBe(true);
  });
});

describe('scoring and levels', () => {
  it('gives classic rewards multiplied by the level', () => {
    expect(lineClearScore(0, 1)).toBe(0);
    expect(lineClearScore(1, 1)).toBe(100);
    expect(lineClearScore(4, 1)).toBe(800);
    expect(lineClearScore(2, 3)).toBe(900);
  });

  it('increases the level every 10 lines', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it('gets faster with higher levels but never below 90 ms', () => {
    expect(dropInterval(1)).toBe(800);
    expect(dropInterval(2)).toBe(735);
    expect(dropInterval(50)).toBe(90);
  });
});

describe('shuffledBag', () => {
  it('contains each of the seven pieces exactly once', () => {
    const bag = shuffledBag();
    expect(bag).toHaveLength(7);
    expect([...bag].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it('uses the given random function', () => {
    expect(shuffledBag(() => 0)).not.toEqual(shuffledBag(() => 0.99));
  });
});
