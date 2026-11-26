const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const LINE_POINTS = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;

const PIECE_SHAPES = {
  I: ["....", "####", "....", "...."],
  J: ["#..", "###", "..."],
  L: ["..#", "###", "..."],
  O: ["##", "##"],
  S: [".##", "##.", "..."],
  T: [".#.", "###", "..."],
  Z: ["##.", ".##", "..."],
};

const PIECE_ROTATIONS = Object.fromEntries(
  Object.entries(PIECE_SHAPES).map(([type, shape]) => {
    const cells = [];
    for (const [y, row] of shape.entries()) {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === "#") cells.push([x, y]);
      }
    }

    const rotations = [cells];
    for (let rotation = 1; rotation < 4; rotation += 1) {
      rotations.push(rotations[rotation - 1].map(([x, y]) => [shape.length - 1 - y, x]));
    }
    return [type, rotations];
  }),
);

const ROTATION_OFFSETS = [
  [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0],
  [0, -1], [-1, -1], [1, -1], [0, -2],
];

function pieceCells({ type, rotation, x, y }) {
  return PIECE_ROTATIONS[type][rotation].map(([column, row]) => [x + column, y + row]);
}

function emptyRow() {
  return Array(BOARD_WIDTH).fill(null);
}

function shuffledBag() {
  const bag = Object.keys(PIECE_SHAPES);
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

class BlockGame {
  #bag = shuffledBag();

  constructor() {
    this.grid = Array.from({ length: BOARD_HEIGHT }, emptyRow);
    this.score = 0;
    this.lines = 0;
    this.#spawnPiece();
  }

  get isOver() {
    return this.activePiece === null;
  }

  get level() {
    return Math.floor(this.lines / LINES_PER_LEVEL) + 1;
  }

  get nextType() {
    return this.#bag.at(-1);
  }

  get landingPiece() {
    if (this.isOver) return null;

    const piece = { ...this.activePiece };
    do {
      piece.y += 1;
    } while (this.#fits(piece));
    piece.y -= 1;
    return piece;
  }

  move(dx) {
    return this.#tryMove(dx, 0);
  }

  rotate(direction) {
    if (this.isOver) return false;

    const piece = this.activePiece;
    const rotation = (piece.rotation + direction + 4) % 4;
    for (const [dx, dy] of ROTATION_OFFSETS) {
      const candidate = { ...piece, rotation, x: piece.x + dx, y: piece.y + dy };
      if (this.#fits(candidate)) {
        this.activePiece = candidate;
        return true;
      }
    }
    return false;
  }

  // Returns the number of lines cleared by this step.
  stepDown() {
    if (this.isOver || this.#tryMove(0, 1)) return 0;

    const { type } = this.activePiece;
    const cells = pieceCells(this.activePiece);
    if (cells.some(([, y]) => y < 0)) {
      this.activePiece = null;
      return 0;
    }

    for (const [x, y] of cells) {
      this.grid[y][x] = type;
    }

    const remainingRows = this.grid.filter(row => row.includes(null));
    const cleared = BOARD_HEIGHT - remainingRows.length;
    this.grid = [...Array.from({ length: cleared }, emptyRow), ...remainingRows];
    this.score += LINE_POINTS[cleared] * this.level;
    this.lines += cleared;
    this.#spawnPiece();
    return cleared;
  }

  hardDrop() {
    if (this.isOver) return 0;

    this.activePiece = this.landingPiece;
    return this.stepDown();
  }

  #spawnPiece() {
    const type = this.#bag.pop();
    if (this.#bag.length === 0) this.#bag = shuffledBag();
    const x = Math.floor((BOARD_WIDTH - PIECE_SHAPES[type].length) / 2);
    const piece = { type, rotation: 0, x, y: 0 };
    this.activePiece = this.#fits(piece) ? piece : null;
  }

  #tryMove(dx, dy) {
    if (this.isOver) return false;

    const piece = this.activePiece;
    const candidate = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!this.#fits(candidate)) return false;

    this.activePiece = candidate;
    return true;
  }

  #fits(piece) {
    return pieceCells(piece).every(([x, y]) =>
      x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT && (y < 0 || this.grid[y][x] === null)
    );
  }
}
