
let Util = null;
let LevelUpFormula = null;
let EasyTool = null;







export class ItemLevelManager{
	levelData;
	itemDataMap;
	commonData;
	
	constructor(){
		this.levelData = null
		this.itemDataMap = new Map();
	}

	async init(ctx, path, commonData){
		this.levelData = await ctx.loadData(path);
		this.commonData = commonData;
	}

	getLevelUpData(item,modData,itemID,base,lv,mul){
		let k = itemID;
		let extraMul = 1;
		if (k[0] >= '0' && k[0] <= '9') {
			let d = 1;
			while ((k[d] >= '0' && k[d] <= '9') || k[d] == '.')
				++d;
			extraMul = Number(k.slice(0, d));
			k = k.slice(d);
		}
		let data = this.levelData[k];
		if (!data)
			data = this.commonData[k];
		if (!data) {
			console.log("No such item or base: " + itemID);
			return;
		}
		let _a = data;
		if (_a.base instanceof Array)
			_a.base.forEach(x => { this.getLevelUpData(item, modData, x, base, lv, mul); });
		else if (typeof (_a.base) == "string")
			this.getLevelUpData(item, modData,_a.base,base,lv, mul);

		Object.entries(_a).forEach(x => {
			if (x[0] == "base")
				return;
			EasyTool.addEasyValue(item, modData, x[0], x[1], lv, mul, base, extraMul);
		});
	}

	getLevelUpDataForSummoningSynergy(statObject, modData, lv, mul) {
		const _s = statObject.summons;
		if (!(_s instanceof Array) || _s.length < 2 || typeof(_s[0].id) != "string" || typeof(_s[1].id) != "string") {
			console.log("statObject is not accepatible" );
			return;
		}
		let key = _s[0].id + "&" + _s[1].id;
		let data = this.levelData[key];
		if (!data) {
			key = _s[1].id + "&" + _s[0].id;
			data = this.levelData[key];
		}
		if (!data) {
			console.log("No such synergy data: (" + _s[0].id + "," + _s[1].id + ")");
			return;
		}
		let _a = data;
		if (_a.base instanceof Array)
			_a.base.forEach(x => { this.getLevelUpData(statObject, modData, x, null, lv, mul); });
		else if (typeof (_a.base) == "string")
			this.getLevelUpData(statObject, modData,_a.base,null,lv, mul);

		Object.entries(_a).forEach(x => {
			if (x[0] == "base")
				return;
			EasyTool.addEasyValue(statObject, modData, x[0], x[1], lv, mul, null, 1);
		});
	}

	levelUp(itemID,lv,mul){
		let item=game.items.find(i=>i.id===itemID);
		if (item == null)
			console.log("Can't find item: " + itemID);
		let itemData = this.itemDataMap.get(itemID) ?? null;
		if (itemData == null) {
			itemData = {};
			itemData.lv = 0;
			itemData.name = item?.name ?? null;
			if (item.equipmentStats)
				Util.getCurrentEquipmentStat(item, itemData);
		}
		if (itemID === "melvorF:Summoning_Familiar_Golbin_Thief")
			console.log(JSON.stringify(itemData));
		this.updateItemName(itemID, itemData.name, lv);
		let modData = {};
		let modBase = null;
		if (itemData.base instanceof Array) {
			modBase = Array.from(itemData.base);
			for (let m = 0; m < modBase.length; ++m) {
				if (modBase[m] < 0)
					modBase[m] = 0;
			}
		}
		let statObject = item;
		if (item instanceof PotionItem)
			statObject = item.stats;
		this.getLevelUpData(statObject, modData ,itemID, modBase, lv, mul);
		//if (itemID === "melvorD:Bronze_Dagger")
		//	console.log(JSON.stringify(modData));
		item.applyDataModification(modData, game);
		delete item._modifiedDescription;
		delete item._customDescription;
		itemData.lv = lv;
		this.itemDataMap.set(itemID, itemData);
	}

