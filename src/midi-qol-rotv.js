import { registerSettings, fetchParams, configSettings, checkRule, enableWorkflow, midiSoundSettings, fetchSoundSettings, midiSoundSettingsBackup, disableWorkflowAutomation } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { checkModules, installedModules, setupModules } from './module/setupModules.js';
import { itemPatching, visionPatching, actorAbilityRollPatching, patchLMRTFY, readyPatching, initPatching, addDiceTermModifiers } from './module/patching.js';
import { initHooks, overTimeJSONData, readyHooks, setupHooks } from './module/Hooks.js';
import { initGMActionSetup, setupSocket, socketlibSocket } from './module/GMAction.js';
import { setupSheetQol } from './module/sheetQOL.js';
import { TrapWorkflow, DamageOnlyWorkflow, Workflow, DummyWorkflow } from './module/workflow.js';
import { addConcentration, applyTokenDamage, canSense, checkNearby, checkRange, completeItemRoll, completeItemUse, computeCoverBonus, doConcentrationCheck, doOverTimeEffect, findNearby, getChanges, getConcentrationEffect, getDistanceSimple, getDistanceSimpleOld, getSystemCONFIG, getTraitMult, midiRenderRoll, MQfromActorUuid, MQfromUuid, reportMidiCriticalFlags, tokenForActor } from './module/utils.js';
import { ConfigPanel } from './module/apps/ConfigPanel.js';
import { showItemInfo, templateTokens } from './module/itemhandling.js';
import { RollStats } from './module/RollStats.js';
import { OnUseMacroOptions } from './module/apps/Item.js';
import { MidiKeyManager } from './module/MidiKeyManager.js';
import { MidiSounds } from './module/midi-sounds.js';
export let debugEnabled = 0;
export let debugCallTiming = false;
// 0 = none, warnings = 1, debug = 2, all = 3
export let debug = (...args) => { if (debugEnabled > 1)
	console.log("DEBUG: midi-qol-rotv | ", ...args); };
export let log = (...args) => console.log("midi-qol-rotv | ", ...args);
export let warn = (...args) => { if (debugEnabled > 0)
	console.warn("midi-qol-rotv | ", ...args); };
