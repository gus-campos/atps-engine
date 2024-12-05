import { expect, beforeEach, describe, it } from "vitest";
import { GgAction, GgState, GobbletGobblers } from "../src/GobbletGobblers";

describe("GobbletGobblers", () => {

  let gg: GobbletGobblers;
  let initialState: GgState;
  let state: GgState;
  beforeEach(() => {
    gg = new GobbletGobblers();
    initialState = gg.getInitialState();
  });

  describe("getInitialState", () => {

    it("should return a state that have 9x3 dimensions", () => {
  
      expect(initialState.board.slots).toHaveLength(9);
      expect(gg.getInitialState().board.slots.every(cell => cell.length == 3)).toBeTruthy();
    });
  
    it("should resturn a state filled with null", () => {
      
      for (const slot of initialState.board.slots)
        for (const piece of slot)
          expect(piece).toBe(null);
    });
  });

  describe("getNextState", ()=> {

    it("should return a state with the piece placed in the specified slot", ()=>{
    
      let slot = 0;
      let piece = { 
        author: 0,
        size: 0
      };

      let action: GgAction = {
        slot: slot,
        movedFrom: null, 
        piece: piece
      };

      state = gg.getNextState(initialState, action);
      let slots = state.board.slots;

      for (let i=0; i<slots.length; i++) 
        for (let j=0; j<slots[i].length; j++) 
          expect(slots[i][j]).toEqual(i==slot && j==piece.size ? piece : null);
    });

    it("should alternate current and last player between 0 and 1", ()=> {
      
      expect(initialState.currentPlayer).toBe(0);
      expect(initialState.lastPlayer).toBe(1);
      
      let action: GgAction = { slot: 0, movedFrom: null, piece: { author: initialState.currentPlayer, size: 2 } }
      state = gg.getNextState(initialState, action);
      expect(state.lastPlayer).toBe(0);
      expect(state.currentPlayer).toBe(1);
      
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: state.currentPlayer, size: 1 } });
      expect(state.lastPlayer).toBe(1);
      expect(state.currentPlayer).toBe(0);
    });

    it("should update stock properly", ()=>{

      state = initialState;

      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 1, size: 1 } });
      
      state = gg.getNextState(state, { slot: 3, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 0, size: 0 } });
      state = gg.getNextState(state, { slot: 5, movedFrom: null, piece: { author: 0, size: 0 } });
      
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 7, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 0, size: 2 } });

      expect(state.stock).toEqual([[0,0,1],[2,0,0]]);

    });
  });

  describe("getPlayerName", ()=> {

    it("should return proper names", ()=>{

      expect(gg.getPlayerName(0)).toBe("X");
      expect(gg.getPlayerName(1)).toBe("O");

      // Default
      expect(gg.getPlayerName(-133)).toBe("");
    });
  });

  describe("getPieceAuthorName", ()=> {

    it("should return proper names", ()=>{

      expect(gg.getPieceAuthorName({ author: 0, size: 2 })).toBe("X");
      expect(gg.getPieceAuthorName({ author: 1, size: 1 })).toBe("O");
      expect(gg.getPieceAuthorName(null)).toBe(".");

    });
  });

  describe("checkWin", ()=>{

    it("should return false for initial state", ()=>{
      expect(gg.checkWin(initialState)).toBeFalsy();
    });

    it("should return true for won game, and won games only, ", ()=>{
      
      state = initialState;
      
      // Fazendo fileira diagonal principal
      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 0, size: 2 } });
      expect(gg.checkWin(state)).toBeFalsy();
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 0, size: 1 } });
      expect(gg.checkWin(state)).toBeFalsy();
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 0, size: 0 } });
      expect(gg.checkWin(state)).toBeTruthy();
      
      // Cobrindo peça do meio com peça do adversário
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 1, size: 2 } });
      expect(gg.checkWin(state)).toBeFalsy();
      
      
      // Virando o jogo, ao preencher coluna do meio
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 1, size: 0 } });
      expect(gg.checkWin(state)).toBeFalsy();
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 1, size: 1 } });
      expect(gg.checkWin(state)).toBeTruthy();
    });
  });

  describe("getNextPlayer", ()=>{

    it("should alternate between player 0 and 1", ()=>{

      expect(gg.getNextPlayer(0)).toBe(1);
      expect(gg.getNextPlayer(1)).toBe(0);
    });
  });

  describe("getValidActions", () => {

    let actions: GgAction[];

    it("should return only actions with pieces, from stock, of available sizes only", () => {

      state = initialState;

      for (let size=0; size<3; size++)
        state.stock[0][1] = Math.floor(Math.random()*2);

      let actions: GgAction[] = gg.getValidActions(state);

      let stockActionsSizes = actions.filter(action => action.movedFrom == null).map(action => action.piece.size);

      for (let size of stockActionsSizes)
        expect(state.stock[0][size]).toBeGreaterThan(0);
    });

    it("should return only actions with pieces of the current player", () => {

      state = initialState;

      // Random stocks
      for (let size=0; size<3; size++)
        state.stock[0][1] = Math.floor(Math.random()*2);

      actions = gg.getValidActions(state);
      let stockActionsPlayers = actions.filter(action => action.movedFrom == null).map(action => action.piece.author);

      for (let player of stockActionsPlayers)
        expect(player).toBe(state.currentPlayer);
    });

    it("should return actions taht plays only in possible slots", () => {

      state = initialState;

      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 1, size: 1 } });
      
      state = gg.getNextState(state, { slot: 3, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 5, movedFrom: null, piece: { author: 0, size: 1 } });
      
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 7, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 0, size: 2 } });

      state.currentPlayer = 0;
      state.stock[0] = [2,2,2];
      actions = gg.getValidActions(state);

      let stockActionsSlots = actions.filter(action => action.movedFrom == null).map(action => action.slot);
      stockActionsSlots = [...new Set(stockActionsSlots)];
      stockActionsSlots.sort();

      expect(stockActionsSlots).toEqual([2,3,4,5,6,7]);
    });

    it("should return none move actions to a empty board", () => {

      state = initialState;
      actions = gg.getValidActions(state);
      expect(actions.filter(action => action.movedFrom != null)).toEqual([]);
    });

    it("should return none move actions to a board filled with opponent pieces", () => {

      state = initialState;

      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: 1, size: 2 } });
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 1, size: 1 } });
      
      state = gg.getNextState(state, { slot: 3, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 5, movedFrom: null, piece: { author: 1, size: 1 } });
      
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 7, movedFrom: null, piece: { author: 1, size: 1 } });
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 1, size: 2 } });

      state.currentPlayer = 0;
      actions = gg.getValidActions(state);

      actions = gg.getValidActions(state);
      expect(actions.filter(action => action.movedFrom != null)).toEqual([]);
    });

    it("should return none move actions to a board filled current player large pieces", () => {

      state = initialState;

      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 0, size: 2 } });
      
      state = gg.getNextState(state, { slot: 3, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 5, movedFrom: null, piece: { author: 0, size: 2 } });
      
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 7, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 0, size: 2 } });

      state.currentPlayer = 0;
      actions = gg.getValidActions(state);

      actions = gg.getValidActions(state);
      expect(actions.filter(action => action.movedFrom != null)).toEqual([]);
    });

    it("should return actions with the only possible slot to move, to the given example", () => {

      state = initialState;

      state = gg.getNextState(state, { slot: 0, movedFrom: null, piece: { author: 0, size: 1 } });
      state = gg.getNextState(state, { slot: 1, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 2, movedFrom: null, piece: { author: 0, size: 2 } });
      
      state = gg.getNextState(state, { slot: 3, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 4, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 5, movedFrom: null, piece: { author: 0, size: 2 } });
      
      state = gg.getNextState(state, { slot: 6, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 7, movedFrom: null, piece: { author: 0, size: 2 } });
      state = gg.getNextState(state, { slot: 8, movedFrom: null, piece: { author: 0, size: 2 } });

      state.currentPlayer = 0;
      actions = gg.getValidActions(state);

      actions = gg.getValidActions(state);
      expect(actions.filter(action => action.movedFrom != null)).toHaveLength(8);

      let slots = actions.map(action => action.slot);
      slots = [...new Set(slots)];
      expect(slots).toHaveLength(1);
      expect(slots).toContain(0);
    });
  });
});
