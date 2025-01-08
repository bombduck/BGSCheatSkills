
let Util = null;
let EasyTool = null;
let LevelUpFormula = null;

export class AstrologyCheatManager {
	levelFormula = null;
	actionDataMap = null;
	levelData = null;
	mulFormula = null;

	constructor(lF, mulF){
		this.levelFormula = lF;
		this.actionDataMap = new Map();
		this.levelData = null;
		this.mulFormula = mulF;
	}

	async init(ctx){
		Util = mod.api.BGSCheat.Util;
		EasyTool = mod.api.BGSCheat.EasyTool;
		LevelUpFormula = mod.api.BGSCheat.LevelUpFormula;
		this.levelData = await ctx.loadData("astrology/data.json");
		await ctx.patch(Astrology, 'addMasteryXP').after((ret, action, mount)=> {
			this.testAction(action);
		});
	}

	async initCharacter(){
		const itemStardust = await game.items.getObjectSafe("melvorF:Stardust");
		const itemGoldenStardust = await game.items.getObjectSafe("melvorF:Golden_Stardust");
		const itemAbyssal_Stardust = await game.items.getObjectSafe("melvorItA:Abyssal_Stardust");

		await this.updateAstrology();
	}

	updateAstrology(){
		game.astrology.actions.forEach(x=>this.levelUpAstrology(x));
		game.astrology.computeProvidedStats(true);
		game.astrology.renderQueue.rerollCosts = true;
	}

	generateModificationData(modifier, modData, lv, mul, unique) {
		let v = {};
		v.index = modData.index;
		const oldCount = modifier.maxCount;
		let count = 0;
		if (modData.maxCount)
			count = (Util.calcValue(modData.maxCount, 0x1000, lv, mul) >> 0);
		else {
			if (unique)
				count = 5 + (lv < 11 ? (lv / 2) >> 0 : lv < 20 ? (lv - 10) * 5 + 5 : 65);
			else
				count = 8 + (lv < 11 ? lv : lv < 20 ? (lv - 10) * 8 + 10 : 92);
		}
		let costs = null;
		let maxCount = Math.max(count, oldCount);
		if (modData.costs) {
			if (typeof(modData.costs) == "string") {
				let func = Util.getFunction(modData.costs);
				if (func)
					costs = Array.from({ length: maxCount }, (v, i) => func(i + 1));
			}
			else if (Util.isNumber(modData.costs))
				costs = Array.from({ length: maxCount }, (v, i) => modData.costs * 2 ** i);
		}
		if (count > oldCount) {
			v.maxCount = count;
			if (costs == null)
				costs = Array.from({ length: maxCount }, (v, i) => modifier.costs[0].quantity * 2 ** i);
		}
		if (costs) {
			let len = modifier.costs.length;
			v.costs = {};
			v.costs.modify = Array.from(costs.slice(0, len), (x, i) => Object({ "index": i, "value": x }));
			if (maxCount > len)
				v.costs.add = costs.slice(len);
		}
		Object.entries(modData).forEach(x => {
			if (x[0] == "index" || x[0] == "maxCount" || x[0] == "costs")
				return;
			EasyTool.addEasyValue(modifier, v, x[0], x[1], lv, mul);
		});
		return v;
	}

	getData(id) {
		const recipe = game.astrology.actions.getObjectByID(id);
		if (recipe == null)
			return null;
		let data = this.actionDataMap.get(id) ?? null;
		if (data == null) {
			data = {};
			data.lv = 0;
			data.name = recipe?.name??null;
			data.localID = recipe?.localID??null;
			this.actionDataMap.set(id, data);
		}
		return data;
	}

	setData(id, lv) {
		let data = this.getData(id);
		if (data == null)
			return;
		data.lv = lv;
		if (data.name && data.localID) {
			let newName = `${data.name} Lv${lv}`;
			loadedLangJson[`ASTROLOGY_NAME_${data.localID}`] = newName;
		}
		this.actionDataMap.set(id, data);
	}

	levelUpAstrology(action, nLv=0){
		const lv = this.levelFormula.testLevel(game.astrology.getMasteryXP(action));
		const mul = this.mulFormula(lv);
		if (nLv>=lv)
			return;

		let data = this.levelData[action.id];
		if (data == null)
			return;

		const recipe = game.astrology.actions.getObjectByID(action.id);
		if (recipe == null)
			return;

		let modData = {};
		modData.id = action.id;
		modData.standardModifiers = [];
		modData.uniqueModifiers = [];
		modData.abyssalModifiers = [];
		let _a;
		data?.standardModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.standardModifiers[i]) == null)
				return;
			modData.standardModifiers.push(this.generateModificationData(_a, x, lv, mul, false));
		});

		data?.uniqueModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.uniqueModifiers[i]) == null)
				return;
			modData.uniqueModifiers.push(this.generateModificationData(_a, x, lv, mul, true));
		});

		data?.abyssalModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.abyssalModifiers[i]) == null)
				return;
			modData.abyssalModifiers.push(this.generateModificationData(_a, x, lv, mul, false));
		});

		recipe.applyDataModification(modData, game);
		data?.standardModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.standardModifiers[i]) == null)
				return;
			game.astrology.queueModifierRender(recipe, AstrologyModifierType.Standard, i);
			astrologyMenus.explorePanel.setStandardUpgradeCost(game.astrology, recipe, i);
		});

		data?.uniqueModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.uniqueModifiers[i]) == null)
				return;
			game.astrology.queueModifierRender(action, AstrologyModifierType.Unique, i);
			astrologyMenus.explorePanel.setUniqueUpgradeCost(game.astrology, action, i);
		});

		data?.abyssalModifiers?.forEach(x => {
			const i = x.index;
			if ((_a = recipe.abyssalModifiers[i]) == null)
				return;
			game.astrology.queueModifierRender(action, AstrologyModifierType.Abyssal, i);
			astrologyMenus.explorePanel.setAbyssalUpgradeCost(game.astrology, action, i);
		});

		this.setData(action.id, lv);
		game.astrology.computeProvidedStats(true);
		game.astrology.renderQueue.rerollCosts = true;
	}

	testAction(action){
		const xp = game.astrology.getMasteryXP(action);
		const data = this.getData(action.id);
		const lv = data.lv;
		const upXp = this.levelFormula.getLevelTotalXp(lv + 1) ?? 0;
		if (upXp == 0 || xp < upXp)
			return false;
		this.levelUpAstrology(action,lv);
		game.astrology.computeProvidedStats(true);
		game.astrology.renderQueue.rerollCosts = true;
	}
}



