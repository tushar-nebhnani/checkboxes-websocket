import { CHECKBOX_COUNT } from "../constants.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { Database } from "./db.js";

export class CheckboxesRepository {
  static async loadAll() {
    try {
      const { rows } = await Database.query("SELECT idx, checked FROM checkboxes");
      const state = new Array(CHECKBOX_COUNT).fill(false);
      for (const row of rows) {
        if (Number.isInteger(row.idx) && row.idx >= 0 && row.idx < CHECKBOX_COUNT) {
          state[row.idx] = Boolean(row.checked);
        }
      }
      return state;
    } catch (err) {
      ErrorHandler.log("CheckboxesRepository.loadAll", err);
      throw err;
    }
  }

  static async setChecked(idx, checked) {
    try {
      await Database.query(
        `INSERT INTO checkboxes (idx, checked, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (idx) DO UPDATE SET checked = EXCLUDED.checked, updated_at = now()`,
        [idx, checked],
      );
    } catch (err) {
      ErrorHandler.log("CheckboxesRepository.setChecked", err);
      throw err;
    }
  }

  static async isComplete() {
    try {
      const { rows } = await Database.query(
        "SELECT count(*) AS total, count(*) FILTER (WHERE NOT checked) AS unchecked FROM checkboxes",
      );
      const total = Number(rows[0].total);
      const unchecked = Number(rows[0].unchecked);
      return total >= CHECKBOX_COUNT && unchecked === 0;
    } catch (err) {
      ErrorHandler.log("CheckboxesRepository.isComplete", err);
      throw err;
    }
  }

  static async resetAll() {
    try {
      await Database.query("UPDATE checkboxes SET checked = false, updated_at = now()");
    } catch (err) {
      ErrorHandler.log("CheckboxesRepository.resetAll", err);
      throw err;
    }
  }
}
