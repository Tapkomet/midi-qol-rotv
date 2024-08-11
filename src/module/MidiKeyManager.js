import { i18n } from "../midi-qol-rotv.js";
import { autoFastForwardAbilityRolls, configSettings } from "./settings.js";
import { isAutoFastAttack, isAutoFastDamage } from "./utils.js";
export class MidiKeyManager {
	resetKeyState() {
		this._adv = false;
		this._dis = false;
		this._vers = false;
		this._other = false;
		this._rollToggle = false;
		this._fastForward = false;
		this._fastForwardSet = false;
		this._critical = false;
	}
	constructor() {
		this._adv = false;
		this._dis = false;
		this._vers = false;
		this._rollToggle = false;
		this._other = false;
		this._fastForward = false;
		this._fastForwardSet = false;
		this._critical = false;
		this._noop = false;
		this._lastReturned = {
			advantage: undefined,
			disadvantage: undefined,
			versatile: undefined,
			other: undefined,
			rollToggle: undefined,
			fastForward: undefined,
			fastForwardSet: undefined,
			parts: undefined,
			chatMessage: undefined,
			critical: undefined,
			event: null,
			fastForwardAbility: undefined,
			fastForwardDamage: undefined,
			fastForwardAttack: undefined,
			autoRollAttack: undefined,
			autoRollDamage: undefined
		};
		this.resetKeyState();
	}
	getstate() {
		const state = {
			advantage: this._rollToggle ? false : this._adv,
			disadvantage: this._rollToggle ? false : this._dis,
			versatile: this._vers,
			other: this._other,
			rollToggle: this._rollToggle,
			fastForward: this._fastForward,
			fastForwardSet: this._fastForwardSet,
			fastForwardAbility: undefined,
			fastForwardDamage: undefined,
			fastForwardAttack: undefined,
			parts: undefined,
			chatMessage: undefined,
			critical: this._critical,
			autoRollAttack: undefined,
			autoRollDamage: false,
			event: {},
		};
		state.autoRollAttack = state.advantage || state.disadvantage || state.fastForwardAttack;
		return state;
	}
	get pressedKeys() {
		const returnValue = this.getstate();
		this._lastReturned = returnValue;
		//@ts-ignore
		return returnValue;
	}
	// Return keys pressed since last queried
	diffKeys() {
		const current = this.getstate();
		const returnValue = diffObject(this._lastReturned, current);
		this._lastReturned = current;
		return returnValue;
	}
	track(status) {
		//@ts-ignore
		if (CONFIG.debug.keybindings) {
			console.log("midi-qol-rotv | key pressed ", status);
		}
	}
	initKeyMappings() {
		const worldSettings = false; // configSettings.worldKeyMappings ?? false;
		//@ts-ignore
		const keybindings = game.keybindings;
		//@ts-ignore
		const normalPrecedence = CONST.KEYBINDING_PRECEDENCE.NORMAL;
		keybindings.register("midi-qol-rotv", "AdvantageRoll", {
			name: "ROTV.Advantage",
			hint: "midi-qol-rotv.KeysAdvantage.Hint",
			editable: [
				{ key: "AltLeft" },
				{ key: "AltRight" },
			],
			onDown: () => { this._adv = true; this.track("adv down"); return false; },
			onUp: () => { this._adv = false; this.track("adv up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "DisadvantageRoll", {
			name: "ROTV.Disadvantage",
			hint: "midi-qol-rotv.KeysDisadvantage.Hint",
			editable: [
				{ key: "ControlLeft" },
				{ key: "ControlRight" },
				{ key: "MetaLeft" },
				{ key: "MetaRight" }
			],
			onDown: () => { this._dis = true; this.track("dis down"); return false; },
			onUp: () => { this._dis = false; this.track("dis up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "noOptionalRules", {
			name: "midi-qol-rotv.NoOptionalRules.Name",
			hint: "midi-qol-rotv.NoOptionalRules.Hint",
			editable: [],
			onDown: () => { configSettings.toggleOptionalRules = true; this.track("no opt rules down"); return false; },
			onUp: () => { configSettings.toggleOptionalRules = false; this.track("no opt rules up"); return false; },
			restricted: true,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "Versatile", {
			name: i18n("ROTV.Versatile"),
			hint: "midi-qol-rotv.KeysVersatile.Hint",
			editable: [
				{ key: "KeyV" },
				{ key: "ShiftLeft" },
				{ key: "ShiftRight" }
			],
			onDown: () => { this._vers = true; this.track("versatile down"); return false; },
			onUp: () => { this._vers = false; this.track("versatile up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "rolOther", {
			name: i18n("ROTV.OtherFormula"),
			hint: "midi-qol-rotv.KeysOther.Hint",
			editable: [
				{ key: "KeyO" },
			],
			onDown: () => { this._other = true; this.track("roll other down"); return false; },
			onUp: () => { this._other = false; this.track("roll other up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "Critical", {
			name: i18n("ROTV.Critical"),
			hint: "midi-qol-rotv.KeysCritical.Hint",
			editable: [
				{ key: "KeyC" },
				{ key: "ControlLeft" },
				{ key: "ControlRight" },
				{ key: "MetaLeft" },
				{ key: "MetaRight" }
			],
			onDown: () => { this._critical = true; this.track("crit down"); return false; },
			onUp: () => { this._critical = false; this.track("crit up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "fastForward", {
			name: i18n("midi-qol-rotv.FastForward.Name"),
			hint: i18n("midi-qol-rotv.FastForward.Hint"),
			editable: [
				{ key: "KeyF" },
			],
			onDown: () => { this._fastForwardSet = true; this.track("roll ff down"); return false; },
			onUp: () => { this._fastForwardSet = false; this.track("roll ff up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		keybindings.register("midi-qol-rotv", "rollToggle", {
			name: i18n("midi-qol-rotv.RollToggle.Name"),
			hint: i18n("midi-qol-rotv.RollToggle.Hint"),
			editable: [
				{ key: "KeyT" },
				{ key: "ControlLeft", modifiers: ["Alt"] },
				{ key: "ControlRight", modifiers: ["Alt"] },
				{ key: "AltLeft", modifiers: ["Control"] },
				{ key: "AltRight", modifiers: ["Control"] }
			],
			onDown: () => { this._rollToggle = true; this.track("roll toggle down"); return false; },
			onUp: () => { this._rollToggle = false; this.track("roll toggle up"); return false; },
			restricted: worldSettings,
			precedence: normalPrecedence
		});
		Hooks.on('renderDialog', (dialog, html, data) => {
			//@ts-expect-error
			if (CONFIG.debug.keybindings)
				console.log("midi-qol-rotv | dialog rendered - releasing keys");
			//@ts-expect-error
			game.keyboard?.releaseKeys({ force: true });
		});
		Hooks.on('renderDialogV2', (dialog, html, data) => {
			//@ts-expect-error
			if (CONFIG.debug.keybindings)
				console.log("midi-qol-rotv | dialog v2 rendered - releasing keys");
			//@ts-expect-error
			game.keyboard?.releaseKeys({ force: true });
		});
	}
}
export function mapSpeedKeys(keys, type, forceToggle = false) {
	const pressedKeys = foundry.utils.deepClone(keys ?? globalThis.MidiKeyManager.pressedKeys);
	let hasToggle = pressedKeys.rollToggle || forceToggle;
	if (pressedKeys.rollToggle && forceToggle)
		hasToggle = false;
	switch (type) {
		case "ability":
			pressedKeys.fastForwardAbility = hasToggle ? !autoFastForwardAbilityRolls : autoFastForwardAbilityRolls;
			if (pressedKeys.fastForwardSet)
				pressedKeys.fastForwardAbility = true;
			if (pressedKeys.rollToggle) {
				pressedKeys.advantage = false;
				pressedKeys.disadvantage = false;
			}
			if (pressedKeys.advantage || pressedKeys.disadvantage)
				pressedKeys.fastForwardAbility = true;
			pressedKeys.fastForward = pressedKeys.fastForwardAbility;
			pressedKeys.critical = undefined;
			break;
		case "damage":
			pressedKeys.fastForwardDamage = (hasToggle ? !isAutoFastDamage() : isAutoFastDamage()) || pressedKeys.critical;
			if (pressedKeys.fastForwardSet)
				pressedKeys.fastForwardDamage = true;
			if (pressedKeys.fastForward)
				pressedKeys.fastForwardDamage = true;
			if (pressedKeys.critical)
				pressedKeys.autoRollDamage = true;
			pressedKeys.advantage = undefined;
			pressedKeys.disadvantage = undefined;
			break;
		case "attack":
		default:
			pressedKeys.critical = undefined;
			pressedKeys.fastForwardAttack = (hasToggle ? !isAutoFastAttack() : isAutoFastAttack()) || pressedKeys.advantage || pressedKeys.disadvantage;
			if (pressedKeys.fastForwardSet)
				pressedKeys.fastForwardAttack = true;
			pressedKeys.fastForward = pressedKeys.fastForwardAttack;
			pressedKeys.critical = false;
			pressedKeys.fastForwardDamage = hasToggle ? !isAutoFastDamage() : isAutoFastDamage();
			if (pressedKeys.advantage || pressedKeys.disadvantage)
				pressedKeys.autoRollAttack = true;
			if (pressedKeys.advantage && pressedKeys.disadvantage) {
				pressedKeys.advantage = false;
				pressedKeys.disadvantage = false;
			}
			break;
	}
	return pressedKeys;
}
