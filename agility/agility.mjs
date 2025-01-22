const { settings, characterStorage, patch } = mod.getContext(import.meta);

let Util = null;
let EasyTool = null;
let LevelUpFormula = null;

export class AgilityCheatManager{
	levelFormula = null;
	mulFormula = null;
	levelData = null;
	actionDataMap = null;
	builtActions = null;

	constructor(lF,mulF){
		this.levelFormula = lF;
		this.mulFormula = mulF;
		this.actionDataMap = new Map();
	}

	async init(ctx){
		Util = mod.api.BGSCheat.Util;
		EasyTool = mod.api.BGSCheat.EasyTool;
		LevelUpFormula = mod.api.BGSCheat.LevelUpFormula;
		this.levelData = await ctx.loadData("agility/data.json");
		await this.addCheatObstacles(ctx);

		await ctx.patch(Agility, 'addMasteryXP').after((ret, action, mount)=>{
			if (action.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
				return;
			this.testAction(action);

			let category = 0;
			let xmount = mount / 10;

			if (action.realm.id === "melvorD:Melvor" && action.category >= 10){
					category = 1;
					xmount = mount / 5;
			} else
				xmount = mount / 12;

			let pillar = game.agility.pillars.find(x => x.isBuilt == true && x.realm.id == action.realm.id && x.category == category);
			if (pillar == null || pillar.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
				return;
			let xp = this.getMasteryXP(pillar) + xmount >> 0;
			this.setPillarMasteryXP(pillar, xp);
			this.testAction(pillar);
		});

		await ctx.patch(Agility, 'destroyObstacle').before((tier) => {
			this.builtActions = game.agility.actions.filter(x => x.category == tier && x.isBuilt);
		});
		await ctx.patch(Agility, 'destroyObstacle').after((ret, tier) => {
			if ((this.builtActions?.length ?? 0) == 0)
				return;
			let nowActions = game.agility.actions.filter(x => x.category == tier && x.isBuilt);
			nowActions.forEach(x => {
				let i = this.builtActions.findIndex(x);
				if (i == -1)
					return;
				this.builtActions.splice(i, 1);
			});
			this.downLevelForDestroy(false);
		});

		await ctx.patch(Agility, 'buildObstacle').before((action) => {
			if (action.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
				return;
			this.builtActions = game.agility.actions.filter(x => x.isBuilt && x.category == action.category && x.realm.id == action.realm.id && x.id.indexOf("BGSCheat:") == 0);
		});

		await ctx.patch(Agility, 'buildObstacle').after((ret, action) => {
			this.downLevelForDestroy(false);
		});

		await ctx.patch(Agility, 'destroyPillar').before((tier) => {
			this.builtActions = game.agility.pillars.filter(x => x.category == tier && x.isBuilt);
		});
		await ctx.patch(Agility, 'destroyPillar').after((ret, tier) => {
			if ((this.builtActions?.length ?? 0) == 0)
				return;
			let nowActions = game.agility.pillars.filter(x => x.category == tier && x.isBuilt);
			nowActions.forEach(x => {
				let i = this.builtActions.findIndex(x);
				if (i == -1)
					return;
				this.builtActions.splice(i, 1);
			});
			this.downLevelForDestroy(true);
		});

		await ctx.patch(Agility, 'buildPillar').before((action) => {
			if (action.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
				return;
			this.builtActions = game.agility.pillars.filter(x => x.isBuilt && x.category == action.category && x.realm.id == action.realm.id && x.id.indexOf("BGSCheat:")==0);
		});

		await ctx.patch(Agility, 'buildPillar').after((ret, action) => {
			this.downLevelForDestroy(true);
		});
	}

	async initCharacter(){
		await this.updateAgility();
	}
	
	async addCheatObstacles(ctx){
		await ctx.gameData.addPackage('agility/obstacle.json');
		if (cloudManager.hasTotHEntitlementAndIsEnabled)
			await ctx.gameData.addPackage('agility/obstacleTotH.json');
		if (cloudManager.hasItAEntitlementAndIsEnabled)
			await ctx.gameData.addPackage('agility/obstacleITA.json');
	}

	updateCheatObstacle(isPillar, realmID, category) {
		let actions = null;
		if (isPillar)
			actions = game.agility.pillars.filter(x => x.realm.id == realmID && x.category == category);
		else
			actions = game.agility.actions.filter(x => x.realm.id == realmID && x.category == category);
		if (actions == null)
			return;

		let action = actions.find(x => x.id.indexOf("BGSCheat:") == 0);
		if (action == null)
			return;

		let name = "";
		let skillRequiments = [];
		let itemCosts = [];
		let currencyCosts = [];
		let itemRewards = [];
		let currencyRewards = [];
		let baseInterval = 0;
		let baseExperience = 0;
		let baseAbyssalExperience = 0;
		let modifiers = new ModifierTable();
		let enemyModifiers = new ModifierTable();
		let combatEffects = [];
		let _a;
		actions.forEach(x => {
			const data = this.getData(action);
			const lv = data.lv;
			const mul = 1 + this.mulFormula(lv);

			if (x == action)
				return;
			if (name == "")
				name = x.name;
			else
				name = name + " & " + x.name;
			x.skillRequirements?.forEach(y => {
				if (_a = skillRequiments.find(z => z.skill.id == y.skill.id)) {
					if (_a.level < y.level)
						_a.level = y.level;
				}
				else
					skillRequiments.push(Object.assign({}, y));
			});
			x.itemCosts?.forEach(y => {
				if (_a = itemCosts.find(z => z.item.id == y.item.id))
					_a.quantity += (y.quantity * mul) >> 0;
				else {
					let v = Object.assign({}, y);
					itemCosts.push(v);
					v.quantity *= mul;
				}
			});
			x.currencyCosts?.forEach(y => {
				if (_a = currencyCosts.find(z => z.currency.id == y.currency.id))
					_a.quantity += (y.quantity * mul) >> 0;
				else {
					let v = Object.assign({}, y);
					currencyCosts.push(v);
					v.quantity *= mul;
				}
			});
			x.itemRewards?.forEach(y => {
				if (_a = itemRewards.find(z => z.item.id == y.item.id))
					_a.quantity += y.quantity;
				else {
					let v = Object.assign({}, y);
					itemRewards.push(v);
				}
			});
			x.currencyRewards?.forEach(y => {
				if (_a = currencyRewards.find(z => z.currency.id == y.currency.id))
					_a.quantity += y.quantity;
				else {
					let v = Object.assign({}, y);
					currencyRewards.push(v);
				}
			});
			if (isPillar == false) {
				baseInterval += x.baseExperience;
				baseExperience += x.baseExperience;
				baseAbyssalExperience += x.baseAbyssalExperience;
			}
			if (x.modifiers) modifiers.addModifiers(x, x.modifiers.filter(y => y.value != 0 && !y.isNegative), 0, 1);
			if (x.enemyModifiers) enemyModifiers.addModifiers(x, x.modifiers.filter(y => y.value != 0 && !y.isNegative), 0, 1);
			if (x.combatEffects) combatEffects.push(...x.combatEffects);
		});
		action._name = name == "" ? "Empty" : name;
		action.skillRequiments = skillRequiments;
		action.itemCosts = itemCosts;
		action.currencyCosts = currencyCosts;
		if (isPillar == false) {
			action.itemRewards = itemRewards;
			action.currencyRewards = currencyRewards;
			action.baseInterval = baseInterval;
			action.baseExperience = baseExperience;
			action.baseAbyssalExperience = baseAbyssalExperience;
		}
		action.modifiers = modifiers.toCondensedValues();
		action.enemyModifiers = enemyModifiers.toCondensedValues();
		action.combatEffects = combatEffects;
	}

	updateAllCheatActions(){
		for (let m = 0; m < 15; ++m)
			this.updateCheatObstacle(false, "melvorD:Melvor", m);
		for (let m = 0; m < 12; ++m)
			this.updateCheatObstacle(false, "melvorItA:Abyssal", m);
	}

	updateAllCheatPillars(){
		this.updateCheatObstacle(true, "melvorD:Melvor", 0);
		this.updateCheatObstacle(true, "melvorD:Melvor", 1);
		this.updateCheatObstacle(true, "melvorItA:Abyssal", 0);
	}

	loadData(id) {
		let v = characterStorage.getItem(id) ?? null;
		if (v == null) {
			v = {};
			characterStorage.setItem(id, v);
		}
		return v;
	}

	saveData(id, xp) {
		let v = this.loadData(id);
		if (v == null)
			return;
		if (xp) {
			if (Util.isNumber(xp))
				v.xp = xp >> 0;
			else
				delete v.xp;
		}
		characterStorage.setItem(id, v);
	}

	getData(action) {
		let data = this.actionDataMap.get(action.id) ?? null;
		if (data == null) {
			data = {};
			data.lv = 0;
			data.name = action?.name??null;
			this.actionDataMap.set(action.id, data);
		}
		return data;
	}

	setData(action, lv) {
		const isPillar = (action instanceof AgilityPillar);
		let data = this.getData(action);
		if (data == null)
			return;
		data.lv = lv;
		if (data.name && action.localID) {
			let newName = `${data.name} Lv${lv}`;
			if (isPillar)
				loadedLangJson[`AGILITY_PILLAR_NAME_${action.localID}`] = newName;
			else
				loadedLangJson[`AGILITY_OBSTACLE_NAME_${action.localID}`] = newName;
		}
		this.actionDataMap.set(action.id, data);
	}

	getMasteryXP(action) {
		const isPillar = (action instanceof AgilityPillar);
		if (isPillar) {
			let v = this.loadData(action.id);
			return v?.xp ?? 0;
		}
		else
			return game.agility.getMasteryXP(action);
	}

	setMasteryXP(action, xp) {
		const isPillar = (action instanceof AgilityPillar);
		if (isPillar)
			this.setPillarMasteryXP(action, xp);
		else {
			let nxp = game.agility.getMasteryXP(action);
			game.agility.addMasteryXP(action, xp - nxp);
		}
	}

	setPillarMasteryXP(action, xp) {
		const isPillar = (action instanceof AgilityPillar);
		if (isPillar)
			this.saveData(action.id, xp);
	}

	levelUpAgility(action, updateCheat) {
		const lv = this.levelFormula.testLevel(this.getMasteryXP(action));
		const mul = this.mulFormula(lv);

		let data = this.levelData[action.id];
		if (data == null)
			return;

		const isPillar = (action instanceof AgilityPillar);
		const recipe = isPillar ? game.agility.pillars.getObjectByID(action.id):game.agility.actions.getObjectByID(action.id);
		let modData = {};
		modData.id = action.id;
		data?.removeItemRewards?.forEach(x => {
			if (modData.itemRewards == null)
				modData.itemRewards = {};
			if (modData.itemRewards.remove == null)
				modData.itemRewards.remove = [];
			modData.itemRewards.remove.push(x);
		});
		data?.itemRewards?.forEach(x => {
			if (modData.itemRewards == null)
				modData.itemRewards = {};
			if (modData.itemRewards.add == null)
				modData.itemRewards.add = [];
			let v = {};
			v.id = x.id;
			v.quantity = Util.calcValue(x.quantity, 0x1002, lv, mul);
			modData.itemRewards.add.push(v);
		});
		data?.removeCurrencyRewards?.forEach(x => {
			if (modData.currencyRewards == null)
				modData.currencyRewards = {};
			if (modData.currencyRewards.remove == null)
				modData.currencyRewards.remove = [];
			modData.currencyRewards.remove.push(x);
		});
		data?.currencyRewards?.forEach(x => {
			if (modData.currencyRewards == null)
				modData.currencyRewards = {};
			if (modData.currencyRewards.add == null)
				modData.currencyRewards.add = [];
			let v = {};
			v.id = x.id;
			v.quantity = Util.calcValue(x.quantity, 0x1002, lv, mul);
			modData.currencyRewards.add.push(v);
		});

		Object.entries(data).forEach(x => {
			if (x[0] == "itemRewards" || x[0] == "currencyRewards" || x[0] == "removeItemRewards" || x[0] == "removeCurrencyRewards")
				return;
			EasyTool.addEasyValue(recipe, modData, x[0], x[1], lv, mul);
		});

		recipe.applyDataModification(modData,game);

		this.setData(action, lv);

		if (updateCheat)
			this.updateCheatObstacle(isPillar, action.realm.id, action.category);
	}

	downAction(action) {
		if (action.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
			return;
		const isPillar = (action instanceof AgilityPillar);
		let xp = this.getMasteryXP(action);
		let lv = this.levelFormula.testLevel(xp);
		if (lv == 20)
			return;
		const toLv = lv == 10 ? 10 : (lv > 0 ? lv - 1 : lv);
		const toXp = Math.max(this.levelFormula.getLevelTotalXp(toLv), isPillar ? 0 : 13034431);
		if (xp <= toXp)
			return;
		this.setMasteryXP(action, toXp);
		this.levelUpAgility(action, false, false);
	}

	testAction(action, updateCheat = true, checkRun = true){
		if (action.id.indexOf("BGSCheat:") == 0)	//Don't handle myself action.
			return;
		const xp = this.getMasteryXP(action);
		const data = this.getData(action);
		const lv = data.lv;
		const upXp = this.levelFormula.getLevelTotalXp(lv + 1) ?? 0;
		if (upXp == 0 || xp < upXp)
			return false;

		let restart = checkRun && game.agility.isActive;
		if (restart)
			game.agility.stop();
		this.levelUpAgility(action, updateCheat);
		if (checkRun) {
			game.agility.renderQueue.obstacleModifiers = true;
			game.agility.onObstacleChange();
		}
		if (restart)
			game.agility.start();
	}

	reformulaAgility() {
		game.agility.actions.forEach(x => {
			if (x.id.indexOf("BGSCheat:") == 0)
				return;
			this.setData(x, 0);
		});

		game.agility.pillars.forEach(x => {
			if (x.id.indexOf("BGSCheat:") == 0)
				return;
			this.setData(x, 0);
		});
		this.updateAgility();
	}

	updateAgility() {
		let restart = game.agility.isActive;
		if (restart)
			game.agility.stop();
		game.agility.actions.forEach(x => this.testAction(x, false, false));
		game.agility.pillars.forEach(x => this.testAction(x, false, false));
		this.updateAllCheatActions();
		this.updateAllCheatPillars();
		game.agility.renderQueue.obstacleModifiers = true;
		game.agility.onObstacleChange();
		if (restart)
			game.agility.start();
	}

	downLevelForDestroy(isPillar) {
		if (this.builtActions == null)
			return;
		let groups = isPillar ? game.agility.pillars : game.agility.actions;
		this.builtActions.forEach(x => {
			if (x.id.indexOf("BGSCheat:") != 0)
				return;
			let actions = groups.filter(y => y.category == x.category && y.realm.id == x.realm.id);
			actions?.forEach(y => { this.downAction(y) });
			this.updateCheatObstacle(isPillar, x.realm.id, x.category);
		});
		this.builtActions = null;
		game.agility.renderQueue.obstacleModifiers = true;
		game.agility.onObstacleChange();
	}
}


