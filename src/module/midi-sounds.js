import { debug, i18n } from "../midi-qol-rotv.js";
import { configSettings, midiSoundSettings } from "./settings.js";
import { dice3dEnabled } from "./setupModules.js";
export class MidiSounds {
	static getSound(playListName, soundName) {
		const playlist = game.playlists?.getName(playListName);
		//@ts-ignore
		return { playlist, sound: playlist?.sounds.getName(soundName) };
	}
	static async playSound(playListName, soundName) {
		const { playlist, sound } = this.getSound(playListName, soundName);
		//@ts-ignore
		if (playlist && sound) { // TODO check this v10
			return AudioHelper.play({ src: sound.path, volume: sound.volume, autoplay: true, loop: false }, true);
		}
	}
	static ActionTypes() {
		//@ts-ignore
		const config = CONFIG.ROTV;
		return {
			itemRoll: `${i18n("DOCUMENT.Item")} ${i18n("TABLE.Roll")}`,
			attack: i18n("ROTV.AttackRoll"),
			damage: i18n("ROTV.DamageRoll"),
			critical: `${i18n("ROTV.Attack")}: ${i18n("midi-qol-rotv.CriticalSoundName")}`,
			fumble: `${i18n("ROTV.Attack")}: ${i18n("midi-qol-rotv.FumbleSoundName")}`,
			hit: `${i18n("ROTV.Attack")}: ${i18n("midi-qol-rotv.Hits")}`,
			miss: `${i18n("ROTV.Attack")}: ${i18n("midi-qol-rotv.Misses")}`,
			abil: `${i18n("ROTV.Action")}: ${config.itemActionTypes["abil"]}`,
			heal: `${i18n("ROTV.Action")}: ${config.itemActionTypes["heal"]}`,
			msak: `${i18n("ROTV.Action")}: ${config.itemActionTypes["msak"]}`,
			mwak: `${i18n("ROTV.Action")}: ${config.itemActionTypes["mwak"]}`,
			other: `${i18n("ROTV.Action")}: ${config.itemActionTypes["other"]}`,
			rsak: `${i18n("ROTV.Action")}: ${config.itemActionTypes["rsak"]}`,
			rwak: `${i18n("ROTV.Action")}: ${config.itemActionTypes["rwak"]}`,
			save: `${i18n("ROTV.Action")}: ${config.itemActionTypes["save"]}`,
			util: `${i18n("ROTV.Action")}: ${config.itemActionTypes["util"]}`,
			acid: `${i18n("ROTV.Damage")}: ${config.damageTypes.acid}`,
			bludgeoning: `${i18n("ROTV.Damage")}: ${config.damageTypes.bludgeoning}`,
			cold: `${i18n("ROTV.Damage")}: ${config.damageTypes.cold}`,
			fire: `${i18n("ROTV.Damage")}: ${config.damageTypes.fire}`,
			force: `${i18n("ROTV.Damage")}: ${config.damageTypes.force}`,
			lightning: `${i18n("ROTV.Damage")}: ${config.damageTypes.lightning}`,
			necrotic: `${i18n("ROTV.Damage")}: ${config.damageTypes.necrotic}`,
			piercing: `${i18n("ROTV.Damage")}: ${config.damageTypes.piercing}`,
			poison: `${i18n("ROTV.Damage")}: ${config.damageTypes.poison}`,
			psychic: `${i18n("ROTV.Damage")}: ${config.damageTypes.psychic}`,
			radiant: `${i18n("ROTV.Damage")}: ${config.damageTypes.radiant}`,
			slashing: `${i18n("ROTV.Damage")}: ${config.damageTypes.slashing}`,
			thunder: `${i18n("ROTV.Damage")}: ${config.damageTypes.thunder}`,
			"midi-none": `${i18n("ROTV.Damage")}: ${config.damageTypes["midi-none"]}`,
			none: i18n("None")
		};
	}
	static async playRandomSound(playListName) {
		const playlist = game.playlists?.getName(playListName);
		if (playlist) {
			//@ts-ignore
			const sounds = playlist.sounds;
			const soundIndex = Math.floor(Math.random() * sounds.contents.length);
			//@ts-ignore
			const sound = playlist.sounds.contents[soundIndex];
			return AudioHelper.play({ src: sound.path, volume: sound.volume, autoplay: true, loop: false }, true);
		}
	}
	static getSubtype(item) {
		if (!item.type)
			return "";
		let subtype = "";
		switch (item.type) {
			case "weapon":
				subtype = "weapon." + item.system.weaponType;
				break;
			case "equipment":
				subtype = "equipment." + item.system.armor.type;
				break;
			case "consumable":
				subtype = "consumable." + item.system.consumableType;
				break;
			case "spell":
				subtype = "spell." + item.system.school;
				break;
			case "tool":
				subtype = "tool." + item.system.toolType;
				break;
			case "equipment":
				subtype = "equipment." + item.system.equipmentType;
				break;
			default: subtype = item.type + "any";
		}
		return subtype;
	}
	static async getWeaponBaseTypes() {
		MidiSounds.weaponBaseTypes = {};
		// TODO remove this if rotv getBaseItem bug is fixed
		const config = CONFIG;
		const packname = game.system.id === "rotv" ? config.ROTV?.sourcePacks.ITEMS : config.SW5E?.sourcePacks.ITEMS;
		if (packname) {
			const packObject = game.packs.get(packname);
			// TODO check this for v10 compendia
			//@ts-ignore getindex 0 params
			await packObject?.getIndex({ fields: ["system.armor.type", "system.toolType", "system.weaponType", "img"] });
			const weaponTypes = game.system.id === "rotv" ? Object.keys(config.ROTV.weaponTypes) : Object.keys(config.SW5E.weaponTypes);
			;
			const sheetClass = config.Item.sheetClasses.weapon[`${game.system.id}.ItemSheetRelics`].cls;
			for (let wt of weaponTypes) {
				const baseTypes = await MidiSounds.getItemBaseTypes("weapon", wt);
				MidiSounds.weaponBaseTypes = mergeObject(MidiSounds.weaponBaseTypes, baseTypes);
			}
		}
		debug("Weapon base types are ", MidiSounds.weaponBaseTypes);
	}
	static async getItemBaseTypes(type, weaponType) {
		//@ts-ignore RotV
		const baseIds = CONFIG.ROTV[`${type}Ids`];
		if (baseIds === undefined)
			return {};
		const typeProperty = type === "armor" ? "armor.type" : `${type}Type`;
		const baseType = weaponType;
		const items = {};
		for (const [name, id] of Object.entries(baseIds)) {
			let baseItem;
			//@ts-expect-error
			if (game.system.id === "rotv" && isNewerVersion(game.system.version, "2.0.3")) {
				baseItem = await globalThis.rotv.documents.Trait.getBaseItem(id);
			}
			else {
				globalThis.rotv.applications.ProficiencySelector.getBaseItem(id);
			}
			if (baseType !== foundry.utils.getProperty(baseItem.system, typeProperty))
				continue;
			items[name] = baseItem.name;
		}
		//@ts-ignore lhs[1]
		return Object.fromEntries(Object.entries(items).sort((lhs, rhs) => lhs[1].localeCompare(rhs[1])));
	}
	static getSpecFor(actorType, type, subtype, weaponSubType, selector) {
		let spec;
		for (let atype of [actorType, "any"]) {
			let specs = getProperty(midiSoundSettings, atype) ?? {};
			if (!spec)
				spec = getProperty(getProperty(specs, `weapon.${weaponSubType}`) ?? {}, selector);
			if (!spec)
				spec = getProperty(getProperty(specs, subtype) ?? {}, selector);
			if (!spec)
				spec = getProperty(getProperty(specs, `${type}.any`) ?? {}, selector);
			if (!spec)
				spec = getProperty(getProperty(specs, "all.any") ?? {}, selector);
			if (spec)
				return spec;
		}
		return undefined;
	}
	static playSpec(spec) {
		if (spec.soundName !== "random")
			return this.playSound(spec.playlistName, spec.soundName);
		else
			return this.playRandomSound(spec.playlistName);
	}
	static processHook(workflow, selector) {
		const subtype = this.getSubtype(workflow.item);
		const baseType = workflow.item?.system.baseItem ?? "";
		let spec = this.getSpecFor(workflow.item?.parent?.type ?? "all", workflow.item.type, subtype, baseType, selector);
		if (!spec)
			return false;
		return this.playSpec(spec);
	}
	static midiSoundsReadyHooks() {
		Hooks.on("midi-qol-rotv.preItemRoll", async (workflow) => {
			if (!configSettings.useCustomSounds || !workflow.item)
				return true;
			await this.processHook(workflow, "itemRoll");
			return true; // sounds can never block roll
		});
		Hooks.on("midi-qol-rotv.preAttackRoll", async (workflow) => {
			if (!configSettings.useCustomSounds || !workflow.item)
				return true;
			if (dice3dEnabled()
				&& workflow.item.hasAttack && !await this.processHook(workflow, workflow.item.system.actionType)) {
				await this.processHook(workflow, "attack");
			}
			return true;
		});
		Hooks.on("midi-qol-rotv.AttackRollComplete", async (workflow) => {
			if (!configSettings.useCustomSounds || !workflow.item)
				return true;
			if (!dice3dEnabled()
				&& workflow.item.hatAttack && !await this.processHook(workflow, workflow.item.system.actionType)) {
				await this.processHook(workflow, "attack");
			}
			if (workflow.isCritical) {
				await this.processHook(workflow, "critical");
			}
			else if (workflow.isFumble) {
				await this.processHook(workflow, "fumble");
			}
			else if (workflow.hitTargets.size === 0) {
				await this.processHook(workflow, "miss");
			}
			else {
				await this.processHook(workflow, "hit");
			}
			return true;
		});
		Hooks.on("midi-qol-rotv.DamageRollComplete", async (workflow) => {
			if (!configSettings.useCustomSounds || !workflow.item)
				return true;
			const result = await this.processHook(workflow, workflow.defaultDamageType);
			if (!result)
				await this.processHook(workflow, "damage");
			return true;
		});
	}
	static async createDefaultPlayList() {
		if (!game.user?.isGM)
			return;
		const playlistData = {
			"name": "Midi Item Tracks",
			"description": "Midi Qol sample custom sounds",
			"mode": -1,
			"sounds": [
				{
					"path": "modules/midi-qol-rotv/sounds/success-drums.ogg",
					"repeat": false,
					"volume": 0.125,
					"name": "success-drums",
					"playing": false,
					"streaming": false,
					"pausedTime": null,
					"sort": 0
				},
				{
					"name": "dice",
					"description": "",
					"path": "sounds/dice.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "drink",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/drink.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "fail1",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/fail1.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "fail2",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/fail2.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "good-results",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/good-results.ogg",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "spell",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/spell.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "success",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/success.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "swing",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/swing.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "use",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/use.wav",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "fail3",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/fail3.ogg",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				},
				{
					"name": "bowshot",
					"description": "",
					"path": "modules/midi-qol-rotv/sounds/bow-and-arrow.mp3",
					"playing": false,
					"pausedTime": null,
					"repeat": false,
					"volume": 0.5240467536394058,
					"sort": 0,
				}
			]
		};
		return Playlist.create(playlistData, {});
		// await game.packs.get("midi-qol-rotv.midiqol-sample-tracks")?.importAll({});
	}
	static async setupDetailedSounds() {
		const soundSettings = {
			version: "0.9.48",
			"any": {
				"all": {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "dice" },
						attack: { playlistName: "Midi Item Tracks", soundName: "dice" },
						damage: { playlistName: "Midi Item Tracks", soundName: "dice" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
					}
				},
				consumable: {
					ammo: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" }
					},
					food: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					poison: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					potion: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					rod: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					scroll: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					trinket: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" },
					},
					wand: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
				},
				weapon: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
					}
				},
				spell: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
					}
				},
				feat: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" }
					},
				},
				tool: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" }
					}
				}
			}
		};
		if (game.user?.can("SETTINGS_MODIFY"))
			await game.settings.set("midi-qol-rotv", "MidiSoundSettings", soundSettings);
	}
	static async setupFullSounds() {
		const soundSettings = {
			version: "0.9.48",
			"any": {
				"all": {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "dice" },
						attack: { playlistName: "Midi Item Tracks", soundName: "dice" },
						damage: { playlistName: "Midi Item Tracks", soundName: "dice" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						hit: { playlistName: "Midi Item Tracks", soundName: "none" },
						miss: { playlistName: "Midi Item Tracks", soundName: "none" },
						abil: { playlistName: "Midi Item Tracks", soundName: "dice" },
						heal: { playlistName: "Midi Item Tracks", soundName: "dice" },
						msak: { playlistName: "Midi Item Tracks", soundName: "dice" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "dice" },
						other: { playlistName: "Midi Item Tracks", soundName: "dice" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "dice" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "dice" },
						save: { playlistName: "Midi Item Tracks", soundName: "dice" },
						util: { playlistName: "Midi Item Tracks", soundName: "dice" },
						acid: { playlistName: "Midi Item Tracks", soundName: "dice" },
						bludgeoning: { playlistName: "Midi Item Tracks", soundName: "dice" },
						cold: { playlistName: "Midi Item Tracks", soundName: "dice" },
						fire: { playlistName: "Midi Item Tracks", soundName: "dice" },
						force: { playlistName: "Midi Item Tracks", soundName: "dice" },
						lightning: { playlistName: "Midi Item Tracks", soundName: "dice" },
						"midi-none": { playlistName: "Midi Item Tracks", soundName: "dice" },
						necrotic: { playlistName: "Midi Item Tracks", soundName: "dice" },
						piercing: { playlistName: "Midi Item Tracks", soundName: "dice" },
						poison: { playlistName: "Midi Item Tracks", soundName: "dice" },
						psychic: { playlistName: "Midi Item Tracks", soundName: "dice" },
						radiant: { playlistName: "Midi Item Tracks", soundName: "dice" },
						slashing: { playlistName: "Midi Item Tracks", soundName: "dice" },
						thunder: { playlistName: "Midi Item Tracks", soundName: "dice" },
					}
				},
				consumable: {
					ammo: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" }
					},
					food: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					poison: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					potion: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					rod: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					scroll: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					trinket: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" },
					},
					wand: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
				},
				weapon: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" },
						abil: { playlistName: "Midi Item Tracks", soundName: "swing" },
						heal: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						other: { playlistName: "Midi Item Tracks", soundName: "swing" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						save: { playlistName: "Midi Item Tracks", soundName: "swing" },
						util: { playlistName: "Midi Item Tracks", soundName: "swing" },
						damage: { playlistName: "Midi Item Tracks", soundName: "dice" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						hit: { playlistName: "Midi Item Tracks", soundName: "none" },
						miss: { playlistName: "Midi Item Tracks", soundName: "none" },
					}
				},
				spell: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
						abil: { playlistName: "Midi Item Tracks", soundName: "spell" },
						heal: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						other: { playlistName: "Midi Item Tracks", soundName: "spell" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						save: { playlistName: "Midi Item Tracks", soundName: "spell" },
						util: { playlistName: "Midi Item Tracks", soundName: "spell" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						hit: { playlistName: "Midi Item Tracks", soundName: "none" },
						miss: { playlistName: "Midi Item Tracks", soundName: "none" },
					}
				},
				feat: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" },
						abil: { playlistName: "Midi Item Tracks", soundName: "none" },
						heal: { playlistName: "Midi Item Tracks", soundName: "none" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						other: { playlistName: "Midi Item Tracks", soundName: "none" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						save: { playlistName: "Midi Item Tracks", soundName: "spell" },
						util: { playlistName: "Midi Item Tracks", soundName: "none" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						hit: { playlistName: "Midi Item Tracks", soundName: "none" },
						miss: { playlistName: "Midi Item Tracks", soundName: "none" },
					}
				},
				tool: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
					}
				}
			}
		};
		if (game.user?.can("SETTINGS_MODIFY"))
			await game.settings.set("midi-qol-rotv", "MidiSoundSettings", soundSettings);
	}
	static async setupBasicSounds() {
		const soundSettings = {
			version: "0.9.48",
			"any": {
				"all": {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "dice" },
						attack: { playlistName: "Midi Item Tracks", soundName: "dice" },
						damage: { playlistName: "Midi Item Tracks", soundName: "dice" },
						critical: { playlistName: "Midi Item Tracks", soundName: "success-drums" },
						fumble: { playlistName: "Midi Item Tracks", soundName: "fail1" },
						mwak: { playlistName: "Midi Item Tracks", soundName: "swing" },
						rwak: { playlistName: "Midi Item Tracks", soundName: "bowshot" },
						rsak: { playlistName: "Midi Item Tracks", soundName: "spell" },
						msak: { playlistName: "Midi Item Tracks", soundName: "spell" },
					}
				},
				consumable: {
					ammo: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "none" }
					},
					food: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					poison: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					potion: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "drink" },
					},
					rod: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					scroll: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
					trinket: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" },
					},
					wand: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "spell" },
					},
				},
				tool: {
					any: {
						itemRoll: { playlistName: "Midi Item Tracks", soundName: "use" }
					}
				}
			}
		};
		if (game.user?.can("SETTINGS_MODIFY"))
			await game.settings.set("midi-qol-rotv", "MidiSoundSettings", soundSettings);
	}
}
