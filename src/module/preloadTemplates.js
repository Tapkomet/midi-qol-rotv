export async function preloadTemplates() {
	const templatePaths = [
		// Add paths to "modules/midi-qol-rotv/templates" - TODO check these
		"modules/midi-qol-rotv/templates/saves.html",
		"modules/midi-qol-rotv/templates/hits.html",
		"modules/midi-qol-rotv/templates/item-card.html",
		"modules/midi-qol-rotv/templates/tool-card.html",
		"modules/midi-qol-rotv/templates/config.html",
		"modules/midi-qol-rotv/templates/damage-results.html",
		"modules/midi-qol-rotv/templates/roll-stats.html",
		"modules/midi-qol-rotv/templates/damage-results-player.html",
		"modules/midi-qol-rotv/templates/lateTargeting.html",
		// "modules/midi-qol-rotv/templates/midiProperties.html"
		"modules/midi-qol-rotv/templates/sound-config.html",
		"modules/midi-qol-rotv/templates/rollAlternate.html",
		"modules/midi-qol-rotv/templates/actorOnUseMacrosConfig.html",
	];
	return loadTemplates(templatePaths);
}
