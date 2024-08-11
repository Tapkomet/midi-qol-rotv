import { debug, setDebugLevel, i18n, debugEnabled, geti18nTranslations, geti18nOptions } from "../midi-qol-rotv.js";
import { ConfigPanel } from "./apps/ConfigPanel.js";
import { SoundConfigPanel } from "./apps/SoundConfigPanel.js";
import { TroubleShooter } from "./apps/TroubleShooter.js";
import { configureDamageRollDialog } from "./patching.js";
import { TargetConfirmationConfig } from "./apps/TargetConfirmationConfig.js";
import { _updateAction } from "./utils.js";
export var itemRollButtons;
export var criticalDamage;
export var criticalDamageGM;
export var nsaFlag;
export var coloredBorders;
export var saveRequests = {};
export var saveTimeouts = {};
export var addChatDamageButtons;
export var autoFastForwardAbilityRolls;
export var autoRemoveTargets;
export var forceHideRoll;
export var enableWorkflow;
export var dragDropTargeting;
export var targetConfirmation;
export var midiSoundSettings = {};
export var midiSoundSettingsBackup = undefined;
export var DebounceInterval;
export var _debouncedUpdateAction;
export const defaultTargetConfirmationSettings = {
	enabled: false,
	always: false,
	noneTargeted: false,
	hasAttack: false,
	hasCreatureTarget: false,
	targetSelf: false,
	hasAoE: false,
	hasRangedAoE: false,
	longRange: false,
	inCover: false,
	mixedDispositiion: false,
	gridPosition: { x: 0, y: 0 }
};
const defaultKeyMapping = {
	"ROTV.Advantage": "altKey",
	"ROTV.Disadvantage": "ctrlKey",
	"ROTV.Critical": "altKey",
	"ROTV.Versatile": "shiftKey"
};
class ConfigSettings {
	constructor() {
		// fullAuto: boolean = false;
		this.addDead = "none";
		this.addFakeDice = false;
		this.addWounded = 0;
		this.addWoundedStyle = "none";
		this.midiWoundedCondition = "none";
		this.midiDeadCondition = "none";
		this.midiUnconsciousCondition = "none";
		this.allowUseMacro = false;
		this.allowActorUseMacro = false;
		this.attackPerTarget = false;
		this.autoApplyDamage = "none";
		this.playerDamageCard = "none";
		this.playerCardDamageDifferent = false;
		this.hidePlayerDamageCard = true;
		this.autoCEEffects = "none";
		this.autoCheckHit = "none";
		this.autoCheckSaves = "none";
		this.autoFastForward = "off";
		this.autoRemoveSummonedCreature = false;
		this.autoRollAttack = false;
		this.autoRollDamage = "none";
		this.autoCompleteWorkflow = false;
		this.saveDROrder = "SaveDRdr";
		this.autoTarget = "none";
		this.averageDamage = "none";
		this.checkSaveText = false;
		this.collapsibleTargets = true;
		this.concentrationAutomation = false;
		this.consumeResource = "none";
		this.convenientEffectsReaction = "Reaction";
		this.criticalSound = "";
		this.customSoundsPlaylist = "none";
		this.damageImmunities = "none";
		this.damageImmunityMultiplier = 0.0;
		this.damageResistanceMultiplier = 0.5;
		this.damageVulnerabilityMultiplier = 2;
		this.defaultSaveMult = 0.5;
		this.diceSound = "";
		this.displayHitResultNumeric = true;
		this.displaySaveAdvantage = true;
		this.displaySaveDC = true;
		this.doConcentrationCheck = "chat";
		this.griddedGridless = false;
		this.gridlessFudge = 0;
		this.doReactions = "all";
		this.effectActivation = false;
		this.enableddbGL = false;
		this.enforceReactions = "none";
		this.enforceBonusActions = "none";
		this.enforceSingleWeaponTarget = false;
		this.fixStickyKeys = true;
		this.fumbleSound = "";
		this.ghostRolls = false;
		this.gmAutoAttack = false;
		this.gmAutoDamage = "none";
		this.gmAutoFastForwardAttack = false;
		this.gmAutoFastForwardDamage = false;
		this.gmConsumeResource = "none";
		this.gmDoReactions = "all";
		this.gmHide3dDice = false;
		this.gmLateTargeting = "none";
		this.gmRemoveButtons = "all";
		this.hideRollDetails = "none";
		this.ignoreSpellReactionRestriction = false;
		this.itemRollStartWorkflow = false;
		this.itemTypeList = undefined;
		this.itemUseSound = "";
		this.keepRollStats = false;
		this.keyMapping = defaultKeyMapping;
		this.mergeCard = false;
		this.mergeCardCondensed = false;
		this.mergeCardMulti = false;
		this.mergeCardMultiDamage = false;
		this.midiFieldsTab = true;
		this.midiPropertiesTabRole = CONST.USER_ROLES.PLAYER;
		this.confirmAttackDamage = "none";
		this.highlightSuccess = false;
		this.optionalRulesEnabled = false;
		this.paranoidGM = false;
		this.playerRollSaves = "none";
		this.playerSaveTimeout = 0;
		this.playerStatsOnly = false;
		this.potionUseSound = "";
		this.promptDamageRoll = false;
		this.quickSettings = true;
		this.rangeTarget = "none";
		this.useTemplateRangedTargeting = false;
		this.reactionTimeout = 10;
		this.recordAOO = "none";
		this.removeButtons = "all";
		this.removeConcentration = true;
		this.removeConcentrationEffects = "effects";
		this.requireMagical = "off";
		this.requiresTargets = "none";
		this.rollNPCLinkedSaves = "auto";
		this.rollNPCSaves = "auto";
		this.rollOtherDamage = "none";
		this.rollOtherSpellDamage = "none";
		this.rollChecksBlind = [];
		this.rollSavesBlind = [];
		this.rollSkillsBlind = [];
		this.saveStatsEvery = 20;
		this.showDSN = true;
		this.showFastForward = false;
		this.showItemDetails = "all";
		this.showReactionAttackRoll = "all";
		this.showReactionChatMessage = false;
		this.singleConcentrationRoll = true;
		this.skillAbilityCheckAdvantage = true;
		this.spellHitSound = "";
		this.spellUseSound = "";
		this.spellUseSoundRanged = "";
		this.syrinToken = undefined;
		this.tempHPDamageConcentrationCheck = false;
		this.concentrationIncapacitatedConditionCheck = false;
		this.toggleOptionalRules = false;
		this.useCustomSounds = true;
		this.usePlayerPortrait = false;
		this.useTokenNames = false;
		this.undoChatColor = "Delete";
		this.undoWorkflow = false;
		this.v3DamageApplication = false;
		this.weaponHitSound = "";
		this.weaponUseSound = "";
		this.weaponUseSoundRanged = "";
		this.rollAlternate = "off";
		this.optionalRules = {
			invisAdvantage: "RAW",
			hiddenAdvantage: "none",
			invisVision: false,
			checkRange: "longFail",
			wallsBlockRange: "center",
			diplsayBonusRolls: true,
			coverCalculation: "none",
			nearbyFoe: 1,
			nearbyAllyRanged: 0,
			incapacitated: true,
			removeHiddenInvis: true,
			maxDRValue: false,
			DRAllPerDamageDetail: true,
			distanceIncludesHeight: false,
			criticalSaves: false,
			activeDefence: false,
			activeDefenceShow: "selfroll",
			challengModeArmor: "none",
			checkFlanking: "off",
			optionalCritRule: -1,
			criticalNat20: false,
			actionSpecialDurationImmediate: false,
			vitalityResource: "",
			autoRerollInitiative: false,
		};
	}
}
export var configSettings = new ConfigSettings();
export function checkMechanic(mechanic) {
	if (configSettings.toggleOptionalRules)
		return false;
	return configSettings.optionalRules[mechanic];
}
export function checkRule(rule) {
	let rulesEnabled = configSettings.optionalRulesEnabled;
	if (game.user?.isGM)
		rulesEnabled = rulesEnabled ? !configSettings.toggleOptionalRules : configSettings.toggleOptionalRules;
	return rulesEnabled && configSettings.optionalRules[rule];
}
export const checkedModuleList = [
	"about-time",
	"ActiveAuras",
	"autoanimations",
	"anonymous",
	"babonus",
	"chris-premades",
	"condition-lab-triggler",
	"dae",
	"ddb-importer",
	"ddb-game-log",
	"df-templates",
	"dice-so-nice",
	"effectmacro",
	"itemacro",
	/levels/,
	"lib-wrapper",
	"lmrtfy",
	"multilevel-tokens",
	"sequencer",
	"simbuls-cover-calculator",
	"socketlib",
	"times-up",
	"tokenmagic",
	"walledtemplates",
	"warpgate",
	"wjmaia",
];
export const CheckedAuthorsList = [
	"hell",
	"dfreds",
	// "theripper93", - just too many modules :)
	"ironmonk"
];
export function collectSettingData() {
	let data = {
		configSettings,
		midiSoundSettings,
		itemRollButtons,
		criticalDamage,
		criticalDamageGM,
		nsaFlag,
		coloredBorders,
		addChatDamageButtons,
		autoFastForwardAbilityRolls,
		autoRemoveTargets,
		forceHideRoll,
		enableWorkflow,
		dragDropTargeting,
		DebounceInterval,
		targetConfirmation,
		flags: {}
	};
	data.flags["exportSource"] = {
		system: game.system.id,
		//@ts-expect-error version
		coreVersion: game.version ?? game?.version,
		//@ts-expect-error version
		systemVersion: game.system.version,
		//@ts-expect-error
		midiVersion: game.modules.get("midi-qol-rotv")?.version,
	};
	return data;
}
export function exportSettingsToJSON() {
	const filename = `fvtt-midi-qol-rotv-settings.json`;
	saveDataToFile(JSON.stringify(collectSettingData(), null, 2), "text/json", filename);
}
function removeOldValues(theObject) {
	if (typeof theObject !== "object")
		return theObject;
	Object.keys(theObject).forEach(key => {
		if (theObject[key]?.newValue !== undefined) {
			theObject[key] = theObject[key].newValue;
		}
	});
	return theObject;
}
export async function importSettingsFromJSON(json) {
	if (typeof json === "string")
		json = JSON.parse(json);
	if (json.midiSettings) { // this is a trouble shooter file
		json = json.midiSettings;
	}
	await game.settings.set("midi-qol-rotv", "ConfigSettings", removeOldValues(json.configSettings));
	await game.settings.set("midi-qol-rotv", "ItemRollButtons", removeOldValues(json.itemRollButtons));
	await game.settings.set("midi-qol-rotv", "CriticalDamage", removeOldValues(json.criticalDamage));
	await game.settings.set("midi-qol-rotv", "CriticalDamageGM", removeOldValues(json.criticalDamageGM));
	await game.settings.set("midi-qol-rotv", "showGM", removeOldValues(json.nsaFlag));
	await game.settings.set("midi-qol-rotv", "ColoredBorders", removeOldValues(json.coloredBorders));
	await game.settings.set("midi-qol-rotv", "AddChatDamageButtons", removeOldValues(json.addChatDamageButtons));
	await game.settings.set("midi-qol-rotv", "AutoFastForwardAbilityRolls", removeOldValues(json.autoFastForwardAbilityRolls));
	await game.settings.set("midi-qol-rotv", "AutoRemoveTargets", removeOldValues(json.autoRemoveTargets));
	await game.settings.set("midi-qol-rotv", "ForceHideRoll", removeOldValues(json.forceHideRoll));
	await game.settings.set("midi-qol-rotv", "EnableWorkflow", removeOldValues(json.enableWorkflow));
	await game.settings.set("midi-qol-rotv", "DragDropTarget", removeOldValues(json.dragDropTargeting));
	await game.settings.set("midi-qol-rotv", "DebounceInterval", removeOldValues(json.DebounceInterval));
	await game.settings.set("midi-qol-rotv", "TargetConfirmation", removeOldValues(json.targetConfirmation));
	await game.settings.set("midi-qol-rotv", "MidiSoundSettings", removeOldValues(json.midiSoundSettings) ?? {});
	//@ts-expect-error _sheet
	const settingsAppId = game.settings._sheet?.appId;
	if (settingsAppId)
		ui.windows[settingsAppId]?.render(true);
	const exportSource = json.flags?.exportSource;
	ui.notifications?.notify(`Importing settings from foundry version ${exportSource?.coreVersion} rotv ${exportSource?.systemVersion} midi ${exportSource?.midiVersion}`);
}
export let fetchSoundSettings = () => {
	midiSoundSettings = game.settings.get("midi-qol-rotv", "MidiSoundSettings") ?? {};
	if (midiSoundSettings.version === undefined) {
		midiSoundSettingsBackup = foundry.utils.duplicate(midiSoundSettings);
		midiSoundSettings = { "any": midiSoundSettings };
		midiSoundSettings.version = "0.9.48";
	}
};
export let fetchParams = () => {
	if (debugEnabled > 1)
		debug("Fetch Params Loading");
	const promptDamageRoll = configSettings.promptDamageRoll ?? false;
	//@ts-ignore
	configSettings = game.settings.get("midi-qol-rotv", "ConfigSettings");
	if (configSettings.saveDROrder === undefined)
		configSettings.saveDROrder = "DRSavedr";
	if (!configSettings.fumbleSound)
		configSettings.fumbleSound = CONFIG.sounds["dice"];
	if (!configSettings.criticalSound)
		configSettings.criticalSound = CONFIG.sounds["dice"];
	if (!configSettings.diceSound)
		configSettings.diceSound = CONFIG.sounds["dice"];
	if (!configSettings.doReactions)
		configSettings.doReactions = "none";
	if (!configSettings.gmDoReactions)
		configSettings.gmDoReactions = "none";
	if (configSettings.reactionTimeout === undefined)
		configSettings.reactionTimeout = 0;
	if (configSettings.convenientEffectsReaction === undefined)
		configSettings.convenientEffectsReaction = "Reaction"; //TODO come back when it is configurable in midi and set it to ""
	if (typeof configSettings.rangeTarget !== "string")
		configSettings.rangeTarget = "none";
	if (!configSettings.showReactionAttackRoll === undefined)
		configSettings.showReactionAttackRoll = "all";
	// deal with change of type of rollOtherDamage
	if (configSettings.rollOtherDamage === false)
		configSettings.rollOtherDamage = "none";
	if (configSettings.rollOtherDamage === true)
		configSettings.rollOtherDamage = "ifSave";
	if (configSettings.rollOtherDamage === undefined)
		configSettings.rollOtherDamage = "none";
	if (configSettings.rollOtherSpellDamage === "activation") {
		ui.notifications?.error("midi-qol-rotv | rollOtherSpellDamage is set to activation, this is no longer supported, setting to none");
		configSettings.rollOtherSpellDamage = "none";
	}
	if (configSettings.rollOtherSpellDamage === "activation") {
		ui.notifications?.error("midi-qol-rotv | rollOtherSpellDamage is set to activation, this is no longer supported, setting to none");
		configSettings.rollOtherSpellDamage = "none";
	}
	configSettings.effectActivation = false;
	if (!configSettings.rollOtherSpellDamage)
		configSettings.rollOtherSpellDamage = "none";
	if (!configSettings.rollChecksBlind)
		configSettings.rollChecksBlind = [];
	configSettings.rollChecksBlind = configSettings.rollChecksBlind.filter((item) => item !== "none");
	//@ts-expect-error type mismatch - this is for legacy true setting
	if (configSettings.rollChecksBlind === true)
		configSettings.rollChecksBlind = ["all"];
	if (!configSettings.rollSavesBlind)
		configSettings.rollSavesBlind = [];
	configSettings.rollSavesBlind = configSettings.rollSavesBlind.filter((item) => item !== "none");
	//@ts-expect-error type mismatch - this is for legacy true setting
	if (configSettings.rollSavesBlind === true)
		configSettings.rollSavessBlind = ["all"];
	if (!configSettings.rollSkillsBlind)
		configSettings.rollSkillsBlind = [];
	configSettings.rollSkillsBlind = configSettings.rollSkillsBlind.filter((item) => item !== "none");
	//@ts-expect-error type mismatch - this is for legacy true setting
	if (configSettings.rollSkillsBlind === true)
		configSettings.rollSkillsBlind = ["all"];
	if (configSettings.promptDamageRoll === undefined)
		configSettings.promptDamageRoll = false;
	if (configSettings.gmHide3dDice === undefined)
		configSettings.gmHide3dDice = false;
	if (configSettings.ghostRolls === undefined)
		configSettings.ghostRolls = false;
	if (configSettings.addFakeDice === undefined)
		configSettings.addFakeDice = false;
	if (typeof configSettings.gmConsumeResource !== "string")
		configSettings.gmConsumeResource = "none";
	if (typeof configSettings.consumeResource !== "string")
		configSettings.consumeResource = "none";
	if (!configSettings.enableddbGL)
		configSettings.enableddbGL = false;
	if (!configSettings.showReactionChatMessage)
		configSettings.showReactionChatMessage = false;
	if (configSettings.fixStickyKeys === undefined)
		configSettings.fixStickyKeys = true;
	//@ts-ignore legacy boolean value
	if (configSettings.autoCEEffects === true)
		configSettings.autoCEEffects = "both";
	if (!configSettings.autoCEEffects)
		configSettings.autoCEEffects = "none";
	configSettings.toggleOptionalRules = false;
	if (configSettings.displaySaveAdvantage === undefined)
		configSettings.displaySaveAdvantage = true;
	if (!configSettings.recordAOO)
		configSettings.recordAOO = "none";
	if (!configSettings.enforceReactions)
		configSettings.enforceReactions = "none";
	if (!configSettings.enforceBonusActions)
		configSettings.enforceBonusActions = "none";
	//@ts-ignore
	if (configSettings.autoItemEffects === false)
		configSettings.autoItemEffects = "off";
	//@ts-ignore
	if (configSettings.autoItemEffects === true)
		configSettings.autoItemEffects = "applyRemove";
	if (configSettings.playerDamageCard === undefined)
		configSettings.playerDamageCard = "none";
	if (configSettings.playerCardDamageDifferent === undefined)
		configSettings.playerCardDamageDifferent = true;
	if (configSettings.displayHitResultNumeric === undefined)
		configSettings.displayHitResultNumeric = false;
	if (configSettings.rollAlternate === undefined)
		configSettings.rollAlternate = "off";
	//@ts-ignore
	if (configSettings.rollAlternate === false)
		configSettings.rollAlternate = "off";
	//@ts-ignore
	if (configSettings.rollAlternate === true)
		configSettings.rollAlternate = "formula";
	if (configSettings.allowActorUseMacro === undefined)
		configSettings.allowActorUseMacro = configSettings.allowUseMacro;
	if (configSettings.skillAbilityCheckAdvantage === undefined)
		configSettings.skillAbilityCheckAdvantage = true;
	if (!configSettings.keyMapping
		|| !configSettings.keyMapping["ROTV.Advantage"]
		|| !configSettings.keyMapping["ROTV.Disadvantage"]
		|| !configSettings.keyMapping["ROTV.Critical"]) {
		configSettings.keyMapping = defaultKeyMapping;
	}
	// MidiSounds.setupBasicSounds();
	// migrateExistingSounds();
	if (configSettings.addWounded === undefined)
		configSettings.addWounded = 0;
	if (configSettings.addWounded > 0 && configSettings.addWoundedStyle === undefined)
		configSettings.addWoundedStyle = "normal";
	if (!configSettings.addDead)
		configSettings.addDead = "none";
	if (typeof configSettings.addDead === "boolean" && configSettings.addDead)
		configSettings.addDead = "overlay";
	if (configSettings.paranoidGM === undefined)
		configSettings.paranoidGM = false;
	if (typeof configSettings.requiresTargets !== "string")
		configSettings.requiresTargets = "none";
	if (configSettings.tempHPDamageConcentrationCheck === undefined)
		configSettings.tempHPDamageConcentrationCheck = false;
	if (configSettings.showDSN === undefined)
		configSettings.showDSN = true;
	if (configSettings.showFastForward === undefined)
		configSettings.showFastForward = true;
	if (configSettings.highlightSuccess === undefined)
		configSettings.highlightSuccess = false;
	configSettings.optionalRules = foundry.utils.mergeObject({
		actionSpecialDurationImmediate: false,
		activeDefence: false,
		activeDefenceShow: "selfroll",
		challengeModeArmor: "none",
		challengeModeArmorScale: false,
		checkFlanking: "off",
		checkRange: "longfail",
		coverCalculation: "none",
		displayBonusRolls: true,
		criticalNat20: false,
		criticalSaves: false,
		distanceIncludesHeight: false,
		incapacitated: true,
		invisAdvantage: "RAW",
		hiddenAdvantage: "none",
		maxDRValue: false,
		DRAllPerDamageDetail: true,
		nearbyAllyRanged: 0,
		nearbyFoe: 1,
		optionalCritRule: -1,
		removeHiddenInvis: true,
		wallsBlockRange: "center",
		mergeCardMulti: false,
		mergeCardMultiDamage: false,
	}, configSettings.optionalRules ?? {}, { overwrite: true, insertKeys: true, insertValues: true });
	if (!configSettings.optionalRules.wallsBlockRange)
		configSettings.optionalRules.wallsBlockRange = "center";
	if (configSettings.optionalRules.checkFlanking === true)
		configSettings.optionalRules.checkFlanking = "ceadv";
	if (!configSettings.optionalRules.coverCalculation)
		configSettings.optionalRules.coverCalculation = "none";
	if (configSettings.optionalRules.displayBonusRolls === undefined)
		configSettings.optionalRules.displayBonusRolls = true;
	if (configSettings.optionalRules.checkFlanking === false)
		configSettings.optionalRules.checkFlanking = "off";
	if (configSettings.optionalRules.checkRange === true)
		configSettings.optionalRules.checkRange = "longfail";
	if (!configSettings.optionalRules.checkRange)
		configSettings.optionalRules.checkRange = "none";
	if (!configSettings.optionalRules.invisAdvantage)
		configSettings.optionalRules.invisAdvantage = "none";
	if (configSettings.optionalRules.invisAdvantage === true)
		configSettings.optionalRules.invisAdvantage = "RAW";
	if (!configSettings.optionalRules.hiddenAdvantage)
		configSettings.optionalRules.hiddenAdvantage = "none";
	if (configSettings.optionalRules.activeDefenceShowGM === true) {
		// old setting replaced with new
		configSettings.optionalRules.activeDefenceShow = "gmroll";
		delete configSettings.optionalRules.activeDefenceShowGM;
	}
	if (typeof configSettings.confirmAttackDamage !== "string")
		configSettings.confirmAttackDamage = "none";
	if (typeof configSettings.requireMagical !== "string" && configSettings.requireMagical !== true)
		configSettings.requireMagical = "off";
	if (typeof configSettings.requireMagical !== "string" && configSettings.requireMagical === true)
		configSettings.requireMagical = "nonspell";
	if (typeof configSettings.optionalRules.nearbyFoe !== "number") {
		if (configSettings.optionalRulesEnabled)
			configSettings.optionalRules.nearbyFoe = 1;
		else
			configSettings.optionalRules.nearbyFoe = 0;
	}
	configSettings.itemRollStartWorkflow = false;
	const itemList = Object.keys(CONFIG.Item.typeLabels);
	if (!configSettings.itemTypeList && itemList.length > 0) {
		configSettings.itemTypeList = itemList;
		configSettings.itemTypeList.filter((type) => !["base", "backpack"].includes(type));
	}
	if (configSettings.itemTypeList === undefined)
		configSettings.itemTypeList = Object.keys(CONFIG.Item.typeLabels);
	if (configSettings.defaultSaveMult === undefined)
		configSettings.defaultSaveMult = 0.5;
	if (configSettings.ignoreSpellReactionRestriction === undefined)
		configSettings.ignoreSpellReactionRestriction = false;
	if (configSettings.damageImmunityMultiplier === undefined)
		configSettings.damageImmunityMultiplier = 0.0;
	if (configSettings.damageResistanceMultiplier === undefined)
		configSettings.damageResistanceMultiplier = 0.5;
	if (configSettings.damageVulnerabilityMultiplier === undefined)
		configSettings.damageVulnerabilityMultiplier = 2;
	if (configSettings.hidePlayerDamageCard === undefined)
		configSettings.hidePlayerDamageCard = true;
	if (configSettings.attackPerTarget === undefined)
		configSettings.attackPerTarget = false;
	if (configSettings.autoRemoveTemplate === undefined)
		configSettings.autoRemoveTemplate = true;
	if (configSettings.autoRemoveInstantaneousTemplate === undefined)
		configSettings.autoRemoveInstantaneousTemplate = false;
	if (configSettings.removeConcentrationEffects === undefined)
		configSettings.removeConcentrationEffects = "effects";
	if (configSettings.doConcentrationCheck === undefined)
		configSettings.doConcentrationCheck = configSettings.removeConcentration ? "chat" : "none";
	if (configSettings.undoWorkflow === undefined)
		configSettings.undoWorkflow = false;
	if (configSettings.undoChatColor === undefined)
		configSettings.undoChatColor = "Delete";
	if (configSettings.enforceSingleWeaponTarget == undefined)
		configSettings.enforceSingleWeaponTarget = false;
	configSettings.hidePlayerDamageCard = true;
	configSettings.quickSettings = true;
	//@ts-expect-error have removed the definition
	if (configSettings.averageNPCDamage !== undefined) {
		//@ts-expect-error delete the obsolete setting;
		delete configSettings.averageNPCDamage;
	}
	if (configSettings.averageDamage === undefined)
		configSettings.averageDamage = "none";
	enableWorkflow = Boolean(game.settings.get("midi-qol-rotv", "EnableWorkflow"));
	if (configSettings.optionalRules.challengeModeArmor === true) { // old settings
		if (configSettings.optionalRules.challengeModeArmorScale)
			configSettings.optionalRules.challengeModeArmor = "scale";
		else
			configSettings.optionalRules.challengeModeArmor = "challenge";
	}
	else if ([false, undefined].includes(configSettings.optionalRules.challengeModeArmor)) {
		configSettings.optionalRules.challengeModeArmor = "none";
	}
	if (configSettings.midiWoundedCondition === undefined) {
		configSettings.midiWoundedCondition = "none";
		configSettings.addWoundedStyle = "none";
	}
	if (configSettings.midiDeadCondition === undefined)
		configSettings.midiDeadCondition = "none";
	if (configSettings.midiUnconsciousCondition === undefined)
		configSettings.midiUnconsciousCondition = "none";
	// Fix for typo in en.json
	if (configSettings.autoTarget === "wallsBlockIgnoreIncapcitated")
		configSettings.autoTarget = "wallsBlockIgnoreIncapacitated";
	if (configSettings.autoTarget === "wallsBlockIgnoreIncapacitated")
		configSettings.autoTarget = "alwaysIgnoreIncapacitated";
	if (configSettings.autoTarget === "alwaysIgnoreIncapcitated")
		configSettings.autoTarget = "alwaysIgnoreIncapacitated";
	if (configSettings.midiFieldsTab === undefined)
		configSettings.midiFieldsTab = true;
	if (configSettings.v3DamageApplication === undefined)
		configSettings.v3DamageApplication = false;
	if (configSettings.collapsibleTargets === undefined)
		configSettings.collapsibleTargets = true;
	criticalDamage = String(game.settings.get("midi-qol-rotv", "CriticalDamage"));
	if (criticalDamage === "none")
		criticalDamage = "default";
	criticalDamageGM = String(game.settings.get("midi-qol-rotv", "CriticalDamageGM"));
	if (criticalDamageGM === "none")
		criticalDamageGM = criticalDamage;
	nsaFlag = Boolean(game.settings.get("midi-qol-rotv", "showGM"));
	coloredBorders = String(game.settings.get("midi-qol-rotv", "ColoredBorders"));
	itemRollButtons = Boolean(game.settings.get("midi-qol-rotv", "ItemRollButtons"));
	addChatDamageButtons = String(game.settings.get("midi-qol-rotv", "AddChatDamageButtons"));
	autoFastForwardAbilityRolls = Boolean(game.settings.get("midi-qol-rotv", "AutoFastForwardAbilityRolls"));
	autoRemoveTargets = String(game.settings.get("midi-qol-rotv", "AutoRemoveTargets"));
	if (autoRemoveTargets === "allGM") {
		autoRemoveTargets = game.user?.isGM ? "all" : "dead";
		game.settings.set("midi-qol-rotv", "AutoRemoveTargets", autoRemoveTargets);
	}
	let debugText = String(game.settings.get("midi-qol-rotv", "Debug"));
	forceHideRoll = Boolean(game.settings.get("midi-qol-rotv", "ForceHideRoll"));
	dragDropTargeting = Boolean(game.settings.get("midi-qol-rotv", "DragDropTarget"));
	DebounceInterval = Number(game.settings.get("midi-qol-rotv", "DebounceInterval"));
	_debouncedUpdateAction = foundry.utils.debounce(_updateAction, DebounceInterval);
	targetConfirmation = game.settings.get("midi-qol-rotv", "TargetConfirmation");
	if (configSettings.griddedGridless === undefined)
		configSettings.griddedGridless = false;
	if (configSettings.gridlessFudge === undefined)
		configSettings.gridlessFudge = 0;
	//@ts-expect-error
	if (game.release.generation >= 12)
		configSettings.gridlessFudge = undefined;
	if (configSettings.concentrationIncapacitatedConditionCheck === undefined)
		configSettings.concentrationIncapacitatedConditionCheck = false;
	if (targetConfirmation === undefined || typeof targetConfirmation === "string" || targetConfirmation instanceof String)
		targetConfirmation = {
			enabled: false,
			always: false,
			noneTargeted: false,
			hasAttack: false,
			hasCreatureTarget: false,
			targetSelf: false,
			hasAoE: false,
			hasRangedAoE: false,
			longRange: false,
			inCover: false,
			allies: false,
			mixedDispositiion: false,
			gridPosition: { x: 0, y: 0 }
		};
	if (game.ready) {
		configureDamageRollDialog();
	}
	setDebugLevel(debugText);
	//@ts-expect-error
	if (configSettings.concentrationAutomation && game.user === game.users?.activeGM) {
		Hooks.once("ready", () => {
			if (configSettings.concentrationAutomation) {
				//@ts-expect-error
				ui.notifications?.warn(`Midi concentration automation is deprecated in favour of ${game.system.title} concentration checking - settings updated to use ${game.system.id} concentration`, { permanent: true });
			}
			;
			configSettings.concentrationAutomation = false;
			game.settings.set(game.system.id, "disableConcentration", false);
			game.settings.set("midi-qol-rotv", "ConfigSettings", configSettings);
		});
	}
	Hooks.callAll("midi-qol-rotv.ConfigSettingsChanged");
};
const settings = [
	{
		name: "EnableWorkflow",
		scope: "client",
		default: true,
		config: true,
		type: Boolean,
		onChange: fetchParams
	},
	{
		name: "AutoFastForwardAbilityRolls",
		scope: "world",
		default: false,
		type: Boolean,
		config: true,
		onChange: fetchParams
	},
	{
		name: "ItemRollButtons",
		scope: "world",
		default: true,
		type: Boolean,
		onChange: fetchParams
	},
	{
		name: "showGM",
		scope: "world",
		default: false,
		type: Boolean,
		choices: [],
		onChange: fetchParams
	},
	{
		name: "ForceHideRoll",
		scope: "client",
		default: true,
		type: Boolean,
		choices: [],
		config: true,
		onChange: fetchParams
	},
	{
		name: "DragDropTarget",
		scope: "world",
		default: false,
		type: Boolean,
		onChange: fetchParams,
		config: true
	},
	{
		name: "ConfigSettings",
		scope: "world",
		type: Object,
		default: configSettings,
		onChange: fetchParams,
		config: false
	},
	{
		name: "MidiSoundSettings",
		scope: "world",
		type: Object,
		default: midiSoundSettings,
		onChange: fetchSoundSettings,
		config: false
	},
	{
		name: "MidiSoundSettings-backup",
		scope: "world",
		type: Object,
		default: {},
		config: false
	},
	{
		name: "LateTargeting",
		scope: "client",
		default: "none",
		type: String,
		config: false,
		choices: "LateTargetingOptions",
	},
];
export function readySettingsSetup() {
	if (game.settings.get("midi-qol-rotv", "CriticalDamage") === "none") {
		criticalDamage = "default;";
		game.settings.set("midi-qol-rotv", "CriticalDamage", "default");
	}
	if (game.settings.get("midi-qol-rotv", "CriticalDamageGM") === "none") {
		criticalDamageGM = criticalDamage;
		game.settings.set("midi-qol-rotv", "CriticalDamageGM", criticalDamage);
	}
}
export function registerSetupSettings() {
	const translations = geti18nTranslations();
	game.settings.register("midi-qol-rotv", "CriticalDamageGM", {
		name: "midi-qol-rotv.CriticalDamageGM.Name",
		// hint: "midi-qol-rotv.CriticalDamageGM.Hint",
		scope: "world",
		default: "none",
		type: String,
		config: true,
		choices: geti18nOptions("CriticalDamageChoices"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "CriticalDamage", {
		name: "midi-qol-rotv.CriticalDamage.Name",
		hint: "midi-qol-rotv.CriticalDamage.Hint",
		scope: "world",
		default: "default",
		type: String,
		config: true,
		choices: geti18nOptions("CriticalDamageChoices"),
		onChange: fetchParams
	});
}
export const registerSettings = function () {
	const translations = geti18nTranslations();
	// Register any custom module settings here
	settings.forEach((setting, i) => {
		let MODULE = "midi-qol-rotv";
		let options = {
			name: game.i18n.localize(`${MODULE}.${setting.name}.Name`),
			hint: game.i18n.localize(`${MODULE}.${setting.name}.Hint`),
			scope: setting.scope,
			config: (setting.config === undefined) ? true : setting.config,
			default: setting.default,
			type: setting.type,
			choices: (typeof setting.choices === "string") ? geti18nOptions(`${setting.choices}`) : {},
			onChange: setting.onChange
		};
		//@ts-ignore - too tedious to define undefined in each of the settings defs
		if (setting.choices)
			options.choices = setting.choices;
		game.settings.register("midi-qol-rotv", setting.name, options);
	});
	game.settings.register("midi-qol-rotv", "CriticalDamageGM", {
		name: "midi-qol-rotv.CriticalDamageGM.Name",
		// hint: "midi-qol-rotv.CriticalDamageGM.Hint",
		scope: "world",
		default: "none",
		type: String,
		config: true,
		choices: geti18nOptions("CriticalDamageChoices"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "CriticalDamage", {
		name: "midi-qol-rotv.CriticalDamage.Name",
		hint: "midi-qol-rotv.CriticalDamage.Hint",
		scope: "world",
		default: "default",
		type: String,
		config: true,
		choices: geti18nOptions("CriticalDamageChoices"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "AddChatDamageButtons", {
		name: "midi-qol-rotv.AddChatDamageButtons.Name",
		hint: "midi-qol-rotv.AddChatDamageButtons.Hint",
		scope: "world",
		default: "none",
		type: String,
		config: true,
		choices: geti18nOptions("AddChatDamageButtonsOptions"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "ColoredBorders", {
		name: "midi-qol-rotv.ColoredBorders.Name",
		hint: "midi-qol-rotv.ColoredBorders.Hint",
		scope: "world",
		default: "None",
		type: String,
		config: true,
		choices: geti18nOptions("ColoredBordersOptions"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "TargetConfirmation", {
		name: "midi-qol-rotv.TargetConfirmation.Name",
		hint: "midi-qol-rotv.TargetConfirmation.Hint",
		scope: "client",
		type: Object,
		default: defaultTargetConfirmationSettings,
		config: false,
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "AutoRemoveTargets", {
		name: "midi-qol-rotv.AutoRemoveTargets.Name",
		hint: "midi-qol-rotv.AutoRemoveTargets.Hint",
		scope: "client",
		default: "dead",
		type: String,
		config: true,
		choices: geti18nOptions("AutoRemoveTargetsOptions"),
		onChange: fetchParams
	});
	game.settings.registerMenu("midi-qol-rotv", "midi-qol-rotv", {
		name: i18n("midi-qol-rotv.config"),
		label: "midi-qol-rotv.WorkflowSettings",
		hint: i18n("midi-qol-rotv.Hint"),
		icon: "fas fa-dice-d20",
		type: ConfigPanel,
		restricted: true
	});
	game.settings.registerMenu("midi-qol-rotv", "TargetConfirmationConfig", {
		name: i18n("midi-qol-rotv.TargetConfirmationConfig.Name"),
		label: i18n("midi-qol-rotv.TargetConfirmationConfig.Name"),
		hint: i18n("midi-qol-rotv.TargetConfirmationConfig.Hint"),
		icon: "fas fa-dice-d20",
		type: TargetConfirmationConfig,
		restricted: false
	});
	game.settings.registerMenu("midi-qol-rotv", "midi-qol-rotv-sounds", {
		name: i18n("midi-qol-rotv.SoundSettings.Name"),
		label: "midi-qol-rotv.SoundSettings.Label",
		hint: i18n("midi-qol-rotv.SoundSettings.Hint"),
		icon: "fas fa-dice-d20",
		type: SoundConfigPanel,
		restricted: true
	});
	game.settings.register("midi-qol-rotv", "playerControlsInvisibleTokens", {
		name: game.i18n.localize("midi-qol-rotv.playerControlsInvisibleTokens.Name"),
		hint: game.i18n.localize("midi-qol-rotv.playerControlsInvisibleTokens.Hint"),
		scope: "world",
		default: false,
		config: true,
		type: Boolean,
		//@ts-ignore v10
		requiresReload: true
	});
	game.settings.register("midi-qol-rotv", "DebounceInterval", {
		name: "Chat Message Cache Time (ms)",
		hint: "Chat message updates will only happen this often",
		scope: "world",
		default: 0,
		type: Number,
		config: true,
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "Debug", {
		name: "midi-qol-rotv.Debug.Name",
		hint: "midi-qol-rotv.Debug.Hint",
		scope: "world",
		default: "None",
		type: String,
		config: true,
		choices: geti18nOptions("DebugOptions"),
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "debugCallTiming", {
		name: "midi-qol-rotv.debugCallTiming.Name",
		hint: "midi-qol-rotv.debugCallTiming.Hint",
		scope: "world",
		default: false,
		type: Boolean,
		config: true,
		onChange: fetchParams
	});
	game.settings.register("midi-qol-rotv", "notificationVersion", {
		name: "",
		hint: "",
		scope: "world",
		default: "0.0.0",
		type: String,
		config: false,
	});
	game.settings.register("midi-qol-rotv", "splashWarnings", {
		name: "",
		hint: "",
		scope: "world",
		type: Boolean,
		config: false,
		default: true
	});
	game.settings.registerMenu("midi-qol-rotv", "troubleShooter", {
		name: i18n("midi-qol-rotv.TroubleShooter.Name"),
		label: "midi-qol-rotv.TroubleShooter.Label",
		hint: i18n("midi-qol-rotv.TroubleShooter.Hint"),
		// icon: "fas fa-dice-d20",
		type: TroubleShooter,
		restricted: false
	});
	game.settings.register("midi-qol-rotv", "last-run-version", {
		type: String,
		config: false,
		default: "0.0.0",
		//@ts-ignore v10
		requiresReload: true
	});
	game.settings.register("midi-qol-rotv", "instanceId", {
		type: String,
		config: false,
		default: "",
		//@ts-ignore v10
		requiresReload: true
	});
};
export function disableWorkflowAutomation() {
	enableWorkflow = false;
}
export function safeGetGameSetting(moduleName, settingName) {
	if (game.settings.settings.get(`${moduleName}.${settingName}`))
		return game.settings.get(moduleName, settingName);
	else
		return undefined;
}
