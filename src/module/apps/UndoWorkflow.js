import { i18n } from "../../midi-qol-rotv.js";
import { configSettings } from "../settings.js";
import { removeMostRecentWorkflow, undoDataQueue, undoMostRecentWorkflow } from "../undo.js";
export class UndoWorkflow extends FormApplication {
	async _updateObject() {
	}
	;
	constructor(object, options = {}) {
		super(object, options);
		this.undoAddedHookId = Hooks.on("midi-qol-rotv.addUndoEntry", this.render.bind(this));
		this.undoRemvoedHookId = Hooks.on("midi-qol-rotv.removeUndoEntry", this.render.bind(this));
		if (!configSettings.undoWorkflow) {
			configSettings.undoWorkflow = true;
			game.settings.set("midi-qol-rotv", "ConfigSettings", configSettings);
			ui.notifications?.warn("Undo Workflow enabled");
		}
	}
	async getData(options) {
		const data = await super.getData(options);
		data.entries = [];
		data.queueSize = new TextEncoder().encode(JSON.stringify(undoDataQueue)).length.toLocaleString();
		data.queueCount = undoDataQueue.length;
		for (let undoEntry of undoDataQueue) {
			const entry = {};
			entry.actorName = undoEntry.actorName;
			entry.itemName = undoEntry.itemName;
			entry.userName = undoEntry.userName;
			entry.targets = [];
			for (let targetEntry of undoEntry.allTargets) {
				entry.targets.push(targetEntry);
			}
			data.entries.push(entry);
		}
		return data;
	}
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("midi-qol-rotv.UndoWorkflow.title"),
			template: "modules/midi-qol-rotv/templates/undo-workflow.html",
			id: "midi-qol-rotv-undo-workflow",
			width: "400",
			height: "700",
			resizable: true,
		});
	}
	get title() {
		return i18n("midi-qol-rotv.UndoWorkflow.title");
	}
	async close(options = {}) {
		Hooks.off("midi-qol-rotv.addUndoEntry", this.undoAddedHookId);
		Hooks.off("midi-qol-rotv.removeUndoEntry", this.undoRemvoedHookId);
		return super.close(options);
	}
	activateListeners(html) {
		super.activateListeners(html);
		html.find(`#undo-first-workflow`).on("click", (e) => {
			undoMostRecentWorkflow();
		});
		html.find(`#remove-first-workflow`).on("click", (e) => {
			removeMostRecentWorkflow();
		});
	}
}
export function showUndoWorkflowApp() {
	if (game.user?.isGM) {
		new UndoWorkflow({}).render(true, { focus: true });
	}
	else {
		ui.notifications?.warn("midi-qol-rotv.UndowWorkflow.GMOnly");
	}
}