	updateItemName(itemID, oldName, lv){
		if (oldName == null)
			return;
		let item=game.items.find(i=>i.id===itemID);
		if (item==null)
			return;
		let newName = `${oldName} Lv${lv}`;
		if (item.isModded)
			item._name = newName;
		else
			loadedLangJson[`ITEM_NAME_${item.localID}`] = newName;
	}
}




export class SkillCheatManager{
	levelFormula = null;
	levelData = null;
	itemManager = null;
	skillObject = null;
	mulFormula = null;
	actionDataMap = null;

	constructor(lF, mulF){
		this.levelFormula = lF;
		this.actionLevelMap = new Map();
		this.itemManager = null;
		this.skillObject = null;
		this.mulFormula = mulF;
	}

	async init(ctx, skillClass, skillObject, itemPath, skillPath, commonData){
		Util = mod.api.BGSCheat.Util;
		EasyTool = mod.api.BGSCheat.EasyTool;
		LevelUpFormula = mod.api.BGSCheat.LevelUpFormula;
		this.itemManager = await new ItemLevelManager();
		await this.itemManager.init(ctx,itemPath, commonData);
		this.levelData = await ctx.loadData(skillPath);
		this.skillObject = skillObject;
		if (this.skillObject == game.archaeology)
			this.actionDataMap = new Map();
		await ctx.patch(skillClass, 'addMasteryXP').after((ret, action, mount)=> {
			this.testAction(action);
		});
	}

	async initCharacter(){
		await this.updateItems();
	}

	updateItems(){
		this.skillObject.actions.forEach(x=>this.levelUpItem(x));
	}

	levelUpItem(action){
		let data = this.levelData[action.id];
		if (data == null)
			return;
		const lv = this.levelFormula.testLevel(this.skillObject.getMasteryXP(action));
		const mul = this.mulFormula(lv);
		if (lv > 0)
			data.forEach(x=>this.itemManager.levelUp(x,lv,mul));
		this.actionLevelMap.set(action.id,lv);
		if (lv > 0) {
			if (this.skillObject == game.archaeology)
				this.setArchaelogyData(action.id, lv);
			if (this.skillObject == game.summoning)
				this.updateSummoningSynergies(action.id, lv, mul);
			const ns = game.registeredNamespaces.getNamespace("BGSCheat");
			game.registerGameData(ns, {});
		}
	}

	testAction(action){
		const xp = this.skillObject.getMasteryXP(action);
		const lv = this.actionLevelMap.get(action.id) ?? 0;
		const upXp = this.levelFormula.getLevelTotalXp(lv + 1) ?? 0;
		if (upXp == 0 || xp < upXp)
			return false;
		this.levelUpItem(action);
	}

	getArchaelogyData(id) {
		const recipe = game.archaeology.actions.getObjectByID(id);
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

	setArchaelogyData(id, lv) {
		let data = this.getArchaelogyData(id);
		if (data == null)
			return;
		data.lv = lv;
		if (data.name && data.localID) {
			let newName = `${data.name} Lv${lv}`;
			loadedLangJson[`POI_NAME_Melvor_${data.localID}`] = newName;
		}
		this.actionDataMap.set(id, data);
	}

	updateSummoningSynergies(id, lv, mul) {
		game.summoning.synergies.forEach(x => {
			if (!(x.summons instanceof Array))
				return;
			if (x.summons.find(y => y.id == id) == null)
				return;
			const _a = x.summons.find(y => y.id != id);
			if (!_a) return;
			const tlv = this.actionLevelMap.get(_a.id) ?? 0;
			if (tlv == 0) return;
			this.updateSummoningSynergy(x, Math.min(lv, tlv), mul);
		});
	}

	updateSummoningSynergy(statObject, lv, mul) {
		if (!(statObject.summons instanceof Array))
			return;
		let modData = {};
		this.itemManager.getLevelUpDataForSummoningSynergy(statObject, modData, lv, mul);
		if (statObject.summons[0].id == "melvorF:GolbinThief" && statObject.summons[1].id == "melvorF:Dragon")
			console.log("Synergies mod data: " + JSON.stringify(modData));
		Util.applyStatObjectDataModification(statObject, modData, game);
	}
}



