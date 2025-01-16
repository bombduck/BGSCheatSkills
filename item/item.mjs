
let Util = null;
let LevelUpFormula = null;
let EasyTool = null;







export class ItemLevelManager{
	levelData;
	itemDataMap;
	
	constructor(){
		this.levelData = null
		this.itemDataMap = new Map();
	}

	async init(ctx, path){
		this.levelData = await ctx.loadData(path);
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
			return;
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

	getCurrentEquipmentStat(item, data) {
		data.base = [];
		let _a = data.base;
		if (item.equipmentStats) {
			let s = item.equipmentStats;
			_a.push(s.find(x => x?.key === "attackSpeed")?.value ?? 0);
			_a.push(s.find(x => x?.key === "stabAttackBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "slashAttackBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "blockAttackBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "rangedAttackBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "magicAttackBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "meleeStrengthBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "rangedStrengthBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "magicDamageBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "meleeDefenceBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "rangedDefenceBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "magicDefenceBonus")?.value ?? 0);
			_a.push(s.find(x => x?.key === "resistance" && x?.damageType?.id==="melvorD:Normal")?.value ?? 0);
			_a.push(s.find(x => x?.key === "resistance" && x?.damageType?.id==="melvorItA:Abyssal")?.value ?? 0);
			_a.push(s.find(x => x?.key === "resistance" && x?.damageType?.id==="melvorF:Pure")?.value ?? 0);
			_a.push(s.find(x => x?.key === "resistance" && x?.damageType?.id==="melvorItA:Eternal")?.value ?? 0);
			_a.push(s.find(x => x?.key === "summoningMaxhit" && x?.damageType?.id==="melvorD:Normal")?.value ?? 0);
			_a.push(s.find(x => x?.key === "summoningMaxhit" && x?.damageType?.id==="melvorItA:Abyssal")?.value ?? 0);
			_a.push(s.find(x => x?.key === "summoningMaxhit" && x?.damageType?.id==="melvorF:Pure")?.value ?? 0);
			_a.push(s.find(x => x?.key === "summoningMaxhit" && x?.damageType?.id==="melvorItA:Eternal")?.value ?? 0);
		}
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
		this.getLevelUpData(statObject, modData ,itemID,modBase,lv,mul);
		//if (itemID === "melvorF:Air_Acolyte_Wizard_Hat")
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

	constructor(lF, mulF){
		this.levelFormula = lF;
		this.actionLevelMap = new Map();
		this.itemManager = null;
		this.skillObject = null;
		this.mulFormula = mulF;
	}

	async init(ctx, skillClass, skillObject, itemPath, skillPath){
		Util = mod.api.BGSCheat.Util;
		EasyTool = mod.api.BGSCheat.EasyTool;
		LevelUpFormula = mod.api.BGSCheat.LevelUpFormula;
		this.itemManager = await new ItemLevelManager();
		await this.itemManager.init(ctx,itemPath);
		this.levelData = await ctx.loadData(skillPath);
		this.skillObject = skillObject;
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
		data.forEach(x=>this.itemManager.levelUp(x,lv,mul));
		this.actionLevelMap.set(action.id,lv);
	}

	testAction(action){
		const xp = this.skillObject.getMasteryXP(action);
		const lv = this.actionLevelMap.get(action.id) ?? 0;
		const upXp = this.levelFormula.getLevelTotalXp(lv + 1) ?? 0;
		if (upXp == 0 || xp < upXp)
			return false;
		this.levelUpItem(action);
	}
}



