const GRID_SIZE = 9
const BOX_SIZE = 3
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function deepCloneGrid(grid) {
  return grid.map((row) => row.slice())
}

function assertGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    throw new Error('grid must be a 9x9 array')
  }
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== GRID_SIZE) {
      throw new Error('grid must be a 9x9 array')
    }
    for (const cell of row) {
      if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
        throw new Error('cell must be an integer in [0, 9]')
      }
    }
  }
}

function assertMove(move) {
  if (!move || typeof move !== 'object') {
    throw new Error('move must be an object')
  }
  const { row, col, value } = move
  if (!Number.isInteger(row) || row < 0 || row >= GRID_SIZE) {
    throw new Error('move.row must be in [0, 8]')
  }
  if (!Number.isInteger(col) || col < 0 || col >= GRID_SIZE) {
    throw new Error('move.col must be in [0, 8]')
  }
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    throw new Error('move.value must be in [0, 9]')
  }
}

function getSignature(grid) {
  return grid.flat().join('')
}

function printGrid(grid) {
  const horizontal = '------+-------+------'
  const lines = []
  for (let row = 0; row < GRID_SIZE; row += 1) {
    if (row > 0 && row % BOX_SIZE === 0) {
      lines.push(horizontal)
    }
    const rowText = []
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (col > 0 && col % BOX_SIZE === 0) {
        rowText.push('|')
      }
      rowText.push(grid[row][col] === 0 ? '.' : String(grid[row][col]))
    }
    lines.push(rowText.join(' '))
  }
  return lines.join('\n')
}

function checkUnit(values) {
  const seen = new Set()
  for (const value of values) {
    if (value === 0) {
      continue
    }
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
  }
  return true
}

function createSudokuInternal(initialGrid) {
  assertGrid(initialGrid)
  let grid = deepCloneGrid(initialGrid)

  function getGrid() {
    return deepCloneGrid(grid)
  }

  function guess(move) {
    assertMove(move)
    const { row, col, value } = move
    grid[row][col] = value
    return api
  }

  function getCandidates(row, col) {
    if (!Number.isInteger(row) || row < 0 || row >= GRID_SIZE) {
      throw new Error('row must be in [0, 8]')
    }
    if (!Number.isInteger(col) || col < 0 || col >= GRID_SIZE) {
      throw new Error('col must be in [0, 8]')
    }
    if (grid[row][col] !== 0) {
      return []
    }

    const blocked = new Set()

    for (let c = 0; c < GRID_SIZE; c += 1) {
      blocked.add(grid[row][c])
    }
    for (let r = 0; r < GRID_SIZE; r += 1) {
      blocked.add(grid[r][col])
    }

    const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE
    const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE
    for (let r = boxRowStart; r < boxRowStart + BOX_SIZE; r += 1) {
      for (let c = boxColStart; c < boxColStart + BOX_SIZE; c += 1) {
        blocked.add(grid[r][c])
      }
    }

    return DIGITS.filter((digit) => !blocked.has(digit))
  }

  function getNextHint() {
    let best = null
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (grid[row][col] !== 0) {
          continue
        }
        const candidates = getCandidates(row, col)
        if (candidates.length === 1) {
          return {
            row,
            col,
            candidates,
            value: candidates[0],
            reason: 'single-candidate',
          }
        }
        if (candidates.length > 0 && (!best || candidates.length < best.candidates.length)) {
          best = { row, col, candidates, value: null, reason: 'best-effort' }
        }
      }
    }
    return best
  }

  function hasConflict() {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      if (!checkUnit(grid[row])) {
        return true
      }
    }

    for (let col = 0; col < GRID_SIZE; col += 1) {
      const colValues = []
      for (let row = 0; row < GRID_SIZE; row += 1) {
        colValues.push(grid[row][col])
      }
      if (!checkUnit(colValues)) {
        return true
      }
    }

    for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
      for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
        const boxValues = []
        for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
          for (let col = boxCol; col < boxCol + BOX_SIZE; col += 1) {
            boxValues.push(grid[row][col])
          }
        }
        if (!checkUnit(boxValues)) {
          return true
        }
      }
    }

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (grid[row][col] === 0 && getCandidates(row, col).length === 0) {
          return true
        }
      }
    }
    return false
  }

  function isSolved() {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (grid[row][col] === 0) {
          return false
        }
      }
    }
    return !hasConflict()
  }

  function clone() {
    return createSudokuInternal(getGrid())
  }

  function toJSON() {
    return {
      grid: getGrid(),
    }
  }

  function toString() {
    return printGrid(grid)
  }

  const api = {
    getGrid,
    guess,
    clone,
    toJSON,
    toString,
    getCandidates,
    getCellCandidates: getCandidates,
    candidatesAt: getCandidates,
    getNextHint,
    getNextMoveHint: getNextHint,
    hasConflict,
    isSolved,
  }

  return api
}