export let error = (...args) => console.error("midi-qol-rotv | ", ...args);
export let timelog = (...args) => warn("midi-qol-rotv | ", Date.now(), ...args);
export function getCanvas() {
	if (!canvas || !canvas.scene) {
		error("Canvas/Scene not ready - roll automation will not function");
		return undefined;
	}
	return canvas;
}
export let i18n = key => {
	return game.i18n.localize(key);
};
export let i18nFormat = (key, data = {}) => {
	return game.i18n.format(key, data);
};
export function geti18nOptions(key) {
	const translations = game.i18n.translations["midi-qol-rotv"] ?? {};
	//@ts-ignore _fallback not accessible
	let translation = translations[key] ?? game.i18n._fallback["midi-qol-rotv"][key];
	return translation ?? {};
}
export function geti18nTranslations() {
	let translations = game.i18n.translations["midi-qol-rotv"];
	//@ts-ignore _fallback not accessible
	if (!translations)
		translations = game.i18n._fallback["midi-qol-rotv"];
	return translations ?? {};
}
export let setDebugLevel = (debugText) => {
	debugEnabled = { "none": 0, "warn": 1, "debug": 2, "all": 3 }[debugText] || 0;
	// 0 = none, warnings = 1, debug = 2, all = 3
	if (debugEnabled >= 3)
		CONFIG.debug.hooks = true;
	debugCallTiming = game.settings.get("midi-qol-rotv", "debugCallTiming") ?? false;
};
export let noDamageSaves = [];
export let undoDamageText;
export let savingThrowText;
export let savingThrowTextAlt;
export let MQdefaultDamageType;
export let midiFlags = [];
export let allAttackTypes = [];
export let gameStats;
export let overTimeEffectsToDelete = {};
export let failedSaveOverTimeEffectsToDelete = {};
export let MQItemMacroLabel;
export let MQDeferMacroLabel;
export let MQOnUseOptions;
export const MESSAGETYPES = {
	HITS: 1,
	SAVES: 2,
	ATTACK: 3,
	DAMAGE: 4,
	ITEM: 0
};
export let cleanSpellName = (name) => {
	// const regex = /[^가-힣一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤]/g
	const regex = /[^가-힣一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９а-яА-Я々〆〤]/g;
	return name.toLowerCase().replace(regex, '').replace("'", '').replace(/ /g, '');
};
/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once("levelsReady", function () {
	//@ts-ignore
	installedModules.set("levels", CONFIG.Levels.API);
});
Hooks.once('init', async function () {
	console.log('midi-qol-rotv | Initializing midi-qol-rotv');
	allAttackTypes = ["rwak", "mwak", "rsak", "msak"];
	if (game.system.id === "sw5e")
		allAttackTypes = ["rwak", "mwak", "rpak", "mpak"];
	initHooks();
	// Assign custom classes and constants here
	// Register custom module settings
	registerSettings();
	fetchParams();
	fetchSoundSettings();
	// Preload Handlebars templates
	preloadTemplates();
	// Register custom sheets (if any)
	initPatching();
	addDiceTermModifiers();
	globalThis.MidiKeyManager = new MidiKeyManager();
	globalThis.MidiKeyManager.initKeyMappings();
});
/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	// Do anything after initialization but before
	// ready
	setupSocket();
	fetchParams();
	fetchSoundSettings();
	itemPatching();
	visionPatching();
	setupModules();
	registerSettings();
	initGMActionSetup();
	patchLMRTFY();
	setupMidiFlags();
	setupHooks();
	undoDamageText = i18n("midi-qol-rotv.undoDamageFrom");
	savingThrowText = i18n("midi-qol-rotv.savingThrowText");
	savingThrowTextAlt = i18n("midi-qol-rotv.savingThrowTextAlt");
	MQdefaultDamageType = i18n("midi-qol-rotv.defaultDamageType");
	MQItemMacroLabel = i18n("midi-qol-rotv.ItemMacroText");
	if (MQItemMacroLabel === "midi-qol-rotv.ItemMacroText")
		MQItemMacroLabel = "ItemMacro";
	MQDeferMacroLabel = i18n("midi-qol-rotv.DeferText");
	if (MQDeferMacroLabel === "midi-qol-rotv.DeferText")
		MQDeferMacroLabel = "[Defer]";
	let config = getSystemCONFIG();
	if (game.system.id === "rotv" || game.system.id === "n5e") {
		config.midiProperties = {};
		// Add additonal vision types? How to modify token properties doing this.
		config.midiProperties["nodam"] = i18n("midi-qol-rotv.noDamageSaveProp");
		config.midiProperties["fulldam"] = i18n("midi-qol-rotv.fullDamageSaveProp");
		config.midiProperties["halfdam"] = i18n("midi-qol-rotv.halfDamageSaveProp");
		config.midiProperties["autoFailFriendly"] = i18n("midi-qol-rotv.FailFriendly");
		config.midiProperties["autoSaveFriendly"] = i18n("midi-qol-rotv.SaveFriendly");
		config.midiProperties["rollOther"] = i18n("midi-qol-rotv.rollOtherProp");
		config.midiProperties["critOther"] = i18n("midi-qol-rotv.otherCritProp");
		config.midiProperties["offHandWeapon"] = i18n("midi-qol-rotv.OffHandWeapon");
		config.midiProperties["magicdam"] = i18n("midi-qol-rotv.magicalDamageProp");
		config.midiProperties["magiceffect"] = i18n("midi-qol-rotv.magicalEffectProp");
		config.midiProperties["concentration"] = i18n("midi-qol-rotv.concentrationEffectProp");
		config.midiProperties["toggleEffect"] = i18n("midi-qol-rotv.toggleEffectProp");
		config.midiProperties["ignoreTotalCover"] = i18n("midi-qol-rotv.ignoreTotalCover");
		config.damageTypes["midi-none"] = i18n("midi-qol-rotv.midi-none");
		// sliver, adamant, spell, nonmagic, magic are all deprecated and should only appear as custom
		config.damageResistanceTypes["silver"] = i18n("midi-qol-rotv.NonSilverPhysical");
		config.damageResistanceTypes["adamant"] = i18n("midi-qol-rotv.NonAdamantinePhysical");
		config.damageResistanceTypes["spell"] = i18n("midi-qol-rotv.spell-damage");
		config.damageResistanceTypes["nonmagic"] = i18n("midi-qol-rotv.NonMagical");
		config.damageResistanceTypes["magic"] = i18n("midi-qol-rotv.Magical");
		config.damageResistanceTypes["healing"] = config.healingTypes.healing;
		config.damageResistanceTypes["temphp"] = config.healingTypes.temphp;
		config.damageResistanceTypes["healing"] = config.healingTypes.healing;
		config.damageResistanceTypes["temphp"] = config.healingTypes.temphp;
		//@ts-expect-error
		if (isNewerVersion(game.system.version, "2.0.3")) {
			//@ts-expect-error
			game.system.config.traits.di.configKey = "damageResistanceTypes";
			//@ts-expect-error
			game.system.config.traits.dr.configKey = "damageResistanceTypes";
			//@ts-expect-error
			game.system.config.traits.dv.configKey = "damageResistanceTypes";
		}
		config.abilityActivationTypes["reactiondamage"] = `${i18n("ROTV.Reaction")} ${i18n("midi-qol-rotv.reactionDamaged")}`;
		config.abilityActivationTypes["reactionmanual"] = `${i18n("ROTV.Reaction")} ${i18n("midi-qol-rotv.reactionManual")}`;
	}
	else { // sw5e
		config.midiProperties = {};
		config.midiProperties["nodam"] = i18n("midi-qol-rotv.noDamageSaveProp");
		config.midiProperties["fulldam"] = i18n("midi-qol-rotv.fullDamageSaveProp");
		config.midiProperties["halfdam"] = i18n("midi-qol-rotv.halfDamageSaveProp");
		config.midiProperties["rollOther"] = i18n("midi-qol-rotv.rollOtherProp");
		config.midiProperties["critOther"] = i18n("midi-qol-rotv.otherCritProp");
		config.midiProperties["concentration"] = i18n("midi-qol-rotv.concentrationActivationCondition");
		config.damageTypes["midi-none"] = i18n("midi-qol-rotv.midi-none");
		config.abilityActivationTypes["reactiondamage"] = `${i18n("ROTV.Reaction")} ${i18n("midi-qol-rotv.reactionDamaged")}`;
		config.abilityActivationTypes["reactionmanual"] = `${i18n("ROTV.Reaction")} ${i18n("midi-qol-rotv.reactionManual")}`;
	}
	if (configSettings.allowUseMacro) {
		config.characterFlags["DamageBonusMacro"] = {
			hint: i18n("midi-qol-rotv.DamageMacro.Hint"),
			name: i18n("midi-qol-rotv.DamageMacro.Name"),
			placeholder: "",
			section: i18n("midi-qol-rotv.DAEMidiQOL"),
			type: String
		};
	}
	;
	setupSheetQol();
});
/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	const exclusionMacro = game.macros?.getName("Warning Exclusions for Midi");
	if (exclusionMacro)
		exclusionMacro?.execute();
	gameStats = new RollStats();
	actorAbilityRollPatching();
	// has to be done before setup api.
	MQOnUseOptions = i18n("midi-qol-rotv.onUseMacroOptions");
	if (typeof MQOnUseOptions === "string")
		MQOnUseOptions = {
			"preTargeting": "Called before targeting is resolved (*)",
			"preItemRoll": "Called before the item is rolled (*)",
			"templatePlaced": "Only called once a template is placed",
			"preambleComplete": "After targeting complete",
			"preAttackRoll": "Before Attack Roll",
			"preCheckHits": "Before Check Hits",
			"postAttackRoll": "After Attack Roll",
			"preSave": "Before Save",
			"postSave": "After Save",
			"preDamageRoll": "Before Damage Roll",
			"postDamageRoll": "After Damage Roll",
			"damageBonus": "return a damage bonus",
			"preDamageApplication": "Before Damage Application",
			"preActiveEffects": "Before Active Effects",
			"postActiveEffects": "After Active Effects ",
			"all": "All"
		};
	OnUseMacroOptions.setOptions(MQOnUseOptions);
	MidiSounds.midiSoundsReadyHooks();
	if (game.system.id === "rotv") {
		getSystemCONFIG().characterFlags["spellSniper"] = {
			name: "Spell Sniper",
			hint: "Spell Sniper",
			section: i18n("ROTV.Feats"),
			type: Boolean
		};
	}
	setupMidiQOLApi();
	if (game.user?.isGM) {
		if (installedModules.get("levelsautocover") && configSettings.optionalRules.coverCalculation === "levelsautocover" && !game.settings.get("levelsautocover", "apiMode")) {
			game.settings.set("levelsautocover", "apiMode", true);
			if (game.user?.isGM)
				ui.notifications?.warn("midi-qol-rotv | setting levels auto cover to api mode", { permanent: true });
		}
		else if (installedModules.get("levelsautocover") && configSettings.optionalRules.coverCalculation !== "levelsautocover" && game.settings.get("levelsautocover", "apiMode")) {
			ui.notifications?.warn("midi-qol-rotv | Levels Auto Cover is in API mode but midi is not using levels auto cover - you may wish to disable api mode", { permanent: true });
		}
	}
	if (game.settings.get("midi-qol-rotv", "splashWarnings") && game.user?.isGM) {
		if (game.user?.isGM && !installedModules.get("dae")) {
			ui.notifications?.warn("Midi-qol requires DAE to be installed and at least version 10.0.9 or many automation effects won't work");
		}
		if (game.user?.isGM && game.modules.get("betterrolls5e")?.active && !installedModules.get("betterrolls5e")) {
			ui.notifications?.warn("Midi QOL requires better rolls to be version 1.6.6 or later");
		}
	}
	//@ts-ignore game.version
	if (isNewerVersion(game.version ? game.version : game.version, "0.8.9")) {
		const noDamageSavesText = i18n("midi-qol-rotv.noDamageonSaveSpellsv9");
		noDamageSaves = noDamageSavesText.split(",")?.map(s => s.trim()).map(s => cleanSpellName(s));
	}
	else {
		//@ts-ignore
		noDamageSaves = i18n("midi-qol-rotv.noDamageonSaveSpells")?.map(name => cleanSpellName(name));
	}
	checkModules();
	checkConcentrationSettings();
	readyHooks();
	readyPatching();
	if (midiSoundSettingsBackup)
		game.settings.set("midi-qol-rotv", "MidiSoundSettings-backup", midiSoundSettingsBackup);
	// Make midi-qol-rotv targets hoverable
	$(document).on("mouseover", ".midi-qol-rotv-target-name", (e) => {
		const tokenid = e.currentTarget.id;
		const tokenObj = canvas?.tokens?.get(tokenid);
		if (!tokenObj)
			return;
		//@ts-ignore
		tokenObj._hover = true;
	});
	// This seems to cause problems for localisation for the items compendium (at least for french)
	// Try a delay before doing this - hopefully allowing localisation to complete
	setTimeout(MidiSounds.getWeaponBaseTypes, 5000);
	if (installedModules.get("betterrolls5e")) {
		//@ts-ignore console:
		ui.notifications?.error("midi-qol-rotv automation disabled", { permanent: true, console: true });
		//@ts-ignore console:
		ui.notifications?.error("Please make sure betterrolls5e is disabled", { permanent: true, console: true });
		//@ts-ignore console:
		ui.notifications?.error("Until further notice better rolls is NOT compatible with midi-qol-rotv", { permanent: true, console: true });
		disableWorkflowAutomation();
		setTimeout(disableWorkflowAutomation, 2000);
	}
	Hooks.callAll("midi-qol-rotv.midiReady");
});
import { setupMidiTests } from './module/tests/setupTest.js';
Hooks.once("midi-qol-rotv.midiReady", () => {
	setupMidiTests();
});
// Add any additional hooks if necessary
// Backwards compatability
function setupMidiQOLApi() {
	//@ts-ignore
	window.MinorQOL = {
		doRoll: () => { console.error("MinorQOL is no longer supported please use MidiQOL.doRoll"); },
		applyTokenDamage: () => { console.error("MinorQOL is no longer supported please use MidiQOL.applyTokenDamage"); },
	};
	//@ts-ignore
	globalThis.MidiQOL = {
		addConcentration,
		applyTokenDamage,
		canSense,
		checkNearby,
		checkRange,
		checkRule: checkRule,
		completeItemRoll,
		completeItemUse,
		ConfigPanel,
		configSettings: () => { return configSettings; },
		DamageOnlyWorkflow,
		debug,
		doConcentrationCheck,
		doOverTimeEffect,
		DummyWorkflow,
		enableWorkflow,
		findNearby,
		gameStats,
		getChanges,
		getConcentrationEffect,
		getDistance: getDistanceSimpleOld,
		computeDistance: getDistanceSimple,
		computeCoverBonus,
		getTraitMult: getTraitMult,
		log,
		midiFlags,
		midiRenderRoll,
		midiSoundSettings: () => { return midiSoundSettings; },
		MQfromActorUuid,
		MQfromUuid,
		MQFromUuid: MQfromUuid,
		MQOnUseOptions,
		overTimeJSONData,
		reportMidiCriticalFlags: reportMidiCriticalFlags,
		selectTargetsForTemplate: templateTokens,
		showItemInfo,
		socket: () => { return socketlibSocket; },
		tokenForActor,
		TrapWorkflow,
		warn,
		Workflow,
	};
	globalThis.MidiQOL.actionQueue = new Semaphore();
}
export function checkConcentrationSettings() {
	const needToUpdateCubSettings = installedModules.get("combat-utility-belt") && (game.settings.get("combat-utility-belt", "enableConcentrator"));
	if (game.user?.isGM && configSettings.concentrationAutomation && needToUpdateCubSettings) {
		let d = new Dialog({
			// localize this text
			title: i18n("dae.confirm"),
			content: `<p>You have enabled midi-qol-rotv concentration automation.</p><p>This requires Combat Utility Belt Concentration to be disabled.</p><p>Choose which concentration automation to disable</p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-cross"></i>',
					label: "Disable CUB",
					callback: () => {
						game.settings.set("combat-utility-belt", "enableConcentrator", false);
					}
				},
				two: {
					icon: '<i class="fas fa-cross"></i>',
					label: "Disable Midi",
					callback: () => {
						configSettings.concentrationAutomation = false;
						game.settings.set("midi-qol-rotv", "ConfigSettings", configSettings);
					}
				}
			},
			default: "one"
		});
		d.render(true);
	}
}
// Minor-qol compatibility patching
function doRoll(event = { shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, type: "none" }, itemName, options = { type: "", versatile: false }) {
	error("doRoll is deprecated and will be removed");
	const speaker = ChatMessage.getSpeaker();
	var actor;
	if (speaker.token) {
		const token = canvas?.tokens?.get(speaker.token);
		actor = token?.actor;
	}
	else {
		actor = game.actors?.get(speaker.actor ?? "");
	}
	if (!actor) {
		if (debugEnabled > 0)
			warn("No actor found for ", speaker);
		return;
	}
	let pEvent = {
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		altKey: event.altKey,
		metaKey: event.metaKey,
		type: (event?.type === "contextmenu") || options.versatile ? "contextmenu" : ""
	};
	let item = actor?.items?.get(itemName); // see if we got an itemId
	if (!item)
		item = actor?.items?.find(i => i.name === itemName && (!options.type || i.type === options.type));
	if (item) {
		return item.roll({ event: pEvent });
	}
	else {
		ui.notifications?.warn(game.i18n.format("ROTV.ActionWarningNoItem", { item: itemName, name: actor.name }));
	}
}
function setupMidiFlags() {
	let config = getSystemCONFIG();
	midiFlags.push("system.test.this");
	midiFlags.push("flags.midi-qol-rotv.advantage.all");
	midiFlags.push("flags.midi-qol-rotv.disadvantage.all");
	midiFlags.push("flags.midi-qol-rotv.advantage.attack.all");
	midiFlags.push("flags.midi-qol-rotv.disadvantage.attack.all");
	midiFlags.push("flags.midi-qol-rotv.critical.all");
	midiFlags.push(`flags.midi-qol-rotv.max.damage.all`);
	midiFlags.push(`flags.midi-qol-rotv.min.damage.all`);
	midiFlags.push("flags.midi-qol-rotv.noCritical.all");
	midiFlags.push("flags.midi-qol-rotv.fail.all");
	midiFlags.push("flags.midi-qol-rotv.fail.attack.all");
	midiFlags.push(`flags.midi-qol-rotv.grants.advantage.attack.all`);
	midiFlags.push(`flags.midi-qol-rotv.grants.disadvantage.attack.all`);
	// TODO work out how to do grants damage.max
	midiFlags.push(`flags.midi-qol-rotv.grants.attack.success.all`);
	midiFlags.push(`flags.midi-qol-rotv.grants.attack.bonus.all`);
	midiFlags.push(`flags.midi-qol-rotv.grants.critical.all`);
	midiFlags.push(`flags.midi-qol-rotv.grants.critical.range`);
	midiFlags.push('flags.midi-qol-rotv.grants.criticalThreshold');
	midiFlags.push(`flags.midi-qol-rotv.fail.critical.all`);
	midiFlags.push(`flags.midi-qol-rotv.advantage.concentration`);
	midiFlags.push(`flags.midi-qol-rotv.disadvantage.concentration`);
	midiFlags.push("flags.midi-qol-rotv.ignoreNearbyFoes");
	midiFlags.push("flags.midi-qol-rotv.");
	midiFlags.push(`flags.midi-qol-rotv.concentrationSaveBonus`);
	midiFlags.push(`flags.midi-qol-rotv.potentCantrip`);
	midiFlags.push(`flags.midi-qol-rotv.sculptSpells`);
	midiFlags.push(`flags.midi-qol-rotv.carefulSpells`);
	midiFlags.push("flags.midi-qol-rotv.magicResistance.all");
	midiFlags.push("flags.midi-qol-rotv.magicVulnerability.all");
	let attackTypes = allAttackTypes.concat(["heal", "other", "save", "util"]);
	attackTypes.forEach(at => {
		midiFlags.push(`flags.midi-qol-rotv.advantage.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.disadvantage.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.fail.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.critical.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.noCritical.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.grants.advantage.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.grants.disadvantage.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.grants.critical.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.fail.critical.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.grants.attack.bonus.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.grants.attack.success.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.DR.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.max.damage.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.min.damage.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.optional.NAME.attack.${at}`);
		midiFlags.push(`flags.midi-qol-rotv.optional.NAME.damage.${at}`);
	});
	midiFlags.push("flags.midi-qol-rotv.advantage.ability.all");
	midiFlags.push("flags.midi-qol-rotv.advantage.ability.check.all");
	midiFlags.push("flags.midi-qol-rotv.advantage.ability.save.all");
	midiFlags.push("flags.midi-qol-rotv.disadvantage.ability.all");
	midiFlags.push("flags.midi-qol-rotv.disadvantage.ability.check.all");
	midiFlags.push("flags.midi-qol-rotv.disadvantage.ability.save.all");
	midiFlags.push("flags.midi-qol-rotv.fail.ability.all");
	midiFlags.push("flags.midi-qol-rotv.fail.ability.check.all");
	midiFlags.push("flags.midi-qol-rotv.fail.ability.save.all");
	midiFlags.push("flags.midi-qol-rotv.superSaver.all");
	midiFlags.push("flags.midi-qol-rotv.semiSuperSaver.all");
	midiFlags.push("flags.midi-qol-rotv.max.ability.save.all");
	midiFlags.push("flags.midi-qol-rotv.max.ability.check.all");
	midiFlags.push("flags.midi-qol-rotv.min.ability.save.all");
	midiFlags.push("flags.midi-qol-rotv.min.ability.check.all");
	midiFlags.push("flags.midi-qol-rotv.sharpShooter");
	midiFlags.push("flags.midi-qol-rotv.onUseMacroName");
	Object.keys(config.abilities).forEach(abl => {
		midiFlags.push(`flags.midi-qol-rotv.advantage.ability.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.disadvantage.ability.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.advantage.ability.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.disadvantage.ability.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.advantage.attack.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.disadvantage.attack.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.fail.ability.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.fail.ability.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.superSaver.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.semiSuperSaver.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.max.ability.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.min.ability.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.max.ability.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.min.ability.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.optional.NAME.save.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.optional.NAME.check.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.magicResistance.${abl}`);
		midiFlags.push(`flags.midi-qol-rotv.magicVulnerability.all.${abl}`);
	});
	midiFlags.push(`flags.midi-qol-rotv.advantage.skill.all`);
	midiFlags.push(`flags.midi-qol-rotv.disadvantage.skill.all`);
	midiFlags.push(`flags.midi-qol-rotv.fail.skill.all`);
	midiFlags.push("flags.midi-qol-rotv.max.skill.all");
	midiFlags.push("flags.midi-qol-rotv.min.skill.all");
	Object.keys(config.skills).forEach(skill => {
		midiFlags.push(`flags.midi-qol-rotv.advantage.skill.${skill}`);
		midiFlags.push(`flags.midi-qol-rotv.disadvantage.skill.${skill}`);
		midiFlags.push(`flags.midi-qol-rotv.fail.skill.${skill}`);
		midiFlags.push(`flags.midi-qol-rotv.max.skill.${skill}`);
		midiFlags.push(`flags.midi-qol-rotv.min.skill.${skill}`);
		midiFlags.push(`flags.midi-qol-rotv.optional.NAME.skill.${skill}`);
	});
	midiFlags.push(`flags.midi-qol-rotv.advantage.deathSave`);
	midiFlags.push(`flags.midi-qol-rotv.disadvantage.deathSave`);
	if (game.system.id === "rotv") {
		// fix for translations
		["vocal", "somatic", "material"].forEach(comp => {
			midiFlags.push(`flags.midi-qol-rotv.fail.spell.${comp.toLowerCase()}`);
		});
		midiFlags.push(`flags.midi-qol-rotv.DR.all`);
		midiFlags.push(`flags.midi-qol-rotv.DR.non-magical`);
		midiFlags.push(`flags.midi-qol-rotv.DR.non-silver`);
		midiFlags.push(`flags.midi-qol-rotv.DR.non-adamant`);
		midiFlags.push(`flags.midi-qol-rotv.DR.non-physical`);
		midiFlags.push(`flags.midi-qol-rotv.DR.final`);
		Object.keys(config.damageResistanceTypes).forEach(dt => {
			midiFlags.push(`flags.midi-qol-rotv.DR.${dt}`);
		});
		midiFlags.push(`flags.midi-qol-rotv.DR.healing`);
		midiFlags.push(`flags.midi-qol-rotv.DR.temphp`);
	}
	else if (game.system.id === "sw5e") {
		midiFlags.push(`flags.midi-qol-rotv.DR.all`);
		midiFlags.push(`flags.midi-qol-rotv.DR.final`);
		Object.keys(config.damageResistanceTypes).forEach(dt => {
			midiFlags.push(`flags.midi-qol-rotv.DR.${dt}`);
		});
		midiFlags.push(`flags.midi-qol-rotv.DR.healing`);
		midiFlags.push(`flags.midi-qol-rotv.DR.temphp`);
	}
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.attack.all`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.attack.fail`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.damage.all`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.check.all`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.save.all`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.check.fail`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.save.fail`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.label`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.skill.all`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.skill.fail`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.count`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.countAlt`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.ac`);
	//   midiFlags.push(`flags.midi-qol-rotv.optional.NAME.criticalDamage`);
	midiFlags.push(`flags.midi-qol-rotv.optional.Name.onUse`);
	midiFlags.push(`flags.midi-qol-rotv.optional.NAME.macroToCall`);
	midiFlags.push(`flags.midi-qol-rotv.uncanny-dodge`);
	midiFlags.push(`flags.midi-qol-rotv.OverTime`);
	midiFlags.push("flags.midi-qol-rotv.inMotion");
	//@ts-ignore
	const damageTypes = Object.keys(config.damageTypes);
	for (let key of damageTypes) {
		midiFlags.push(`flags.midi-qol-rotv.absorption.${key}`);
	}
	/*
	midiFlags.push(`flags.midi-qol-rotv.grants.advantage.attack.all`);
	midiFlags.push(`flags.midi-qol-rotv.grants.disadvantage.attack.all`);
	midiFlags.push(``);

	midiFlags.push(``);
	midiFlags.push(``);
	*/
	if (installedModules.get("dae")) {
		const initDAE = async () => {
			for (let i = 0; i < 100; i++) {
				if (globalThis.DAE) {
					globalThis.DAE.addAutoFields(midiFlags);
					return true;
				}
				else {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}
			return false;
		};
		initDAE().then(value => { if (!value)
			console.error(`midi-qol-rotv | initDae settings failed`); });
	}
}
// Revisit to find out how to set execute as GM
const MQMacros = [
	{
		name: "MidiQOL.UpdateHP",
		commandText: `
	// Macro Auto created by midi-qol-rotv
	const theActor = await fromUuid(args[0]);
	if (!theActor || isNaN(args[1])) return;
	await theActor.update({"system.attributes.hp.value": Number(args[1])}, {onUpdateCalled: true});`
	}
];
export function createMidiMacros() {
	if (game?.user?.isGM) {
		for (let macroSpec of MQMacros) {
			let macro = game.macros?.getName(macroSpec.name);
			while (macro) {
				macro.delete();
				macro = game.macros?.getName(macroSpec.name);
			}
			const macroData = {
				_id: null,
				name: macroSpec.name,
				type: 'script',
				author: game.user.id,
				img: 'icons/svg/dice-target.svg',
				scope: 'global',
				command: macroSpec.commandText,
				folder: null,
				sort: 0,
				permission: {
					default: 0,
				},
				flags: {},
			};
		}
	}
}
