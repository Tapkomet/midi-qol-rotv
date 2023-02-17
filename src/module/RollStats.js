import { gameStats } from "../midi-qol-rotv.js";
import { RollStatsDisplay } from "./apps/RollStatsDisplay.js";
import { timedExecuteAsGM } from "./GMAction.js";
import { configSettings } from "./settings.js";
function fetchStats() {
	gameStats.fetchStats();
	Hooks.call("midi-qol-rotv.StatsUpdated");
}
const blankStat = {
	numAttacks: 0,
	numAttack20: 0,
	numAttackFumble: 0,
	numAttackCritical: 0,
	numAttackMisses: 0,
	attackRollsDiceTotal: 0,
	attackRollTotal: 0,
	numD20Rolls: 0,
	numDamageRolls: 0,
	damageApplied: 0,
	damageTotal: 0
};
let blankStats = {
	session: duplicate(blankStat),
	lifetime: duplicate(blankStat),
	itemStats: {}
};
export class RollStats {
	constructor() {
		this.headerLine = `"Actor", "Item Name", "#Attacks", "# Nat20", "#Fumbles", "#Critical", "Attack Roll Dice Total", "Attack Roll Total", "Damage Rolls", "Total Damage Applied", "Damage Total"`;
		game.settings.register("midi-qol-rotv", "RollStats", {
			scope: "world",
			default: {},
			type: Object,
			config: false,
			onChange: fetchStats
		});
		//@ts-ignore
		this.currentStats = game.settings.get("midi-qol-rotv", "RollStats");
		this.rollCount = 0;
	}
	showStats() {
		new RollStatsDisplay(this, { playersOnly: configSettings.playerStatsOnly }).render(true);
	}
	getEntityStats(id, collection) {
		if (!this.currentStats[id]) {
			const entity = collection?.get(id);
			if (!entity)
				return null;
			if (entity instanceof CONFIG.Actor.documentClass && configSettings.playerStatsOnly && !entity.hasPlayerOwner)
				return null;
			if (entity instanceof User && configSettings.playerStatsOnly && entity.isGM)
				return null;
			this.currentStats[id] = duplicate(blankStats);
			this.currentStats[id].name = collection?.get(id)?.name;
		}
		else {
			this.currentStats[id] = mergeObject(this.currentStats[id], blankStats, { overwrite: false, inplace: true, insertKeys: true, insertValues: true });
		}
		return this.currentStats[id];
	}
	prepareStats() {
		const stats = duplicate(this.currentStats);
		Object.keys(stats).forEach(aid => {
			const actStats = stats[aid];
			const lifetime = actStats.lifetime;
			const session = actStats.session;
			lifetime.attackRollAverage = this.toPrecision(lifetime.attackRollTotal / (lifetime.numAttacks || 1), 1);
			session.attackRollAverage = this.toPrecision(session.attackRollTotal / (session.numAttacks || 1), 1);
			lifetime.damageTotalAverage = this.toPrecision(lifetime.damageTotal / (lifetime.numAttacks || 1), 1);
			session.damageTotalAverage = this.toPrecision(session.damageTotal / (session.numAttacks || 1), 1);
			lifetime.damageAppliedAverage = this.toPrecision(lifetime.damageApplied / (lifetime.numAttacks || 1), 1);
			session.damageAppliedAverage = this.toPrecision(session.damageApplied / (session.numAttacks || 1), 1);
			Object.keys(actStats.itemStats).forEach(iid => {
				const itemStats = actStats.itemStats[iid].session;
				itemStats.attackRollAverage = this.toPrecision(itemStats.attackRollTotal / (itemStats.numAttacks || 1), 1);
				itemStats.damageTotalAverage = this.toPrecision(itemStats.damageTotal / (itemStats.numAttacks || 1), 1);
				itemStats.damageAppliedAverage = this.toPrecision(itemStats.damageApplied / (itemStats.numAttacks || 1), 1);
			});
		});
		return stats;
	}
	getitemStats(item, id, collection) {
		if (!item)
			return duplicate(blankStat);
		let currentStats = this.getEntityStats(id, collection);
		if (!currentStats)
			return null;
		if (!currentStats.itemStats[item.name]) {
			currentStats.itemStats[item.name] = { name: item.name, session: duplicate(blankStat) };
		}
		return currentStats.itemStats[item.name];
	}
	async endSession() {
		if (!game.user?.isGM)
			return;
		Object.keys(this.currentStats).forEach(actorId => {
			this.currentStats[actorId].session = duplicate(blankStat);
			this.currentStats[actorId].itemStats = {};
		});
		await game.settings.set("midi-qol-rotv", "RollStats", this.currentStats);
	}
	async clearStats() {
		if (!game.user?.isGM)
			return;
		await game.settings.set("midi-qol-rotv", "RollStats", {});
	}
	async clearActorStats(actorId) {
		timedExecuteAsGM("removeStatsForActorId", {
			actorId: actorId
		});
	}
	GMremoveActorStats(actorId) {
		if (!game.user?.isGM)
			return;
		delete this.currentStats[actorId];
		game.settings.set("midi-qol-rotv", "RollStats", this.currentStats);
	}
	toPrecision(number, digits) {
		return Math.round(number * (10 ** digits)) / (10 ** digits);
	}
	get statData() {
		return this.prepareStats();
	}
	fetchStats() {
		//@ts-ignore
		this.currentStats = game.settings.get("midi-qol-rotv", "RollStats");
	}
	addDamage(appliedDamage, totalDamage, numTargets, item) {
		const actorStats = this.getEntityStats(item?.actor?.id, game.actors);
		if (!actorStats)
			return;
		let playerStats;
		if (item?.actor.testUserPermission(game.user, "OWNER")) {
			//@ts-ignore game.user.id
			playerStats = this.getEntityStats(game.user.id, game.users);
		}
		for (let stats of [actorStats, playerStats]) {
			if (!stats)
				continue;
			const session = stats.session;
			const lifetime = stats.lifetime;
			let itemStats;
			if (stats === actorStats)
				itemStats = this.getitemStats(item, item?.actor.id, game.actors).session;
			else
				//@ts-ignore
				itemStats = this.getitemStats(item, game.user.id, game.users).session;
			[session, lifetime, itemStats].forEach(stats => {
				stats.numDamageRolls += 1;
				stats.damageApplied += appliedDamage;
				stats.damageTotal += (totalDamage * numTargets);
				if (item && !item.hasAttack) { // no attack so count each use as an attack
					stats.numAttacks += 1;
				}
			});
		}
		this.updateEntity({ id: item.actor.id });
		//@ts-ignore
		if (playerStats)
			this.updateEntity({ id: game.user.id });
		Hooks.call("midi-qol-rotv.StatsUpdated");
	}
	addAttackRoll({ rawRoll, fumble, critical, total }, item) {
		const currentStats = this.getEntityStats(item.actor?.id, game.actors);
		if (!currentStats)
			return;
		let playerStats;
		if (item?.actor.testUserPermission(game.user, "OWNER")) {
			//@ts-ignore game.user.id
			playerStats = this.getEntityStats(game.user.id, game.users);
		}
		for (let stats of [currentStats, playerStats]) {
			if (!stats)
				continue;
			let itemStats;
			if (stats === currentStats)
				itemStats = this.getitemStats(item, item?.actor.id, game.actors).session;
			else
				//@ts-ignore
				itemStats = this.getitemStats(item, game.user.id, game.users).session;
			const session = stats.session;
			const lifetime = stats.lifetime;
			[session, lifetime, itemStats].forEach(stats => {
				stats.numAttacks += 1;
				if (rawRoll === 20)
					stats.numAttack20 += 1;
				if (critical)
					stats.numAttackCritical += 1;
				if (fumble)
					stats.numAttackFumble += 1;
				stats.attackRollsDiceTotal += rawRoll;
				stats.attackRollTotal += total;
			});
		}
		this.updateEntity({ id: item.actor.id });
		//@ts-ignore
		if (playerStats)
			this.updateEntity({ id: game.user.id });
		Hooks.call("midi-qol-rotv.StatsUpdated");
	}
	updateEntity({ id }) {
		timedExecuteAsGM("updateEntityStats", {
			id,
			currentStats: gameStats.currentStats[id]
		});
	}
	exportToJSON() {
		const data = this.currentStats;
		const filename = `fvtt-midi-qol-rotv-stats.json`;
		saveDataToFile(JSON.stringify(data, null, 2), "text/json", filename);
	}
	dumpStatLine(actorName, itemName, stats) {
		return `"${actorName}","${itemName}", ${stats.numAttacks || 0}, ${stats.numAttack20 || 0}, ${stats.numAttackFumble || 0}, ${stats.numAttackCritical || 0}, ${stats.attackRollsDiceTotal || 0}, ${stats.attackRollTotal || 0}, ${stats.numDamageRolls || 0}, ${stats.damageApplied || 0}, ${stats.damageTotal || 0}`;
	}
	exportToCSV() {
		let csvText = duplicate(this.headerLine) + "\n";
		for (let actorStats of Object.values(this.currentStats)) {
			csvText += this.dumpStatLine(actorStats.name, "life time", actorStats.lifetime) + "\n";
			csvText += this.dumpStatLine(actorStats.name, "Session", actorStats.session) + "\n";
			for (let itemStat of Object.values(actorStats.itemStats)) {
				const theStats = itemStat;
				csvText += this.dumpStatLine(actorStats.name, theStats.name, theStats.session) + "\n";
			}
		}
		const filename = `fvtt-midi-qol-rotv-stats.csv`;
		saveDataToFile(csvText, "text/json", filename);
	}
	async GMupdateEntity({ id, currentStats }) {
		if (!id)
			return;
		this.currentStats[id] = currentStats;
		this.rollCount = (this.rollCount + 1) % Math.max(1, configSettings.saveStatsEvery);
		if (this.rollCount === 0) {
			await game.settings.set("midi-qol-rotv", "RollStats", this.currentStats);
		}
	}
}
RollStats.saveInterval = 1;
