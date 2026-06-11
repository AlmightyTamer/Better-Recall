export type Grid = number[][];

const SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

function cloneGrid(g: Grid): Grid {
  return g.map((row) => [...row]);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Valid Sudoku transforms: row permutations within bands + global digit remap */
function transformSolution(): Grid {
  const g = cloneGrid(SOLUTION);

  for (let band = 0; band < 3; band++) {
    const rows = [band * 3, band * 3 + 1, band * 3 + 2];
    const order = shuffle(rows);
    const swapped = order.map((r) => [...g[r]]);
    rows.forEach((r, i) => {
      g[r] = swapped[i];
    });
  }

  const digitMap = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      g[r][c] = digitMap[g[r][c] - 1];
    }
  }

  return g;
}

export function dailyPuzzle(date = new Date()): { puzzle: Grid; solution: Grid } {
  void date;
  const solution = transformSolution();
  const puzzle = cloneGrid(solution);

  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => ({ r: Math.floor(i / 9), c: i % 9 }))
  );

  let removed = 0;
  const target = 42;
  for (const { r, c } of cells) {
    if (removed >= target) break;
    puzzle[r][c] = 0;
    removed++;
  }

  return { puzzle, solution };
}

export function computeErrors(grid: Grid): Set<string> {
  const err = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0 && !isValidPlacement(grid, r, c, grid[r][c])) {
        err.add(`${r}-${c}`);
      }
    }
  }
  return err;
}

export function isValidPlacement(grid: Grid, row: number, col: number, val: number): boolean {
  if (val === 0) return true;
  for (let c = 0; c < 9; c++) if (c !== col && grid[row][c] === val) return false;
  for (let r = 0; r < 9; r++) if (r !== row && grid[r][col] === val) return false;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return false;
    }
  }
  return true;
}

export function isComplete(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 || !isValidPlacement(grid, r, c, grid[r][c])) return false;
    }
  }
  return true;
}
