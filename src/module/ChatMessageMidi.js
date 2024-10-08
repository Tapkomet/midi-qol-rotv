import { GameSystemConfig, MQDamageRollTypes, debugEnabled, i18n, log, warn } from "../midi-qol-rotv.js";
import { chatDamageButtons } from "./chatMessageHandling.js";
import { setDamageRollMinTerms } from "./itemhandling.js";
import { addChatDamageButtons, configSettings, safeGetGameSetting } from "./settings.js";
export function defineChatMessageMidiClass(baseClass) {
	return class ChatMessageMidi extends baseClass /*globalThis.rotv.documents.ChatMessageRotV*/ {
		constructor(...args) {
			super(...args);
			if (debugEnabled > 1)
				log("Chat message midi constructor", ...args);
		}
		// midi has it's own target handling so don't display the attack targets here
		_enrichAttackTargets(html) {
			return;
		}
		get canSelectTargets() {
			if (this.flags.rotv?.roll?.type !== "midi")
				return super.canSelectTargets;
			return this.isRoll && this.isContentVisible;
		}
		get canApplyDamage() {
			const type = this.flags.rotv?.roll?.type;
			if (type !== "midi")
				return super.canApplyDamage;
			return this.isRoll && this.isContentVisible && !!canvas?.tokens?.controlled.length;
		}
		/**
	* Apply rolled dice damage to the token or tokens which are currently controlled.
	* This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
	*
	* @param {HTMLElement} li      The chat entry which contains the roll data
	* @param {number} multiplier   A damage multiplier to apply to the rolled damage.
	* @returns {Promise}
	*/
		applyChatCardDamage(li, multiplier) {
			const type = this.flags.rotv?.roll?.type;
			if (type !== "midi")
				return super.applyChatCardDamage(li, multiplier);
			const rollsToCheck = this.rolls.filter(r => MQDamageRollTypes.includes(foundry.utils.getProperty(r, "options.midi-qol-rotv.rollType"))); //@ts-expect-error
			const damages = game.system.dice.aggregateDamageRolls(rollsToCheck, { respectProperties: true }).map(roll => ({
				value: roll.total,
				type: roll.options.type,
				properties: new Set(roll.options.properties ?? [])
			}));
			if (canvas?.tokens) {
				return Promise.all(canvas.tokens.controlled.map(t => {
					//@ts-expect-error
					return t.actor?.applyDamage(damages, { multiplier, invertHealing: false, ignore: true });
				}));
			}
		}
		collectRolls(rollsToAccumulate, multiRolls = false) {
			let returns = [];
			let rolls = [];
			setDamageRollMinTerms(rollsToAccumulate);
			for (let i = 0; i < rollsToAccumulate.length; i++) {
				if (!multiRolls && i < rollsToAccumulate.length - 1) {
					continue;
				}
				else if (multiRolls)
					rolls = [rollsToAccumulate[i]];
				else
					rolls = rollsToAccumulate;
				//@ts-expect-error
				let { formula, total, breakdown } = game.system.dice.aggregateDamageRolls(rolls).reduce((obj, r) => {
					obj.formula.push(r.formula);
					obj.total += r.total;
					this._aggregateDamageRoll(r, obj.breakdown);
					return obj;
				}, { formula: [], total: 0, breakdown: {} });
				formula = formula.join(" ");
				formula = formula.replace(/^\s+\+\s+/, "");
				formula = formula.replaceAll(/  /g, " ");
				if (multiRolls) {
					foundry.utils.setProperty(rolls[0], "flags.midi-qol-rotv.breakdown", breakdown);
					foundry.utils.setProperty(rolls[0], "flags.midi-qol-rotv.total", total);
				}
				let formulaInToolTip = ["formula", "formulaadv"].includes(configSettings.rollAlternate);
				let hideDetails = this.user.isGM && !game.user?.isGM && (configSettings.hideRollDetails ?? "none") !== "none";
				let hideFormula = this.user.isGM && !game.user?.isGM && (configSettings.hideRollDetails ?? "none") !== "none";
				if (this.user.isGM && !game.user?.isGM && (configSettings.hideRollDetails ?? "none") !== "none") {
					switch (configSettings.hideRollDetails) {
						case "none":
							break;
						case "detailsDSN":
							break;
						case "details":
							break;
						case "d20Only":
							break;
						case "hitDamage":
							break;
						case "hitCriticalDamage":
							break;
						case "attackTotalOnly":
						case "d20AttackOnly":
							total = "Damage Roll";
							break;
						case "all":
							total = "Damage Roll";
							break;
					}
				}
				const roll = document.createElement("div");
				roll.classList.add("dice-roll");
				let tooltipContents = "";
				//@ts-expect-error
				if (!hideDetails)
					tooltipContents = Object.entries(breakdown).reduce((str, [type, { total, constant, dice }]) => {
						const config = GameSystemConfig.damageTypes[type] ?? GameSystemConfig.healingTypes[type];
						return `${str}
			<section class="tooltip-part">
				<div class="dice">
				<ol class="dice-rolls">
					${dice.reduce((str, { result, classes }) => `
					${str}<li class="roll ${classes}">${result}</li>
					`, "")}
					${constant ? `
					<li class="constant"><span class="sign">${constant < 0 ? "-" : "+"}</span>${Math.abs(constant)}</li>
					` : ""}
				</ol>
				<div class="total">
					${config ? `<img src="${config.icon}" alt="${config.label}">` : ""}
					<span class="label">${config?.label ?? ""}</span>
					<span class="value">${total}</span>
				</div>
				</div>
			</section>
			`;
					}, "");
				let diceFormula = "";
				if (!hideFormula)
					diceFormula = `<div class="dice-formula">${formula}</div>`;
				roll.innerHTML = `
	<div class="dice-result">
	${formulaInToolTip ? "" : diceFormula}
		<div class="dice-tooltip-collapser">
		<div class="dice-tooltip">
			${formulaInToolTip ? diceFormula : ""}
			${tooltipContents}
		</div>
		</div>
		<h4 class="dice-total">${total}</h4>
	</div>
	`;
				returns.push(roll);
			}
			return returns;
		}
		_enrichDamageTooltip(rolls, html) {
			if (!configSettings.mergeCard) {
				return super._enrichDamageTooltip(rolls, html);
			}
			if (foundry.utils.getProperty(this, "flags.rotv.roll.type") !== "midi")
				return;
			for (let rollType of MQDamageRollTypes) {
				const rollsToCheck = this.rolls.filter(r => foundry.utils.getProperty(r, "options.midi-qol-rotv.rollType") === rollType);
				let rType = "damage";
				if (rollType === "otherDamage")
					rType = "other-damage";
				else if (rollType === "bonusDamage")
					rType = "bonus-damage";
				if (rollsToCheck?.length) {
					html.querySelectorAll(`.midi-${rType}-roll`)?.forEach(el => el.remove());
					for (let roll of this.collectRolls(rollsToCheck, configSettings.mergeCardMultiDamage)) {
						roll.classList.add(`midi-${rType}-roll`);
						if (rType === "bonus-damage") {
							const flavor = document.createElement("div");
							const flavors = rollsToCheck.map(r => r.options.flavor ?? r.options.type);
							const bonusDamageFlavor = flavors.join(", ");
							flavor.classList.add("midi-bonus-damage-flavor");
							flavor.innerHTML = bonusDamageFlavor;
							html.querySelector(`.midi-qol-rotv-${rType}-roll`)?.appendChild(flavor);
						}
						html.querySelector(`.midi-qol-rotv-${rType}-roll`)?.appendChild(roll);
						if ((configSettings.hideRollDetails ?? "none") !== "none" && !game.user?.isGM && this.user.isGM) {
							html.querySelectorAll(".dice-roll").forEach(el => el.addEventListener("click", this.noDiceClicks.bind(this)));
						}
					}
				}
			}
			if (game.user?.isGM && configSettings.v3DamageApplication) {
				const shouldAddButtons = addChatDamageButtons === "both"
					|| (addChatDamageButtons === "gm" && game.user?.isGM)
					|| (addChatDamageButtons === "pc" && !game.user?.isGM);
				if (shouldAddButtons) {
					for (let dType of MQDamageRollTypes) {
						rolls = this.rolls.filter(r => foundry.utils.getProperty(r, "options.midi-qol-rotv.rollType") === dType);
						if (!rolls.length)
							continue;
						let damageApplication = document.createElement("damage-application");
						damageApplication.classList.add("rotv2");
						//@ts-expect-error
						damageApplication.damages = game.system.dice.aggregateDamageRolls(rolls, { respectProperties: true }).map(roll => ({
							value: roll.total,
							type: roll.options.type,
							properties: new Set(roll.options.properties ?? [])
						}));
						//@ts-expect-error
						foundry.utils.setProperty(damageApplication.damages, "flags.midi-qol-rotv.damageType", dType);
						html.querySelector(".message-content").appendChild(damageApplication);
					}
				}
			}
		}
		_highlightCriticalSuccessFailure(html) {
			if (this.getFlag("rotv", "roll.type") !== "midi")
				return super._highlightCriticalSuccessFailure(html);
			if (!this.isContentVisible || !this.rolls.length)
				return;
			const originatingMessage = game.messages?.get(this.getFlag("rotv", "originatingMessage")) ?? this;
			//@ts-expect-error
			const displayChallenge = originatingMessage?.shouldDisplayChallenge;
			const displayAttackResult = game.user?.isGM || (safeGetGameSetting("rotv", "attackRollVisibility") !== "none");
			/**
			* Create an icon to indicate success or failure.
			* @param {string} cls  The icon class.
			* @returns {HTMLElement}
			*/
			function makeIcon(cls) {
				const icon = document.createElement("i");
				icon.classList.add("fas", cls);
				icon.setAttribute("inert", "");
				return icon;
			}
			// Highlight rolls where the first part is a d20 roll
			for (let [index, d20Roll] of this.rolls.entries()) {
				const d0 = d20Roll.dice[0];
				if ((d0?.faces !== 20) || (d0?.values.length !== 1))
					continue;
				//@ts-expect-error
				d20Roll = game.system.dice.D20Roll.fromRoll(d20Roll);
				const d = d20Roll.dice[0];
				const isModifiedRoll = ("success" in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
				if (isModifiedRoll)
					continue;
				// Highlight successes and failures
				const total = html.find(".dice-total")[index];
				if (!total)
					continue;
				// Only attack rolls and death saves can crit or fumble.
				const canCrit = ["attack", "death"].includes(this.getFlag("rotv", "roll.type")) || ["attack"].includes(foundry.utils.getProperty(d20Roll, "options.midi-qol-rotv.rollType"));
				const isAttack = (this.getFlag("rotv", "roll.type") === "attack") || ["attack"].includes(foundry.utils.getProperty(d20Roll, "options.midi-qol-rotv.rollType"));
				const showResult = isAttack ? displayAttackResult : displayChallenge;
				/*if (d.options.target && showResult) {
					if (d20Roll.total >= d.options.target)
						total.classList.add("success");
					else
						total.classList.add("failure");
				}*/
				if (canCrit && d20Roll.isCritical)
					total.classList.add("critical");
				//if (canCrit && d20Roll.isFumble)
				//	total.classList.add("fumble");
				const icons = document.createElement("div");
				icons.classList.add("icons");
				if (total.classList.contains("critical"))
					icons.append(makeIcon("fa-check-double"));
				/*else if (total.classList.contains("fumble"))
					icons.append(makeIcon("fa-xmark"), makeIcon("fa-xmark"));
				else if (total.classList.contains("success"))
					icons.append(makeIcon("fa-check"));
				else if (total.classList.contains("failure"))
					icons.append(makeIcon("fa-xmark"));*/
				if (icons.children.length)
					total.append(icons);
			}
		}
		enrichAttackRolls(html) {
			if (!this.user.isGM || game.user?.isGM)
				return;
			const hitFlag = foundry.utils.getProperty(this, "flags.midi-qol-rotv.isHit");
			const hitString = hitFlag === undefined ? "" : hitFlag ? i18n("midi-qol-rotv.hits") : i18n("midi-qol-rotv.misses");
			let attackRollText;
			let removeFormula = (configSettings.hideRollDetails ?? "none") !== "none";
			switch (configSettings.hideRollDetails) {
				case "none":
					break;
				case "detailsDSN":
					break;
				case "details":
					break;
				case "d20Only":
					attackRollText = `(d20) ${this.rolls[0]?.terms[0].total ?? "--"}`;
					break;
				case "hitDamage":
					html.querySelectorAll(".midi-qol-rotv-attack-roll .dice-total")?.forEach(el => el.classList.remove("critical"));
					html.querySelectorAll(".midi-qol-rotv-attack-roll .dice-total")?.forEach(el => el.classList.remove("fumble"));
					attackRollText = hitString;
					break;
				case "hitCriticalDamage":
					attackRollText = hitString;
					break;
				case "attackTotalOnly":
					attackRollText = this.rolls[0]?.total ?? "--";
					break;
				case "d20AttackOnly":
					attackRollText = `(d20) ${this.rolls[0]?.terms[0].total ?? "--"}`;
					break;
				case "all":
					html.querySelectorAll(".midi-qol-rotv-attack-roll .dice-total")?.forEach(el => el.classList.remove("critical"));
					html.querySelectorAll(".midi-qol-rotv-attack-roll .dice-total")?.forEach(el => el.classList.remove("fumble"));
					attackRollText = "Attack Roll";
					break;
			}
			if (attackRollText)
				html.querySelectorAll(".midi-attack-roll .dice-total")?.forEach(el => el.innerHTML = attackRollText);
			if (this.user.isGM && !game.user?.isGM && removeFormula) {
				html.querySelectorAll(".midi-attack-roll .dice-formula")?.forEach(el => el.remove());
				html.querySelectorAll(".midi-attack-roll .dice-tooltip")?.forEach(el => el.remove());
				html.querySelectorAll(".dice-roll").forEach(el => el.addEventListener("click", this.noDiceClicks.bind(this)));
			}
		}
		_enrichChatCard(html) {
			if (!foundry.utils.getProperty(this, "flags.rotv.roll"))
				return super._enrichChatCard(html);
			if ((foundry.utils.getProperty(this, "flags.midi-qol-rotv.roll")?.length > 0) && foundry.utils.getProperty(this, "flags.rotv.roll.type") !== "midi") {
				this.rolls = foundry.utils.getProperty(this, "flags.midi-qol-rotv.roll");
				super._enrichChatCard(html);
				html.querySelectorAll(".dice-tooltip").forEach(el => el.style.height = "0");
				chatDamageButtons(this, html, {});
				return; // Old form midi chat card tht causes rotv to throw errors
			}
			if (foundry.utils.getProperty(this, "flags.rotv.roll.type") !== "midi") {
				super._enrichChatCard(html);
				chatDamageButtons(this, html, {});
				return;
			}
			if (debugEnabled > 1)
				warn("Enriching chat card", this.id);
			this.enrichAttackRolls(html); // This has to run first to stop errors when ChatMessageRotV._enrichDamageTooltip runs
			super._enrichChatCard(html);
			if (this.user.isGM && (configSettings.hideRollDetails ?? "none") !== "none" && !game.user?.isGM) {
				html.querySelectorAll(".dice-roll").forEach(el => el.addEventListener("click", this.noDiceClicks.bind(this)));
				html.querySelectorAll(".dice-tooltip").forEach(el => el.style.height = "0");
			}
			chatDamageButtons(this, html, {});
		}
		noDiceClicks(event) {
			event.stopImmediatePropagation();
			return;
		}
	};
}