export function createSudoku(grid) {
  return createSudokuInternal(grid)
}

export function createSudokuFromJSON(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('invalid sudoku json')
  }
  return createSudokuInternal(data.grid)
}

function createExploreSession(startSudoku) {
  const baseSudoku = startSudoku.clone()
  return {
    baseSudoku,
    sudoku: startSudoku.clone(),
    history: [],
    redo: [],
    failedSignatures: new Set(),
  }
}

export function createGame({ sudoku }, initialState = null) {
  if (!sudoku || typeof sudoku.getGrid !== 'function') {
    throw new Error('createGame requires a sudoku instance')
  }

  let currentSudoku = sudoku.clone()
  const undoStack = []
  const redoStack = []
  let explore = null

  if (initialState) {
    if (Array.isArray(initialState.undo)) {
      for (const item of initialState.undo) {
        undoStack.push(createSudokuFromJSON(item))
      }
    }
    if (Array.isArray(initialState.redo)) {
      for (const item of initialState.redo) {
        redoStack.push(createSudokuFromJSON(item))
      }
    }
    if (initialState.explore) {
      const nextExplore = {
        baseSudoku: createSudokuFromJSON(initialState.explore.baseSudoku),
        sudoku: createSudokuFromJSON(initialState.explore.sudoku),
        history: Array.isArray(initialState.explore.history)
          ? initialState.explore.history.map((item) => createSudokuFromJSON(item))
          : [],
        redo: Array.isArray(initialState.explore.redo)
          ? initialState.explore.redo.map((item) => createSudokuFromJSON(item))
          : [],
        failedSignatures: new Set(
          Array.isArray(initialState.explore.failedSignatures)
            ? initialState.explore.failedSignatures
            : [],
        ),
      }
      explore = nextExplore
    }
  }

  function current() {
    return explore ? explore.sudoku : currentSudoku
  }

  function rememberMain() {
    undoStack.push(currentSudoku.clone())
    redoStack.length = 0
  }

  function rememberExplore() {
    if (!explore) {
      return
    }
    explore.history.push(explore.sudoku.clone())
    explore.redo.length = 0
  }

  function updateExploreFailureMemory() {
    if (!explore) {
      return false
    }
    const hasFailure = explore.sudoku.hasConflict()
    if (hasFailure) {
      explore.failedSignatures.add(getSignature(explore.sudoku.getGrid()))
    }
    return hasFailure
  }

  function getSudoku() {
    return current().clone()
  }

  function guess(move) {
    if (explore) {
      rememberExplore()
      explore.sudoku.guess(move)
      updateExploreFailureMemory()
    } else {
      rememberMain()
      currentSudoku.guess(move)
    }
    return api
  }

  function canUndo() {
    return explore ? explore.history.length > 0 : undoStack.length > 0
  }

  function canRedo() {
    return explore ? explore.redo.length > 0 : redoStack.length > 0
  }

  function undo() {
    if (explore) {
      if (!canUndo()) {
        return false
      }
      explore.redo.push(explore.sudoku.clone())
      explore.sudoku = explore.history.pop()
      return true
    }

    if (!canUndo()) {
      return false
    }
    redoStack.push(currentSudoku.clone())
    currentSudoku = undoStack.pop()
    return true
  }

  function redo() {
    if (explore) {
      if (!canRedo()) {
        return false
      }
      explore.history.push(explore.sudoku.clone())
      explore.sudoku = explore.redo.pop()
      return true
    }

    if (!canRedo()) {
      return false
    }
    undoStack.push(currentSudoku.clone())
    currentSudoku = redoStack.pop()
    return true
  }

  function getHintCandidates(row, col) {
    return current().getCandidates(row, col)
  }

  function getNextHint() {
    return current().getNextHint()
  }

  function startExplore() {
    if (!explore) {
      explore = createExploreSession(currentSudoku)
      updateExploreFailureMemory()
    }
    return getExploreInfo()
  }

  function commitExplore() {
    if (!explore) {
      return false
    }
    rememberMain()
    currentSudoku = explore.sudoku.clone()
    explore = null
    return true
  }

  function abandonExplore() {
    if (!explore) {
      return false
    }
    explore = null
    return true
  }

  function resetExploreToStart() {
    if (!explore) {
      return false
    }
    explore.sudoku = explore.baseSudoku.clone()
    explore.history = []
    explore.redo = []
    return true
  }

  function getExploreInfo() {
    if (!explore) {
      return {
        active: false,
        knownFailed: false,
        currentFailed: false,
        failedCount: 0,
      }
    }
    const signature = getSignature(explore.sudoku.getGrid())
    return {
      active: true,
      knownFailed: explore.failedSignatures.has(signature),
      currentFailed: explore.sudoku.hasConflict(),
      failedCount: explore.failedSignatures.size,
    }
  }

  function hasConflict() {
    return current().hasConflict()
  }

  function toJSON() {
    return {
      sudoku: currentSudoku.toJSON(),
      undo: undoStack.map((item) => item.toJSON()),
      redo: redoStack.map((item) => item.toJSON()),
      explore: explore
        ? {
            baseSudoku: explore.baseSudoku.toJSON(),
            sudoku: explore.sudoku.toJSON(),
            history: explore.history.map((item) => item.toJSON()),
            redo: explore.redo.map((item) => item.toJSON()),
            failedSignatures: Array.from(explore.failedSignatures),
          }
        : null,
    }
  }

  const api = {
    getSudoku,
    guess,
    undo,
    redo,
    canUndo,
    canRedo,
    toJSON,
    // Hint
    getHintCandidates,
    getCandidates: getHintCandidates,
    getNextHint,
    // Explore mode
    startExplore,
    beginExplore: startExplore,
    enterExplore: startExplore,
    commitExplore,
    submitExplore: commitExplore,
    abandonExplore,
    discardExplore: abandonExplore,
    cancelExplore: abandonExplore,
    resetExploreToStart,
    rollbackExplore: resetExploreToStart,
    isExploring: () => Boolean(explore),
    getMode: () => (explore ? 'explore' : 'normal'),
    getExploreInfo,
    hasConflict,
  }

  return api
}

export function createGameFromJSON(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('invalid game json')
  }

  return createGame(
    {
      sudoku: createSudokuFromJSON(data.sudoku),
    },
    {
      undo: Array.isArray(data.undo) ? data.undo : [],
      redo: Array.isArray(data.redo) ? data.redo : [],
      explore: data.explore
        ? {
            baseSudoku: data.explore.baseSudoku || data.sudoku,
            sudoku: data.explore.sudoku || data.sudoku,
            history: Array.isArray(data.explore.history) ? data.explore.history : [],
            redo: Array.isArray(data.explore.redo) ? data.explore.redo : [],
            failedSignatures: Array.isArray(data.explore.failedSignatures)
              ? data.explore.failedSignatures
              : [],
          }
        : null,
    },
  )
}
