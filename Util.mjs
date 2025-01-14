let attackData = null;

function isNumber(value){
	return typeof value === 'number' && isFinite(value);
}

export class SingleFormula{
	mul;
	addToLv;
	powerLv;
	base;
	mulBasePower;
	addToBasePowerLv

	constructor(m = 1, aLv = 0, pLv = 1, b = 1, mP = 0, aPLv = 0){
		this.set(m, aLv, pLv, b, mP, aPLv);
	}

	set(m = 1, aLv = 0, pLv = 1, b = 1, mP = 0, aPLv = 0){
		this.mul = isNumber(m) ? m : 1;
		this.addToLv = isNumber(aLv) ? aLv : 0;
		this.powerLv = isNumber(pLv) ? pLv : 1;
		this.base = isNumber(b) ? b : 1;
		this.mulBasePower = isNumber(mP) ? mP : 0;
		this.addToBasePowerLv = isNumber(aPLv) ? aPLv : 0;
	}

	cal(lv, lxp = 0, lsxp = 0){
		if (this.mul == 0)
			return 0;
		let v = lv + this.addToLv;
		let c = this.mul * (this.powerLv == 0 ? 1 : (this.powerLv == 1 ? v : Math.pow(v, this.powerLv)));

		v = lv + this.addToBasePowerLv;
		if (this.base == 1 || this.mulBasePower == 0 || v == 0)
			return c;
		else
			return c * Math.pow(this.base, this.mulBasePower * v);
	}
}

export class SumFormulas{
	formulas;
	constructor(){
		this.formulas = [];
	}
	cleanFormula(){
		this.formulas = [];
	}
	pushOneFormula(v){
		if (!(v instanceof Array))
			return false;
		if (v.length > 6)
			this.formulas.push(new SingleFormula(...v.slice(0,6)));
		else
			this.formulas.push(new SingleFormula(...v));
		return true;
	}
	setFormulas(v){
		if (!(v instanceof Array))
			return false;
		this.cleanFormula();
		for (let m = 0; m < v.length; ++m){
			if (this.pushOneFormula(v[m]) == false)
				return false;
		}
		return true;
	}

	push(m = 1, aLv = 0, pLv = 1, b = 1, mP = 0, aPLv = 0){
		this.formulas.push(new SingleFormula(m, aLv, pLv, b, mP, aPLv));
	}

	cal(lv, lxp=0, lsxp=0){
		if (this.formulas.length == 0)
			return NaN;
		let sum = 0;
		this.formulas.forEach(f=>{ sum += f.cal(lv, lxp, lsxp); });
		return sum;
	}
}

export class StringFormula{
	formula;
	
	constructor(){
		this.formula = null;
	}

	set(f){
		try{
			this.formula = new Function("lv", "lxp", "lsxp", f);
		}
		catch(e){
			this.formula = null;
			console.log(e);
		}
	}

	cal(lv, lxp=0, lsxp=0){
		if (this.formula == null)
			return NaN;
		let ret = 0;
		try{
			ret = this.formula(lv, lxp, lsxp);
		}
		catch(e){
			ret = NaN;
			console.log(e);
		}
		return ret;
	}
}

export class LevelUpFormula{
	tableUpValues;
	tableTotalUpValues;
	formula;

	constructor(){
		this.tableUpValues = [];
		this.tableTotalUpValues = [];
		this.formula = null;
	}
	
	cleanFormula(){
		this.formula = null;
	}

	addFormula(m = 1, aLv = 0, pLv = 1, b = 1, mP = 0, aPLv = 0){
		if (this.formula == null)
			this.formula = new SumFormulas();
		if (!(this.formula instanceof SumFormulas))
			return false;
		this.formula.push(m, aLv, pLv, b, mP, aPLv);
		return true;
	}

	setSumFormulas(v){
		if (this.formula == null)
			this.formula = new SumFormulas();
		if (!(this.formula instanceof SumFormulas))
			return false;
		return this.formula.setFormulas(v);
	}

	setStringFormula(f){
		if (this.formula == null)
			this.formula = new StringFormula();
		if (!(this.formula instanceof StringFormula))
			return false;
		this.formula.set(f);
		return true;
	}

	calcTables(maxLevel){
		if (maxLevel < 1)
			return false;
		if (this.formula == null) {
			defaultTables(maxLevel);
			return false;
		}
		
		this.tableUpValues = new Array(maxLevel).fill(0);
		this.tableTotalUpValues = new Array(maxLevel).fill(0);

		for (let m = 0; m < maxLevel; ++m){
			let lv = m + 1;
			let lxp = (m == 0) ? 0 : this.tableUpValues[m - 1];
			let lsxp = (m == 0) ? 0 : this.tableTotalUpValues[m - 1];
			let xp = this.formula.cal(lv, lxp, lsxp);
			if (isNumber(xp) == false) {
				this.defaultTables(maxLevel);
				return false;
			}
			xp = Math.ceil(xp);
			this.tableUpValues[m] = xp;
			this.tableTotalUpValues[m] = m == 0 ? xp : this.tableTotalUpValues[m - 1] + xp;
		}
		return true;
	}

	setTable(table, maxLevel=-1){
		if (table.length == 0)
			return;
		let len = maxLevel > 0 ? maxLevel : table.length;
		let t = Array.from({length:len}, (v,m)=>(m>=table.length ? table[table.length-1]:table[m]));
		this.tableTotalUpValues = new Array(t.length);
		this.tableTotalUpValues[0] = t[0];
		for (let m = 1; m < table.length; ++m)
		{
			this.tableTotalUpValues[m] = this.tableTotalUpValues[m-1] + t[m];
		}
		this.tableUpValues = t;
	}

	cleanTable(){
		this.tableUpValues = [];
		this.tableTotalUpValues = [];
	}

	defaultTables(maxLevel){
		this.setTable(new Array(maxLevel).fill(1), maxLevel);
	}

	testLevel(xp){
		if (this.tableTotalUpValues.length == 0)
			return -1;
		for (let m = 0; m < this.tableTotalUpValues.length; ++m) {
			if (xp < this.tableTotalUpValues[m])
				return m;
		}
		return this.tableTotalUpValues.length;
	}

	getLevelTotalXp(level){
		if (this.tableTotalUpValues.length === 0 || level <= 0 || level > this.tableTotalUpValues.length)
			return 0;
		return this.tableTotalUpValues[level - 1];
	}

	getToNextLevel(level){
		if (this.tableUpValues === 0 || level < 0 || level >= this.tableUpValues.length)
			return 0;
		return this.tableUpValues[level];
	}
}

export class Util {
	static mapFunctions = new Map();

	static isNumber(value) {
		return isNumber(value);
   }

	static getFunction(f) {
		let formula = this.mapFunctions.get(f);
		if (formula != undefined) {
			return formula;
		}

		try{
			formula = new Function("lv", f);
		}
		catch(e){
			console.log(e);
			return null;
		}
		this.mapFunctions.set(f,formula);
		return formula;
	}

	static calcFormulaValue(formula, lv) {
		if (isNumber(lv) == false)
			return undefined;
		let f;
		if (f = this.getFunction(formula)) {
			return f(lv);
		}
		return undefined;
	}

	static calcObjectValue(value, lv, mul, extraMul) {
		let v = 0;
		if (typeof (value.f) == "string")			//formula first
			v = this.calcFormulaValue(value.f, lv);
		else {
			if (isNumber(value.c))
				v += value.c;
			if (isNumber(value.v) && isNumber(lv))
				v += (value.v * lv);
			if (isNumber(value.u) && isNumber(mul))
				v += (value.u * mul);
			if (isNumber(value.o) && isNumber(mul))
				v += (value.o * (mul + 1));
		}

		if (isNumber(extraMul) && extraMul != 0)
			v *= extraMul;

		if (isNumber(value.m) && v < value.m)
			v = value.m;
		if (isNumber(value.M) && v > value.M)
			v = value.M;
		if (value.i) v = (v >> 0);

		return v;
	}

	static calcValue(modValue, type, lv, mul, extraMul = 1) {
		if (modValue === undefined)
			return undefined;
		let _a = modValue;
		let v = {};

		if (isNumber(_a)) {
			if ((type & 0x0FFF) == 1) v.v = _a;
			else if ((type & 0x0FFF) == 2) v.u = _a;
			else if ((type & 0x0FFF) == 3) v.o = _a;
			else v.c = _a;
		}
		else if (typeof (_a) == "string") {
			v.f = _a;
		}
		else if (_a instanceof Array) {
			if (typeof (_a[0]) == "string") {
				v.f = _a[0];
				if (isNumber(_a[1]))
					v.m = _a[1];
				if (isNumber(_a[2]))
					v.M = _a[2];
				if (_a[3] !== undefined)
					v.i = _a[3];
			}
			else {
				if (isNumber(_a[0]))
					v.c = _a[0];
				if (isNumber(_a[1]))
					v.v = _a[1];
				if (isNumber(_a[2]))
					v.u = _a[2];
				if (isNumber(_a[3]))
					v.m = _a[3];
				if (isNumber(_a[4]))
					v.M = _a[4];
				if (_a[5] !== undefined)
					v.i = _a[5];
			}
		}
		else {
			if (isNumber(_a.f)) {
				if ((type & 0x0FFF) == 1) v.v = _a.f;
				else if ((type & 0x0FFF) == 2) v.u = _a.f;
				else v.c = _a.f;
			}
			else if (typeof (_a.f) == "string")
				v.f = _a.f;
			else {
				if (_a.c !== undefined) v.c = _a.c;
				if (_a.v !== undefined) v.v = _a.v;
				if (_a.u !== undefined) v.u = _a.u;
				if (_a.o !== undefined) v.o = _a.o;
			}
			if (_a.m !== undefined) v.m = _a.m;
			if (_a.M !== undefined) v.M = _a.M;
			if (_a.i !== undefined) v.i = _a.i;
		}
		if (v.i === undefined && (type & 0x1000) != 0)
			v.i = true;
		return this.calcObjectValue(v, lv, mul, extraMul);
	}

	static equalModifierScopeData(l,r){
		if (l.skillID!==r.skillID)
			return false;
		if (l.damageTypeID!==r.damageTypeID)
			return false;
		if (l.realmID!==r.realmID)
			return false;
		if (l.currencyID!==r.currencyID)
			return false;
		if (l.actionID!==r.actionID)
			return false;
		if (l.subcategoryID!==r.subcategoryID)
			return false;
		if (l.itemID!==r.itemID)
			return false;
		if (l.effectGroupID!==r.effectGroupID)
			return false;
		return true;
	}
	
	static parseModifierScopeData(modifier,data){
		if (modifier.skill) data.skillID=modifier.skill.id;
		if (modifier.damageType) data.damageTypeID=modifier.damageType.id;
		if (modifier.realm) data.realmID=modifier.realm.id;
		if (modifier.currency) data.currencyID=modifier.currency.id;
		if (modifier.category) data.categoryID=modifier.category.id;
		if (modifier.action) data.actionID=modifier.action.id;	
		if (modifier.subcategory) data.subcategoryID=modifier.subcategory.id;
		if (modifier.item) data.itemID=modifier.item.id;
		if (modifier.effectGroup) data.effectGroupID=modifier.effectGroup.id;
		return data;
	}

	static parseModifiers(modifiers) {
		let ret = {};
		modifiers.forEach(m => {
			if (ret[m.id] === undefined)
				ret[m.id] = [];
			let data = {};
			data.value = m.value;
			this.parseModifierScopeData(m, data);
			ret[m.id].push(data);
		});
		return ret;
	}

	static parseConditionData(c) {
		let data = {};
		if (c.type) data.type = c.type;
		if (c.operator) data.operator = c.operator;
		if (c.value !== undefined) data.value = c.value;
		if (c.inverted !== undefined) data.inverted = c.inverted;
		if (c.thisAttackType) data.thisAttackType = c.thisAttackType;
		if (c.targetAttackType) data.targetAttackType = c.targetAttackType;
		if (c.damageType) data.damageTypeID = c.damageType.id;
		if (c.group) data.groupID = c.group.id;
		if (c.effect) data.effectID = c.effect.id;
		if (c.character) data.character = c.character;
		if (c.item) data.itemID = c.item.id;
		if (c.recipe) data.recipeID = c.recipe.id;
		if (c.statKey !== undefined) data.statKey = c.statKey;
		if (c.lhValue !== undefined) data.lhValue = c.lhValue;
		if (c.rhValue !== undefined) data.rhValue = c.rhValue;
		if (c.conditions) {
			data.conditions = [];
			c.conditions?.forEach(x => {
				data.push(this.parseConditionData(x));
			});
		}

		return data;
	}

	static parseConditionalModifier(cm) {
		let data = {};
		data.condition = cm.parseConditionData(cm.condition);
		if (cm.modifiers) data.modifiers = this.parseModifiers(cm.modifiers);
		if (cm.enemyModifiers) data.enemyModifiers = this.parseModifiers(cm.enemyModifiers);
		if (cm.isNegative !== undefined) data.isNegative = cm.isNegative;
		if (cm._descriptionLang) data.descriptionLang = cm._descriptionLang;
		if (cm.description) data.description = cm.description;
		return data;
	}

	static copyModifierScope(l, r) {
		if (r.skillID) l.skillID = r.skillID;
		if (r.damageTypeID) l.damageTypeID = r.damageTypeID;
		if (r.realmID) l.realmID = r.realmID;
		if (r.currencyID) l.currencyID = r.currencyID;
		if (r.categoryID) l.categoryID = r.categoryID;
		if (r.actionID) l.actionID = r.actionID;
		if (r.subcategoryID) l.subcategoryID = r.subcategoryID;
		if (r.itemID) l.itemID = r.itemID;
		if (r.effectGroupID) l.effectGroupID = r.effectGroupID;
	}

	static addModifierData(modifiers, data, key, value, type, lv, mul, extraMul = 1) {
		let isValue = false;
		if (!(value instanceof Array)) {
			if (isNumber(value) || typeof (value) == "string")
				isValue = true;
			else
				return;
		}
		else {
			if (isNumber(value[0]) || typeof (value[0]) == "string" || (value[0] instanceof Array))
				isValue = true;
		}
		if (data[key] === undefined)
			data[key] = [];

		let _a = data[key];
		let _v = isValue ? [{ "value": value }] : value;
		_v?.forEach(x => {
			let cv = this.calcValue(x.value, type, lv, mul, extraMul);
			if (cv === undefined)
				return;

			let i = _a.findIndex(y => this.equalModifierScopeData(y, x));
			let v = null;
			if (i == -1) {
				if (cv == 0)
					return;
				v = {};
				this.copyModifierScope(v, x);
				_a.push(v);
			}
			else if (cv == 0) {
				_a.splice(i, 1);
				return;
			}
			else
				v = _a[i];
			v.value = cv;
		});
	}

	static addModifierModificationData(modifiers, data, key, value, type, lv, mul, extraMul = 1) {
		if (data.add == null)
			data.add = {};
		this.addModifierData(modifiers, data.add, key, value, type, lv, mul, extraMul);
	}

	static removeModifierModificationData(modifiers, data, key) {
		if (data.remove == null)
			data.remove = [];
		let _a = data.remove;
		if (_a.findIndex(x => x == key) == -1)
			_a.push(key);
		if (_a = data.add) {
			delete _a[key];
		}
	}

	static addModifiersData(modifiers, data, modData, type, lv, mul, extraMul = 1) {
		Object.entries(modData).forEach(x => {
			this.addModifierData(modifiers, data, x[0], x[1], type, lv, mul, extraMul);
		});
	}

	static updateModifiersModificationData(modifiers, data, modData, type, lv, mul, extraMul = 1) {
		if (modData.remove) {
			modData.forEach(x => {
				this.removeModifierModificationData(modifiers, data, x);
			});
		}
		if (modData.add) {
			Object.entries(modData.add).forEach(x => {
				this.addModifierModificationData(modifiers, data, x[0], x[1], type, lv, mul, extraMul);
			});
		}
	}

	static newConditionalModiferData(modData, type, lv, mul, extraMul = 1) {
		let data = {};
		data.condition = modData.condition;
		if (modData.isNegative !== undefined) data.isNegative = modData.isNegative;
		if (modData.modifiers) {
			data.modifiers = {};
			this.addModifiersData(null, data.modifiers, modData.modifiers, type, lv, mul, extraMul);
		}
		if (modData.enemyModifiers) {
			data.enemyModifiers = {};
			this.addModifiersData(null, data.enemyModifiers, modData.enemyModifiers, type, lv, mul, extraMul);
		}
		if (modData.descriptionLang) data.descriptionLang = modData.descriptionLang;
		if (modData.description) data.description = modData.description;
		return data;
	}

	static equalCombatEffect(l,r){
		if (l.tableID!==r.tableID)
			return false;
		if (l.effectID!==r.effectID)
			return false;
		if (l.targetOverride!==r.targetOverride)
			return false;
		if (l.appliesWhen!==r.appliesWhen)
			return false;
		if (l.bypassBarrier!==r.bypassBarrier)
			return false;
		return true;
	}

	static parseCombatEffect(effect){
		let ret={};
		if (effect.table!==undefined)
			ret.tableID=effect.table.id;
		else
			ret.effectID=effect.effect.id;
		ret.chance = effect.baseChance;
		if (effect.conditionChances) {
			ret.conditions = [];
			effect.conditionChances.forEach(x => {
				let v = {};
				v.chance = x.chance;
				v.condition = this.parseConditionData(x.condition);
				ret.conditions.push(v);
			});
		}
		ret.bypassBarrier=effect.bypassBarrier;
		ret.targetOverride=effect.targetOverride;
		ret.appliesWhen=effect.appliesWhen;
		ret.applyEffectWhenMerged=effect.applyEffectWhenMerged;
		ret.isNegative=effect.isNegative;
		if (effect.initialParams)
			ret.initialParams = effect.initialParams;
		if (effect._customDescription) ret.customDescription = effect._customDescription;
		if (effect._descriptionLang) ret.descriptionLang = effect._descriptionLang;
		return ret;
	}

	static addCombatEffecData(effects, data, modData, type, lv, mul, extraMul = 1) {
		let i = data.findIndex(x => this.equalCombatEffect(x, modData));
		let v = null;
		if (i == -1) {
			v = {};
			v.appliesWhen = modData.appliesWhen;
			if (modData.effectID) v.effectID = modData.effectID;
			if (modData.tableID) v.tableID = modData.tableID;
			if (modData.targetOverride) v.targetOverride = modData.targetOverride;
			if (modData.bypassBarrier !== undefined) v.bypassBarrier = modData.bypassBarrier;
			data.push(v);
		}
		else
			v = data[i];

		if (modData.chance === undefined)
			delete v.chance;
		else {
			v.chance = this.calcValue(modData.chance, type | 0x1000, lv, mul) >> 0;
			if (v.chance > 100)
				v.chance = 100;
		}


		if (modData.condition === undefined)
			delete v.condition;
		else
			v.condition = modData.condition;

		if (modData.initialParams === undefined)
			delete v.initialParams;
		else {
			v.initialParams = [];
			modData.initialParams?.forEach(x => {
				let term = {};
				term.name = x.name;
				term.value = this.calcValue(x.value, type, lv, mul, extraMul);
				v.initialParams.push(term);
			});
		}

		if (modData.applyEffectWhenMerged !== undefined) v.applyEffectWhenMerged = modData.applyEffectWhenMerged;
		if (modData.customDescription !== undefined && modData.customDescription !== null)
			v.customDescription = modData.customDescription;
		if (modData.descriptionLang !== undefined && modData.descriptionLang !== null)
			v.descriptionLang = modData.descriptionLang;
		if (modData.isNegative !== undefined) v.isNegative = modData.isNegative;
	}

	static addCombatEffecModificationData(effects, data, modData, type, lv, mul, extraMul = 1) {
		effects?.forEach(x => {
			if (x?.effect?.id != modData.effectID)
				return;
			if (x.targetOverride!==modData.targetOverride)
				return;
			if (x.appliesWhen!==modData.appliesWhen)
				return;
			if (x.bypassBarrier!==modData.bypassBarrier)
				return;
			this.removeCombatEffecModificationData(effects, data, modData.effectID, false);
		});

		if (data.add == null)
			data.add = [];

		this.addCombatEffecData(effects, data.add, modData, type, lv, mul, extraMul);
	}

	static removeCombatEffecModificationData(effects, data, effectID, removeIdAdd = true) {
		if (data.removeEffect == null)
			data.removeEffect = [];
		let _a = data.removeEffect;
		if (_a.findIndex(x => x == effectID) == -1) {
			if (effects?.find(x => x.effect.id == effectID )) {
				_a.push(effectID);
			}
		}
		if (removeIdAdd === false)
			return;
		if (_a = data.add) {
			let i = _a.findIndex(x => x.effectID == effectID);
			while (i != -1) {
				_a.splice(i, 1);
				i = _a.findIndex(x => x.effectID == effectID);
			}
		}
	}

	static updateCombatEffectsModificationData(effects, data, modData, type, lv, mul, extraMul = 1) {
		if (modData.remove) {
			modData.forEach(x => {
				this.removeCombatEffecModificationData(effects, data, x);
			});
		}
		if (modData.add) {
			modData.forEach(x => {
				this.addCombatEffecModificationData(effects, data, x, type, lv, mul, extraMul);
			});
		}
	}

	static parseStandardModifier(data, term) {
		let _a = null;
		if (_a=term.modifiers) {
			data.modifiers = this.parseModifiers(_a);
		}
		if (_a = term.conditionalModifiers) {
			data.conditionalModifiers = [];
			_a.forEach(x => { data.conditionalModifiers.push(this.parseConditionalModifier(x)); });
		}
		if (_a=term.enemyModifiers) {
			data.enemyModifiers = this.parseModifiers(_a);
		}
		if (_a = term.combatEffects) {
			data.combatEffects = [];
			_a.forEach(x => { data.combatEffects.push(this.parseCombatEffect(x)) });
		}
	}

	static updateStandardModiferData(statObject, data, modData, type, lv, mul, extraMul = 1) {
		let _a = null;
		if (_a = modData.modifiers) {
			if (data.modifiers == null)
				data.modifiers = {};
			this.updateModifiersModificationData(statObject.modifiers, data.modifiers, modData.modifiers, type, lv, mul, extraMul);
		}

		if (_a = modData.conditionalModifiers) {
			if (data.conditionalModifiers == null)
				data.conditionalModifiers = {};
			let _b = data.conditionalModifiers;
			if (_a.removed) {
				if (_b.removed == null)
					_b.removed = [];
				_b.removed.push(..._a.removed);
			}
			if (_a.add) {
				if (_b.add == null)
					_b.add = [];
				_a.add?.forEach(x => {
					_b.add.push(this.newConditionalModiferData(x, type, lv, mul, extraMul));
				});
			}
		}

		if (_a = modData.enemyModifiers) {
			if (data.enemyModifiers == null)
				data.enemyModifiers = {};
			this.updateModifiersModificationData(statObject.enemyModifiers, data.enemyModifiers, modData.enemyModifiers, type, lv, mul, extraMul);
		}

		if (_a = modData.combatEffects) {
			if (data.combatEffects == null)
				data.combatEffects = {};
			this.updateCombatEffectsModificationData(statObject.combatEffects, data.combatEffects, modData.combatEffects, type, lv, mul, extraMul);
		}
	}

	static parseDamageData(dmg) {
		let data = {};
		if (c.damageType) data.damageType = c.damageType;
		if (dmg.character) data.character = dmg.character;
		if (dmg.maxRoll) data.maxRoll = dmg.maxRoll;
		if (dmg.maxPercent !== undefined) data.maxPercent = dmg.maxPercent;
		if (dmg.attackCount !== undefined) data.attackCount = dmg.attackCount;
		if (dmg.roll !== undefined) data.roll = dmg.roll;
		if (dmg.minRoll) data.minRoll = dmg.minRoll;
		if (dmg.minPercent !== undefined) data.minPercent = dmg.minPercent;
		if (dmg.amplitude !== undefined) data.amplitude = dmg.amplitude;

		return data;
	}

	static parseSpecialAttack(sp) {
		let data = {};
		data.id = sp.id;
		data.defaultChance = sp.defaultChance;
		if (dmg.name) data.name = dmg.name;
		if (dmg.description) data.description = dmg.description;
		if (dmg.descriptionGenerator) data.descriptionGenerator = dmg.descriptionGenerator;
		sp.damage?.forEach(x => {
			if (data.damage == null) data.damage = [];
			let _a = data.damage;
			_a.push(this.parseDamageData(x));
		});

		sp.prehitEffects?.forEach(x => {
			if (data.prehitEffects == null) data.prehitEffects = [];
			let _a = data.prehitEffects;
			_a.push(this.parseCombatEffect(x));
		});

		sp.onhitEffects?.forEach(x => {
			if (data.onhitEffects == null) data.onhitEffects = [];
			let _a = data.onhitEffects;
			_a.push(this.parseCombatEffect(x));
		});

		if (dmg.canNormalAttack !== undefined) data.canNormalAttack = dmg.canNormalAttack;
		if (dmg.cantMiss !== undefined) data.cantMiss = dmg.cantMiss;
		if (dmg.attackCount !== undefined) data.attackCount = dmg.attackCount;
		if (dmg.attackInterval !== undefined) data.attackInterval = dmg.attackInterval;
		if (dmg.lifesteal !== undefined) data.lifesteal = dmg.lifesteal;
		if (dmg.consumesEffect) {
			if (data.consumesEffect != null)
				data.consumesEffect = {};
			data.consumesEffect.effectID = dmg.consumesEffect.effect.id;
			data.consumesEffect.paramName = dmg.consumesEffect.paramName;
		}
		if (c.usesRunesPerProc) data.usesRunesPerProc = c.usesRunesPerProc;
		if (dmg.usesPrayerPointsPerProc !== undefined) data.usesPrayerPointsPerProc = dmg.usesPrayerPointsPerProc;
		if (dmg.usesPotionChargesPerProc !== undefined) data.usesPotionChargesPerProc = dmg.usesPotionChargesPerProc;
		if (dmg.attackTypes) data.attackTypes = dmg.attackTypes;

		return data;
	}

	static addSpecialAttackData(attacks, data, id, chance) {
		if (chance == 0) {
			this.removeSpecialAttackData(data, id);
			return;
		}
		if (data.specialAttacks == null)
			data.specialAttacks = {};
		if (data.specialAttacks.add == null)
			data.specialAttacks.add = [];

		let len = 0;
		for (let m = 0; m < attacks.length; ++m) {
			if (data?.remove?.find(y => y == x))
				continue;
			if (attacks[m].id == id) {
				data.overrideSpecialChances[len] = chance;
				return;
			}
			++len;
		}

		let _i;
		if (_i=data.specialAttacks.add.findIndex(x=>x==id) == -1){
			data.specialAttacks.add.push(id);
			data.overrideSpecialChances.push(chance);
		}
		else
			data.overrideSpecialChances[_i+len] = chance;
	}

	static removeSpecialAttackData(data, id) {
		if (data.specialAttacks == null)
			data.specialAttacks = {};
		if (data.specialAttacks.remove == null)
			data.specialAttacks.remove = [];
		let _a;
		if (_a = data.specialAttacks.add){
			let i = _a.findIndex(x=>x==id);
			if (i != -1){
				_a.splice(i,1);
				data.overrideSpecialChances.splice(i,1);
			}
		}
		_a = data.specialAttacks.remove;
		if (_a.find(x=>x==id))
			return;
		_a.push(id);
	}

	static removeAllSpecialAttackData(attacks, data) {
		attacks?.forEach(x => {
			this.removeSpecialAttackData(data, x.id);
		});
		if (data?.specialAttacks) {
			data.specialAttacks.add = [];
			data.specialAttacks.overrideSpecialChances = null;
		}
	}

	static addSpecialAttacksData(statObject, data, modData, type, lv, mul, extraMul = 1, toCalc = true) {
		if (!(modData?.specialAttacks?.add))
			return;
		let _a = statObject.specialAttacks
		let _b = statObject.overrideSpecialChances 
		if (!data.overrideSpecialChances || data.overrideSpecialChances.length == 0) {
			let len = _a?.length ?? 0;
			if (data.overrideSpecialChances == null)
				data.overrideSpecialChances = [];
			for (let m = 0; m < len; ++m) {
				if (data?.specialAttacks?.remove?.find(x => x == _a[m].id))
					continue;
				let chance = 0;
				if (_b && isNumber(_b[m]))
					chance = _b[m];
				else {
					let sp = game.specialAttacks.find(x => x.id == _a[m].id);
					if (sp && isNumber(sp.defaultChance)) chance = sp.defaultChance;
				}
				data.overrideSpecialChances.push(chance);
			}
		}

		_a = modData.specialAttacks.add;
		let len = _a?.length ?? 0;
		_b = modData.overrideSpecialChances;
		for (let m = 0; m < len; ++m){
			let chance = toCalc ? (this.calcValue(_b[m], type, lv, mul, extraMul) >> 0) : _b[m];
			if (chance > 100)
				chance = 100;
			if (chance == 0){
				let sp = game.specialAttacks.find(x=>x.id == _a[m]);
				if (sp && isNumber(sp.defaultChance)) chance = sp.defaultChance;
			}
			this.addSpecialAttackData(statObject.specialAttacks, data, _a[m], chance);
		}
	}

	static removeSpecialAttacksData(statObject, data, modData) {
		modData?.remove?.forEach(x => {
			this.removeSpecialAttackData(data, x);
		});
	}

	static addSpecialAttacksDataAlias(statObject, data, aliasData, type, lv, mul, extraMul = 1) {
		let modData = {};
		modData.specialAttacks = {};
		modData.specialAttacks.add = [];
		modData.overrideSpecialChances = [];

		Object.entries(aliasData).forEach(x => {
			let chance = this.calcValue(x[1], type, lv, mul, extraMul) >> 0;
			modData.specialAttacks.add.push(x[0]);
			modData.overrideSpecialChances.push(chance);
		});

		this.addSpecialAttacksData(statObject, data, modData, 0, lv, mul, extraMul, false);
	}

	static registerSpecialAttack(data, newId) {
		const ns = game.registeredNamespaces.getNamespace("BGSCheat");
		if (ns == null)
			return;
		let v = Object.assign({}, data);
		v.id = newId;
		let newName = loadedLangJson[`SPECIAL_ATTACK_NAME_${data.id}`];
		let newDesc = loadedLangJson[`SPECIAL_ATTACK_${data.id}`];
		if (newName) v.name = newName;
		if (newDesc) v.description = newDesc;
		let gameData = {};
		gameData.attacks = [];
		gameData.attacks.push(v);
		game.registerGameData(ns, gameData);
	}

	static updateSpecialAttack(sp, data) {
		if (data.defaultChance) sp.defaultChance = data.defaultChance;
		if (data.attackCount) sp.attackCount = data.attackCount;
		if (data.attackInterval) sp.attackInterval = data.attackInterval;
		if (data.lifesteal) sp.lifesteal = data.lifesteal;
		for (let m = 0; m < data?.damage?.length ?? 0; ++m) {
			if (!sp.damage[m])
				continue;
			const _s = data.damage[m];
			const _t = sp.damage[m];
			if (_s.amplitude && _t.amplitude) _t.amplitude = _s.amplitude;
			if (_s.minPercent && _t.minPercent) _t.minPercent = _s.minPercent;
			if (_s.maxPercent && _t.maxPercent) _t.maxPercent = _s.maxPercent;
		}
		sp.registerSoftDependencies(data, game);
	}

	static levelUpSpecialAttack(id, data, modData, type, lv, mul, extraMul) {
		let v = JSON.parse(JSON.stringify(data));

		//Last chance ot modify subdata
		if (modData.defaultChance) v.defaultChance = modData.defaultChance;
		if (modData.attackCount) v.attackCount = modData.attackCount;
		if (modData.attackInterval) v.attackInterval = modData.attackInterval;
		if (modData.lifesteal) v.lifesteal = modData.lifesteal;
		if (modData.damage instanceof Array && v.damage instanceof Array) {			//Should match, since only sub modify
			for (let m = 0; m < modData.damage.length; ++m) {
				if (v.damage[m] === undefined)
					continue;
				if (modData.damage[m].amplitude) v.damage[m].amplitude = modData.damage[m].amplitude;
				if (modData.damage[m].minPercent) v.damage[m].minPercent = modData.damage[m].minPercent;
				if (modData.damage[m].maxPercent) v.damage[m].maxPercent = modData.damage[m].maxPercent;
			}
		}

		if (modData.prehitEffects instanceof Array) {
			modData.prehitEffects.forEach(x => {
				let effect = v.prehitEffects.find(y => y.effectID == x.effectID);
				if (!effect) {
					v.prehitEffects.push(x);
					return;
				}
				if (x.chance) effect.chance = x.chance;
				if (!(x.initialParams instanceof Array))
					return;
				if (effect.initialParams == null)
					effect.initialParams = [];
				x.initialParams.forEach(y => {
					let param = effect.initialParams.find(z => z.name == y.name);
					if (!param) {
						effect.initialParams.push(y);
						return;
					}
					param.value = y.value;
				});
			});
		}

		if (modData.onhitEffects instanceof Array) {
			modData.onhitEffects.forEach(x => {
				let effect = v.onhitEffects.find(y => y.effectID == x.effectID);
				if (!effect) {
					v.onhitEffects.push(x);
					return;
				}
				if (x.chance) effect.chance = x.chance;
				if (!(x.initialParams instanceof Array))
					return;
				if (effect.initialParams == null)
					effect.initialParams = [];
				x.initialParams.forEach(y => {
					let param = effect.initialParams.find(z => z.name == y.name);
					if (!param) {
						effect.initialParams.push(y);
						return;
					}
					param.value = y.value;
				});
			});
		}

		v = JSON.parse(JSON.stringify(v));
		v.defaultChance = this.calcValue(v.defaultChance, 0x1000 | type, lv, mul, extraMul) ?? 0;
		v.attackCount = (this.calcValue(v.attackCount, 0x1000 | type, lv, mul, extraMul) ?? 0);
		v.attackInterval = (this.calcValue(v.attackInterval, 0x1000 | type, lv, mul, extraMul) ?? 0);
		if (v.attackInterval < 50)
			v.attackInterval = 50;
		if (v.attackInterval % 50 != 0)
			v.attackInterval = v.attackInterval - (v.attackInterval % 50);
		v.lifesteal = this.calcValue(v.lifesteal, 0x1000 | type, lv, mul, extraMul) ?? 0;
		v?.damage.forEach(x => {
			if (x.amplitude) x.amplitude = this.calcValue(x.amplitude, type, lv, mul, extraMul);
			if (x.minPercent) x.minPercent = this.calcValue(x.minPercent, type, lv, mul, extraMul);
			if (x.maxPercent) x.maxPercent = this.calcValue(x.maxPercent, type, lv, mul, extraMul);
		});
		v?.prehitEffects?.forEach(x => {
			if (x?.effectID?.indexOf("BGSCheat:") == 0) {
				x.bypassBarrier = true;
				x.applyEffectWhenMerged = true;
			}
			if (x.chance) x.chance = this.calcValue(x.chance, type, lv, mul, extraMul);
			x?.initialParams?.forEach(y => { if (y.value) y.value = this.calcValue(y.value, 0x1000 | type, lv, mul, extraMul); });
		});
		v?.onhitEffects?.forEach(x => {
			if (x?.effectID?.indexOf("BGSCheat:") == 0) {
				if (x.bypassBarrier === undefined)
					x.bypassBarrier = true;
				if (x.applyEffectWhenMerged === undefined)
					x.applyEffectWhenMerged = true;
			}
			if (x.chance) x.chance = this.calcValue(x.chance, type, lv, mul, extraMul);
			x?.initialParams?.forEach(y => { if (y.value) y.value = this.calcValue(y.value, 0x1000 | type, lv, mul, extraMul); });
		});

		let sp = game.specialAttacks.getObjectByID("BGSCheat:" + id);
		if (sp == null)
			this.registerSpecialAttack(v, id);
		else
			this.updateSpecialAttack(sp, v);
	}

	static parseEquipmentStatsData(stats) {
		let data = [];
		stats?.forEach(x => {
			let v = {};
			v.key = x.key;
			v.value = x.value;
			if (x.damageType) v.damageType = x.damageType.id;
			data.push(v);
		});
		return data;
	}

	static getCurrentEquipmentStat(item, data) {
		if (item.equipmentStats) {
			data.base = [];
			let _a = data.base;
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

	static addEquipmentStats(stats, data, modData, type, lv, mul, extraMul = 1) {
		modData?.forEach(x => {
			const add = this.calcValue(x.value, type, lv, mul, extraMul) >> 0;
			if (!add)
				return;
			let i = data.findIndex(y => y.key == x.key && y.damageType == x.damageType);
			let v = null;
			if (i == -1) {
				v = {};
				v.key = x.key;
				if (x.damageType) v.damageType = x.damageType;
				v.value = 0;
				data.push(v);
			}
			else
				v = data[i];
			v.value += add;
		});
	}

	static addEquipmentStatsModification(stats, data, modData, type, lv, mul, extraMul = 1) {
		if (data.add == null)
			data.add = [];
		this.addEquipmentStats(stats, data.add, modData, type, lv, mul, extraMul);
	}

	static removeEquipmentStatModification(stats, data, key) {
		if (data.remove == null)
			data.remove = [];
		let _a = data.remove;
		if (_a.findIndex(x => x == key) == -1) {
			if (stats.findIndex(x=>x.key == key) != -1)
				_a.push(key);
		}
	}

	static addEquipmentStatsAlias(stats, data, spd, atkBonus, strBonus, defBonus, res, sumMaxhit, type, lv, mul, extraMul = 1) {
		let _v = [];
		if (isNumber(spd))
			_v.push({ "key": "attackSpeed", "value": spd });
		Array.from(atkBonus ? atkBonus : [], (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push({ "key": "stabAttackBonus", "value": x[1] }); break;
				case 1: _v.push({ "key": "slashAttackBonus", "value": x[1] }); break;
				case 2: _v.push({ "key": "blockAttackBonus", "value": x[1] }); break;
				case 3: _v.push({ "key": "rangedAttackBonus", "value": x[1] }); break;
				case 4: _v.push({ "key": "magicAttackBonus", "value": x[1] }); break;
			}
		});

		Array.from(strBonus ? strBonus : [], (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push({ "key": "meleeStrengthBonus", "value": x[1] }); break;
				case 1: _v.push({ "key": "rangedStrengthBonus", "value": x[1] }); break;
				case 2: _v.push({ "key": "magicDamageBonus", "value": x[1] }); break;
			}
		});

		Array.from(defBonus ? defBonus : [], (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push({ "key": "meleeDefenceBonus", "value": x[1] }); break;
				case 1: _v.push({ "key": "rangedDefenceBonus", "value": x[1] }); break;
				case 2: _v.push({ "key": "magicDefenceBonus", "value": x[1] }); break;
			}
		});

		Array.from(res ? res : [], (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push({ "key": "resistance", "damageType":"melvorD:Normal", "value": x[1] }); break;
				case 1: _v.push({ "key": "resistance", "damageType":"melvorItA:Abyssal", "value": x[1] }); break;
				case 2: _v.push({ "key": "resistance", "damageType":"melvorF:Pure", "value": x[1] }); break;
				case 3: _v.push({ "key": "resistance", "damageType":"melvorItA:Eternal", "value": x[1] }); break;
			}
		});

		Array.from(sumMaxhit ? sumMaxhit : [], (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push({ "key": "summoningMaxhit", "damageType":"melvorD:Normal", "value": x[1] }); break;
				case 1: _v.push({ "key": "summoningMaxhit", "damageType":"melvorItA:Abyssal", "value": x[1] }); break;
				case 2: _v.push({ "key": "summoningMaxhit", "damageType":"melvorF:Pure", "value": x[1] }); break;
				case 3: _v.push({ "key": "summoningMaxhit", "damageType":"melvorItA:Eternal", "value": x[1] }); break;
			}
		});

		_v.forEach(x => { if (x.value) this.removeEquipmentStatModification(stats, data, x.key); });
		this.addEquipmentStatsModification(stats, data, _v, type, lv, mul, extraMul);
	}

	static addEquipmentStatsAliasMul(stats, data, mspd, matkBonus, mstrBonus, mdefBonus, mres, msumMaxhit, base, type, lv, mul, extraMul = 1) {
		if (base == null)
			return;
		let _a;
		let spd = (_a = Util.calcValue(mspd, type, lv, mul, extraMul) ? _a * (base[0] ?? 0) : 0);

		let atkBonus = [];
		if (matkBonus) {
			for (let m = 0; m < 5; ++m)
				atkBonus.push((_a = Util.calcValue(matkBonus[m], type, lv, mul, extraMul)) ? (_a * (base[1 + m] ?? 0)) : 0);
		}

		let strBonus = [];
		if (mstrBonus) {
			for (let m = 0; m < 3; ++m)
				strBonus.push((_a = Util.calcValue(mstrBonus[m], type, lv, mul, extraMul)) ? (_a * (base[6 + m] ?? 0)) : 0);
		}

		let defBonus = [];
		if (mdefBonus) {
			for (let m = 0; m < 3; ++m)
				defBonus.push((_a = Util.calcValue(mdefBonus[m], type, lv, mul, extraMul)) ? (_a * (base[9 + m] ?? 0)) : 0);
		}

		let res = [];
		if (mres) {
			for (let m = 0; m < 3; ++m)
				res.push((_a = Util.calcValue(mres[m], type, lv, mul, extraMul)) ? (_a * (base[12 + m] ?? 0)) : 0);
		}

		let sumMaxhit = [];
		if (msumMaxhit) {
			for (let m = 0; m < 3; ++m)
				msumMaxhit.push((_a = Util.calcValue(msumMaxhit[m], type, lv, mul, extraMul)) ? (msumMaxhit[m] * (base[16 + m] ?? 0)) : 0);
		}

		this.addEquipmentStatsAlias(stats, data, spd, atkBonus, strBonus, defBonus, res, sumMaxhit, 0, lv, mul);
	}

	static removeEquipmentStatsAlias(stats, data, spd, atkBonus, strBonus, defBonus, res, sumMaxhit) {
		let _v = [];
		if (spd)
			_v.push("attackSpeed");
		Array.from(atkBonus, (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push("stabAttackBonus"); break;
				case 1: _v.push("slashAttackBonus"); break;
				case 2: _v.push("blockAttackBonus"); break;
				case 3: _v.push("rangedAttackBonus"); break;
				case 4: _v.push("magicAttackBonus"); break;
			}
		});

		Array.from(strBonus, (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push("meleeStrengthBonus"); break;
				case 1: _v.push("rangedStrengthBonus"); break;
				case 2: _v.push("magicDamageBonus"); break;
			}
		});

		Array.from(defBonus, (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push("meleeDefenceBonus"); break;
				case 1: _v.push("rangedDefenceBonus"); break;
				case 2: _v.push("magicDefenceBonus"); break;
			}
		});

		Array.from(res, (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push("resistance"); break;
				case 1: _v.push("resistance"); break;
				case 2: _v.push("resistance"); break;
				case 3: _v.push("resistance"); break;
			}
		});

		Array.from(sumMaxhit, (v, i) => [i, v]).forEach(x => {
			if (!x[1])
				return;
			switch (x[0]) {
				case 0: _v.push("summoningMaxhit"); break;
				case 1: _v.push("summoningMaxhit"); break;
				case 2: _v.push("summoningMaxhit"); break;
				case 3: _v.push("summoningMaxhit"); break;
			}
		});
		_v.forEach(x => {
			this.removeEquipmentStatsModification(stats, data, x);
		});
	}

	static parseEquipmentData(data,equip) {
		if (equip.equipmentStats) {
			data.equipmentStats = this.parseEquipmentStatsData(equip.equipmentStats);
		}
		equip.specialAttacks.forEach(x => {
			if (data.specialAttacks == null)
				data.specialAttacks = [];
			data.specialAttacks.push(this.parseSpecialAttack(x));
		});

		this.parseStandardModifier(data, equip);
	}

	static updateEquipmentModData(statObject, data, modData, baseStats, type, lv, mul, extraMul = 1) {
		let _a = null;
		let _b = null;
		if (_a = modData.equipmentStats) {
			if (data.equipmentStats == null)
				data.equipmentStats = {};
			_b = data.equipmentStats;
			let _e = statObject.equipmentStats;
			_a?.remove?.forEach(x => {
				this.removeEquipmentStatsModification(_e, _b, x);
			});
			if (_a.add)
				this.addEquipmentStatsModification(_e, _b, _a.add, type, lv, mul, extraMul);

			if (_a.addAlias) {
				let _c = _a.addAlias;
				this.addEquipmentStatsAlias(_e, _b, _c.spd, _c.atk, _c.str, _c.def, _c.res, _c.summor, type, lv, mul, extraMul);
			}

			if (_a.addAliasMul) {
				let _c = _a.addAliasMul;
				this.addEquipmentStatsAliasMul(_e, _b, _c.spd, _c.atk, _c.str, _c.def, _c.res, _c.summor, baseStats, type, lv, mul, extraMul);
			}
		}

		if (_a = modData.specialAttacks) {
			if (_a.remove)
				this.removeSpecialAttacksData(statObject, data, _a);

			this.addSpecialAttacksData(statObject, data, _a);
			if (_a.alias)
				this.addSpecialAttacksDataAlias(statObject, data, _a.alias, type, lv, mul, extraMul);
		}

		this.updateStandardModiferData(statObject, data, modData, type, lv, mul, extraMul);
	}

	static addModiferDataAlias(modifiers, data, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul = 1) {
		let modData = {};
		Array.from(values, (v, i) => [i, v]).forEach(x => {
			if (x[1] === 0)
				return;
			let key = valueMap[x[0]];
			if (typeof(key) != "string")
				return;
			if (modData[key] == null)
				modData[key] = [];
			let v = {};
			v.value = x[1];
			if (scopes) {
				Array.from(scopes, (v, i) => [i, v]).forEach(y => {
					if (!y)
						return;
					let scopeName = scopeMap[y[0]];
					if (typeof (scopeName) != "string")
						return;
					v[scopeName] = y[1];
				});
			}
			modData[key].push(v);
		});

		this.addModifiersData(modifiers, data, modData, type, lv, mul, extraMul);
	}

	static addModiferModificationDataAlias(modifiers, data, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul = 1) {
		if (data.add == null)
			data.add = [];
		this.addModiferDataAlias(modifiers, data.add, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul);
	}
}

export class EasyTool {
	static setAttackData(data) {
		attackData = data;
	}
	//modify elsments of values by adding minimun and maxinum, by valueMap setting.
	static addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul = 1) {
		Util.addModiferDataAlias(modifiers, data, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul);
	}

	/*
	 * sphidden: [atk, str, def, range, magic, hp, corruption ]
	 * spres: [fdr,dr,fadr,adr,fpdr,pdr,fedr,edr]
	 gp			abygp		slayercoin	abysc 
	sp-currg	sp-curra	sp-currs	sp-curras
		valueMap = ["flatCurrencyGain", "currencyGain","itemSaleCurrencyGain"];
	sp-currg2	sp-curra2	sp-currs2	sp-curras2
		valueMap = ["flatMonsterDrops", "MonsterDrops", "flatGainOnHit", "FromCombat","FromSlayerTasks"];
	sp-currg3	sp-curra3	sp-currs3	sp-curras3
		valueMap = ["fGainOnHitCombatLl","fGainOnKillCombatLl","GainPerDealt","GainPerDealtOnCurrencyAmount"];
	sp-currg4	sp-curra4	sp-currs4	sp-curras4
		valueMap = ["minCurrMulPerDmg","maxCurrMulPerDmg","currGainPerDmgDealtOnCurrencyAmount"];
	 */
	static addSpecfiedModifier(modifiers, data, key, values, scopes, type, lv, mul, extraMul = 1) {
		let valueMap = null
		let scopeMap = null
		let scopeValue = null;
		switch (key) {
			case "sphidden": {
				valueMap = ["flatHiddenSkillLevel"];
				scopeMap = ["skillID"];
				let v = [0];
				let s = [0];
				Array.from(values,(v,i)=>[i,v]).forEach(x=>{
					if (!x[1])
						return;
					v[0] = x[1];
					switch (x[0]) {
						case 0: { s[0] = "melvorD:Attack"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 1: { s[0] = "melvorD:Strength"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 2: { s[0] = "melvorD:Defence"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 3: { s[0] = "melvorD:Ranged"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 4: { s[0] = "melvorD:Magic"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 5: { s[0] = "melvorD:Hitpoints"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 6: { s[0] = "melvorItA:Corruption"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
					}
				});
				break;
			}
			case "spres": {
				valueMap = ["flatResistance", "resistance","ignoreResistanceWhenAttackingChance"];
				scopeMap = ["damageTypeID"];
				let v = [0,0,0];
				let s = [0];
				Array.from(values,(v,i)=>[i,v]).forEach(x=>{
					if (!x[1])
						return;
					v[0] = v[1] = v[2] = 0;
					switch (x[0]) {
						case 0: { v[0] = x[1]; s[0] = "melvorD:Normal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 1: { v[1] = x[1]; s[0] = "melvorD:Normal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 2: { v[0] = x[1]; s[0] = "melvorItA:Abyssal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 3: { v[1] = x[1]; s[0] = "melvorItA:Abyssal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 4: { v[2] = x[1]; s[0] = "melvorD:Normal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 5: { v[2] = x[1]; s[0] = "melvorItA:Abyssal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 7: { v[0] = x[1]; s[0] = "melvorF:Pure"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 8: { v[1] = x[1]; s[0] = "melvorF:Pure"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 8: { v[0] = x[1]; s[0] = "melvorItA:Eternal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 9: { v[1] = x[1]; s[0] = "melvorItA:Eternal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 10: { v[2] = x[1]; s[0] = "melvorF:Pure"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
						case 11: { v[2] = x[1]; s[0] = "melvorItA:Eternal"; this.addModiferWithScopeMinMaxEasy(modifiers, data, v, valueMap, s, scopeMap, type, lv, mul, extraMul); break; }
					}
				});
				break;
			}
			case "sp-currg": if (!scopeValue) scopeValue = ["melvorD:GP"];
			case "sp-curra": if (!scopeValue) scopeValue = ["melvorItA:AbyssalPieces"];
			case "sp-currs": if (!scopeValue) scopeValue = ["melvorD:SlayerCoins"];
			case "sp-curras": {
				if (!scopeValue) scopeValue = ["melvorItA:AbyssalSlayerCoins"];
				valueMap = ["flatCurrencyGain", "currencyGain", "itemSaleCurrencyGain"];
				scopeMap = ["currencyID"];
				this.addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopeValue, scopeMap, type, lv, mul, extraMul);
				break;
			}
			case "sp-currg2": if (!scopeValue) scopeValue = ["melvorD:GP"];
			case "sp-curra2": if (!scopeValue) scopeValue = ["melvorItA:AbyssalPieces"];
			case "sp-currs2": if (!scopeValue) scopeValue = ["melvorD:SlayerCoins"];
			case "sp-curras2": {
				if (!scopeValue) scopeValue = ["melvorItA:AbyssalSlayerCoins"];
				valueMap = ["flatCurrencyGainFromMonsterDrops", "currencyGainFromMonsterDrops", "flatCurrencyGainOnEnemyHit", "currencyGainFromCombat","currencyGainFromSlayerTasks"];
				scopeMap = ["currencyID"];
				this.addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopeValue, scopeMap, type, lv, mul, extraMul);
				break;
			}
			case "sp-currg3": if (!scopeValue) scopeValue = ["melvorD:GP"];
			case "sp-curra3": if (!scopeValue) scopeValue = ["melvorItA:AbyssalPieces"];
			case "sp-currs3": if (!scopeValue) scopeValue = ["melvorD:SlayerCoins"];
			case "sp-curras3": {
				if (!scopeValue) scopeValue = ["melvorItA:AbyssalSlayerCoins"];
				valueMap = ["flatCurrencyGainOnEnemyHitBasedOnCombatLevel","flatCurrencyGainOnMonsterKillBasedOnCombatLevel","currencyGainPerDamageDealt","currencyGainPerDamageDealtBasedOnCurrencyAmount"];
				scopeMap = ["currencyID"];
				this.addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopeValue, scopeMap, type, lv, mul, extraMul);
				break;
			}
			case "sp-currg4": if (!scopeValue) scopeValue = ["melvorD:GP"];
			case "sp-curra4": if (!scopeValue) scopeValue = ["melvorItA:AbyssalPieces"];
			case "sp-currs4": if (!scopeValue) scopeValue = ["melvorD:SlayerCoins"];
			case "sp-curras4": {
				if (!scopeValue) scopeValue = ["melvorItA:AbyssalSlayerCoins"];
				valueMap = ["minCurrencyMultiplierPerDamage","maxCurrencyMultiplierPerDamage","currencyGainPerDamageDealtBasedOnCurrencyAmount"];
				scopeMap = ["currencyID"];
				this.addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopeValue, scopeMap, type, lv, mul, extraMul);
				break;
			}
			case "sp-ign": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Debuff"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:StunLike"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Curse"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:DamageOverTime"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Buff"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-immu": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:Debuff"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:StunLike"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:Curse"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:DamageOverTime"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:Buff"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-ignc": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Stun"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Freeze"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Crystallize"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Sleep"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Slow"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Fear"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-immuc": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Stun"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Freeze"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Crystallize"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Sleep"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Slow"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:Fear"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-ignd": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:BurnDOT"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:BleedDOT"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:PoisonDOT"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:DeadlyPoisonDOT"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:LacerationDOT"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:Voidburst"], scopeMap, type, lv, mul, extraMul);
						case 6: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:ToxinDOT"], scopeMap, type, lv, mul, extraMul);
						case 7: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:AblazeDOT"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-immud": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:BurnDOT"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:BleedDOT"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:PoisonDOT"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:DeadlyPoisonDOT"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorD:LacerationDOT"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorItA:Voidburst"], scopeMap, type, lv, mul, extraMul);
						case 6: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorItA:ToxinDOT"], scopeMap, type, lv, mul, extraMul);
						case 7: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0, x[1]], valueMap, ["melvorItA:AblazeDOT"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-igns": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:Frostburn"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:CrystalSanction"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:Corruption"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:Blight"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:Wither"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:Silence"], scopeMap, type, lv, mul, extraMul);
						case 6: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorItA:EldritchCurse"], scopeMap, type, lv, mul, extraMul);
						case 7: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:BarrierBleedDOT"], scopeMap, type, lv, mul, extraMul);
						case 8: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [x[1]], valueMap, ["melvorD:BarrierBurnDOT"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			case "sp-immus": {
				valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				Array.from(values, (v, i) => [i, v]).forEach(x => {
					if (!x[1])
						return;
					switch (x[0]) {
						case 0: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:Frostburn"], scopeMap, type, lv, mul, extraMul);
						case 1: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:CrystalSanction"], scopeMap, type, lv, mul, extraMul);
						case 2: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorItA:Corruption"], scopeMap, type, lv, mul, extraMul);
						case 3: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorItA:Blight"], scopeMap, type, lv, mul, extraMul);
						case 4: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorItA:Wither"], scopeMap, type, lv, mul, extraMul);
						case 5: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorItA:Silence"], scopeMap, type, lv, mul, extraMul);
						case 6: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorItA:EldritchCurse"], scopeMap, type, lv, mul, extraMul);
						case 7: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:BarrierBleedDOT"], scopeMap, type, lv, mul, extraMul);
						case 8: return this.addModiferWithScopeMinMaxEasy(modifiers, data, [0,x[1]], valueMap, ["melvorD:BarrierBurnDOT"], scopeMap, type, lv, mul, extraMul);
					}
				});
				break;
			}
			default: {
				console.log("No such specfied modifier alias: " + key);
			}
		}

	}

	static scopeFromShortCut(scope, v) {
		if (v.indexOf(":") != -1)
			return v;

		let ret = null;
		switch (scope) {
			case "realmID": {
				switch (v) {
					case "m":
					case "M":
					case "melvor": ret = "melvorD:Melvor"; break;
					case "a":
					case "A":
					case "abyssal": ret = "melvorItA:Abyssal"; break;
					case "e":
					case "E":
					case "eternal": ret = "melvorItA:Eternal"; break;
					default: {
						console.log("Realm ID no such shortcut: " + v);
					}
				}
				break;
			}
			case "currencyID": {
				switch (v) {
					case "gp":
					case "GP": ret = "melvorD:GP"; break;
					case "sc":
					case "SC": ret = "melvorD:SlayerCoins"; break;
					case "ap":
					case "AP": ret = "melvorItA:AbyssalPieces"; break;
					case "as":
					case "AS": ret = "melvorItA:AbyssalSlayerCoins"; break;
					default: {
						console.log("Currency ID no such shortcut: " + v);
					}
				}
				break;
			}
			case "damageTypeID": {
				switch (v) {
					case "n": ret = "melvorD:Normal"; break;
					case "p": ret = "melvorF:Pure"; break;
					case "a": ret = "melvorItA:Abyssal"; break;
					case "e": ret = "melvorItA:Eternal"; break;
					default: {
						console.log("Damage Type ID no such shortcut: " + v);
					}
				}
			}
			case "skillID": {
				switch (v) {
					case "atk": ret = "melvorD:Attack"; break;
					case "atr": ret = "melvorD:Strength"; break;
					case "def": ret = "melvorD:Defence"; break;
					case "hp": ret = "melvorD:Hitpoints"; break;
					case "ran": ret = "melvorD:Ranged"; break;
					case "mag": ret = "melvorD:Magic"; break;
					case "pray": ret = "melvorD:Prayer"; break;
					case "slay": ret = "melvorD:Slayer"; break;
					case "wood": ret = "melvorD:Woodcutting"; break;
					case "fish": ret = "melvorD:Fishing"; break;
					case "fire": ret = "melvorD:Firemaking"; break;
					case "cook": ret = "melvorD:Cooking"; break;
					case "mine": ret = "melvorD:Mining"; break;
					case "smit": ret = "melvorD:Smithing"; break;
					case "thie": ret = "melvorD:Thieving"; break;
					case "farm": ret = "melvorD:Farming"; break;
					case "flet": ret = "melvorD:Fletching"; break;
					case "craf": ret = "melvorD:Crafting"; break;
					case "rune": ret = "melvorD:Runecrafting"; break;
					case "herb": ret = "melvorD:Herblore"; break;
					case "agil": ret = "melvorD:Agility"; break;
					case "summ": ret = "melvorD:Summoning"; break;
					case "astr": ret = "melvorD:Astrology"; break;
					case "town": ret = "melvorD:Township"; break;
					case "cart": ret = "melvorAoD:Cartography"; break;
					case "arch": ret = "melvorAoD:Archaeology"; break;
					case "corr": ret = "melvorItA:Corruption"; break;
					case "harv": ret = "melvorItA:Harvesting"
					default: {
						console.log("Skill ID no such shortcut: " + v);
					}
				}
			}
			case "effectGroupID": {
				switch (v) {
					case "stunlike":
					case "like":
					case "StunLike": ret = "melvorD:StunLike"; break;
					case "stun":
					case "Stun": ret = "melvorD:Stun"; break;
					case "StunImmune": ret = "melvorD:StunImmune"; break;
					case "freeze":
					case "Freeze": ret = "melvorD:Freeze"; break;
					case "crystallize":
					case "crystal":
					case "Crystal":
					case "Crystallize": ret = "melvorD:Crystallize"; break;
					case "sleep":
					case "Sleep": ret = "melvorD:Sleep"; break;
					case "SleepImmune": ret = "melvorD:SleepImmune"; break;
					case "Drowsy": ret = "melvorD:Drowsy"; break;
					case "slow":
					case "Slow": ret = "melvorD:Slow"; break;
					case "frostburn":
					case "frost":
					case "Frostburn": ret = "melvorD:Frostburn"; break;
					case "dot":
					case "DOT":
					case "DamageOverTime": ret = "melvorD:DamageOverTime"; break;
					case "burn":
					case "Burn": ret = "melvorD:BurnDOT"; break;
					case "bleed":
					case "Bleed": ret = "melvorD:BleedDOT"; break;
					case "poison":
					case "Poison": ret = "melvorD:PoisonDOT"; break;
					case "regen":
					case "Regen": ret = "melvorD:RegenDOT"; break;
					case "Poison2":
					case "poison2":
					case "deadly":
					case "Deadly":
					case "dp":
					case "DP":
					case "DeadlyPoison": ret = "melvorD:DeadlyPoisonDOT"; break;
					case "BarrierBleed": ret = "melvorD:BarrierBleedDOT"; break;
					case "BarrierBurn": ret = "melvorD:BarrierBurnDOT"; break;
					case "lace":
					case "Lace":
					case "Laceration": ret = "melvorD:LacerationDOT"; break;
					case "stacking":
					case "stack":
					case "Stack":
					case "Stacking": ret = "melvorD:Stacking"; break;
					case "curse":
					case "Curse": ret = "melvorD:Curse"; break;
					case "buff":
					case "Buff": ret = "melvorD:Buff"; break;
					case "debuff":
					case "Debuff": ret = "melvorD:Debuff"; break;
					case "fear":
					case "Fear": ret = "melvorD:Fear"; break;
					case "FearImmune": ret = "melvorD:FearImmune"; break;
					case "cs":
					case "CS":
					case "CrystalSanction": ret = "melvorD:CrystalSanction"; break;
					case "corr":
					case "corrupt":
					case "Corrupt":
					case "Corruption": ret = "melvorItA:Corruption"; break;
					case "blight":
					case "Blight": ret = "melvorItA:Blight"; break;
					case "wither":
					case "Wither": ret = "melvorItA:Wither"; break;
					case "silence":
					case "Silence": ret = "melvorItA:Silence"; break;
					case "SilenceImmune": ret = "melvorItA:SilenceImmune"; break;
					case "ec":
					case "EC":
					case "EldritchCurse": ret = "melvorItA:EldritchCurse"; break;
					case "void":
					case "Void":
					case "Voidburst": ret = "melvorItA:Voidburst"; break;
					case "Toxin": ret = "melvorItA:ToxinDOT"; break;
					case "Ablaze": ret = "melvorItA:AblazeDOT"
					default: {
						console.log("Effect  Group ID no such shortcut: " + v);
					}
				}
			}
			case "subcategoryID": {
				switch (v) {
					case "air": ret = "melvorD:Air"; break;
					case "water": ret = "melvorD:Water"; break;
					case "earth": ret = "melvorD:Earth"; break;
					case "fire": ret = "melvorD:Fire"; break;
					case "elemental": ret = "melvorD:Elemental"; break;
					case "strike": ret = "melvorD:Strike"; break;
					case "bolt": ret = "melvorD:Bolt"; break;
					case "blast": ret = "melvorD:Blast"; break;
					case "wave": ret = "melvorD:Wave"; break;
					case "surge": ret = "melvorD:Surge"; break;
					case "nature": ret = "melvorF:Nature"; break;
					case "poison": ret = "melvorTotH:Poison"; break;
					case "infernal": ret = "melvorTotH:Infernal"; break;
					case "lightning": ret = "melvorTotH:Lightning"; break;
					case "abyssal": ret = "melvorItA:Abyssal"; break;
					case "brume": ret = "melvorItA:Brume"; break;
					case "gloom": ret = "melvorItA:Gloom"; break;
					case "wither": ret = "melvorItA:Wither"; break;
					case "nether": ret = "melvorItA:Nether"
					default: {
						console.log("Category ID no such shortcut: " + v);
					}
				}
			}
			default: {
				console.log("No such scope: " + scope);
			}
		}
		return ret;
	}

	/*
	 * xp: 
				valueMap = ["skillXP", "abyssalSkillXP", "masteryXP"];
				scopeMap = ["skillID", "realmID"];
	 * skillbase:
				valueMap = ["skillPreservationChance","skillItemDoublingChance","flatSkillInterval","skillInterval","globalItemDoublingChance"],
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
	 * skillextra
				valueMap = ["PreservationCap","doubleItemPower","flatAdditionalPrimaryProductQuantity","skillCostReduction"],
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
	 * bypass
				valueMap = ["GlobalPreserve", "DoubleItemsPower", "Ammo", "Rune", "summoningCharge", "soulPoint"];
				scopeMap = ["skillID"];
	 * skillAddItem
				valueMap = ["fAdditonalSkItem", "additionRndSktIemChance", "additionItemdOnPrimaryQuantityChance", "additionalRandomSkillItemChancePerInterval"];
				scopeMap = ["itemID", "skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
	 * itemRand
				valueMap = ["randomProductChance", "flatBaseRandomProductQuantity"];
				scopeMap = ["itemID", "skillID", "actionID"];
	 * skillItemBase
				valueMap = ["flatBasePrimaryProductQuantity", "basePrimaryProductQuantity"];
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
	 * prayer
				valueMap = ["PPPreserve", "UPPPreserve", "SPPreserve", "flatPPCost", "flatSPCost", "PPCost", "abylPCost"];
	 * prayerGet
				valueMap = ["flatPPBurying", "PPBurying", "flatSPReleasing", "doubleBone", "doubleSoulChance", "doubleSoulPower"];
	 * prayerGetCombat
				valueMap = ["flatPPointsHit", "dmgTakenPP", "flatPPPerKill", "flatSPHit","flatSPPerrKill"];
	 * food
				valueMap = ["autoThreshold", "autoHpLimit", "foodPreserve", "autoEfficiency", "foodHealing"];
	 * potion
				valueMap = ["flatCharges", "Charges", "ChargePreservationChance", "randomHerblorePotionChance"];
	 * skillsp
				valueMap = ["altMagicPreserve", "runecraftingCostReduction", "flatShardCost", "nonShardCostReduction", "compostPreserve", "bypassCompostPresere"];
				scopeMap = ["realmID", "actionID", "categoryID"];
	 * preserve
				valueMap = ["consumable", "summoningCharge", "rune", "ammo"];
	 * fish
				valueMap = ["additionalSameAreaFishChance", "increasedChanceToFindLostChest", "fishingCurrencyGainChance", "currencyGainSales", "secialChance", "addSpecialChance", "fishingCookedChance"];
				scopeMap = ["currencyID", "realmID"];
	thieving
		valueMap = ["Stealth","flatThievGain", "minThievGain","flatAdditionalThievingCommonDropQuantity"];
		scopeMap = ["currencyID"];
	firemaking
		valueMap = ["firemakingLogCurrencyGain", "firemakingBonfireInterval","additionalRandomFiremakingOilChance"];
		scopeMap = ["currencyID"];
	 * hidden
				valueMap = ["flatHiddenSkillLevel", "flatHiddenSkillLevelBasedOnLevels"];
				scopeMap = ["skillID"];
	 * sphidden
				[hiddenAttack, str, def, renge, magic, hp, corruption]
	 * acc
				valueMap = ["accuracyRating", "meleeAccuracyRating","rangedAccuracyRating","magicAccuracyRating"];
	 * acc2
				valueMap = ["convertMissIntoHit", "cantMiss", "flatMeleeAccuracyBonusPerAttackInterval", "flatRangedAccuracyBonusPerAttackInterval", "flatMagicAccuracyBonusPerAttackInterval"];
	 * eva
				valueMap = ["evasion", "meleeEvasion", "rangedEvasion", "magicEvasion"];
	 * eva2
				valueMap = ["dodgeChance", "evasionAgainstMelee", "evasionAgainstRanged", "evasionAgainstMagic"];
	 * cant
				valueMap = ["cantAttack", "cantEvade", "disableHPRegeneration", "disableLifesteal", "cantRegenBarrier", "cantSpecialAttack"];
	 * atkhits
				valueMap = ["flatMinHit", "flatMaxHit", "minHitBasedOnMaxHit", "maxHit"];
	 * maghits
				valueMap = ["flatMagicMinHit", "flatMagicMaxHit","magicMaxHit","magicAccuracyRating"];
				scopeMap = ["subcategoryID"];
	 * maxHits
				valueMap = ["maxHitBasedOnTargetCurrentHitpoints", "maxHitBasedOnPrayerCost", "maxHitBasedOnResistance", "maxHitBasedOnTargetResistance", "meleeMaxHit", "rangedMaxHit","magicMaxHit"];
				scopeMap = ["damageTypeID"];
	 * against
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopeMap = ["damageTypeID"];
	 * againstN,againstP,againstI,againstE
				scopes: Normal, Pure, Abyssal, Eternal
	 * res
				valueMap = ["flatResistance", "resistance","ignoreResistanceWhenAttackingChance"];
				scopeMap = ["damageTypeID"];
	 * spres
		[flat normal, normal, flat abyssal, abyssal, ignore normal, ignore abyssal, f p, p, f e, e, i p, i e]
	 * strBonus
		valueMap = ["meleeStrengthBonus", "rangedStrengthBonus", "magicDamageBonus", "flatMeleeStrengthBonusPerAttackInterval", "flatRangedStrengthBonusPerAttackInterval"];
	 * hp
		valueMap = ["flatMaxHitpoints", "maxHitpoints", "rebirthChance"];
	 * regen
		valueMap = ["flatRegenerationInterval", "flatHPRegen", "hitpointRegeneration", "regenPerDamageTaken"];
	 * regen2
		valueMap = ["hPRegenBasedOnMaxHP", "flatHPRegenBasedOnMeleeMaxHit", "flatHPRegenBasedOnRangedMaxHit", "flatHPRegenBasedOnMagicMaxHit"];
	 * regen3
		valueMap = ["regenPerDamageTaken", "healingWhenHit", "healWhenStunned", "healWhenSlept", "regenPerDamageTaken"];
	 * mine
		valueMap = ["miningGemChance", "qualitySuperiorGemChance", "abyssalGemChance", "additionalAbyssalGemChance","gemVeinChance","abyssalGemVeinChanceIncrease"];
	 * mine2
		valueMap = ["miningNodeRespawnInterval", "flatMiningNodeHP", "noMiningNodeDamageChance", "bonusCoalMining"];
	 * farm
		valueMap = ["compostPreservationChance", "bypassCompostPreservationChance", "flatFarmingSeedCost", "farmingSeedCost","farmingSeedReturn","regainAbyssalTreeSeedChance"];
		scopeMap = ["realmID", "categoryID", "actionID"];
	 * woodcut
		valueMap = ["woodcuttingJewelryChance", "woodcuttingDrakeNestJewelryChance", "treeCutLimit"];
	 * cook
		valueMap = ["passiveCookingInterval","flatCoalGainedOnCookingFailure", "flatAbyssalGemsGainedOnCookingFailure"];
	 * atkspd
		valueMap = ["flatAttackInterval", "attackInterval","meleeAttackInterval","rangedAttackInterval","magicAttackInterval"];
	*steal
		valueMap = ["lifesteal", "summoningAttackLifesteal", "meleeLifesteal","rangedLifesteal","magicLifesteal"];
	*steal2
		valueMap = ["bleedLifesteal", "burnLifesteal","poisonLifesteal","lacerationLifesteal","ablazeLifesteal","toxinLifesteal"];
	*steal3
		valueMap = ["doubleLifesteal", "curseLifesteal","lifestealBasedOnHPRegenEffectiveness"];
	*dmgTaken
		valueMap = ["damageTaken", "dotDamageTaken", "damageTakenBasedOnHP"];
	*dmgTaken2
		valueMap = ["dmgTakenPerAtk","dmgTakenPerMissedAtk","currHPDmgTakenOnAtk", "maxHPDmgTakenOnAtk","frostburnDamage"];
	*dmg
		valueMap = ["dmgDealt", "dmgOnCurrHp", "dmgOnMaxHp", "dmgOnMaxHpSelf","lsdmgOnCurrHp","flatTotalBleed"];
	dmg2
		valueMap = ["dmgToBoss", "dmgToSlayer", "dmgToArea", "dmgToAllMonster","damageDealtToDamageTypeSlayerTasks"];
		scopeMap = ["categoryID","damageTypeID"];
		damageDealtToMonstersInArea ["melvorD:CombatAreas", "melvorD:Dungeons", "melvorF:SlayerAreas", "melvorF:Strongholds", "melvorItA:AbyssalCombatAreas", "melvorItA:AbyssalSlayerAreas", "melvorItA:AbyssalStrongholds", "melvorItA:TheAbyss"]
	dot
		valueMap = ["burnDOTDamageTaken", "bleedDOTDamageTaken","poisonDOTDamageTaken","deadlyPoisonDOTDamageTaken","toxinDOTDamageTaken","ablazeDOTDamageTaken","lacerationDOTDamageTaken","voidburstDOTDamageTaken"];
	rune
		valueMap = ["RuneCostReduction", "elementalChance", "elementalQuantity", "giveRandomComboRunes", "doubleRuneProvision"];
		scopeMap = ["actionID"];
	spellcost
		valueMap = ["runePreservationChance","altMagicRunePreservationChance","flatSpellRuneCost", "flatAttackSpellRuneCost"];
		scopeMap = ["itemID","categoryID"];
	currency
		valueMap = ["flatCurrencyGain", "currencyGain","itemSaleCurrencyGain"];
		scopeMap = ["currencyID","skillID","actionID"];
	currency2
		valueMap = ["flatMonsterDrops", "MonsterDrops", "flatGainOnHit", "FromCombat","FromSlayerTasks"];
		scopeMap = ["currencyID"];
	currency3
		valueMap = ["flatGainOnHitCombatLevel","flatGainOnKillCombatLevel","GainPerDealt","GainPerDealtOnCurrencyAmount"];
		scopeMap = ["currencyID"];
	currency4
		valueMap = ["minCurrencyMultiplierPerDamage","maxCurrencyMultiplierPerDamage","currencyGainPerDamageDealtBasedOnCurrencyAmount"];
		scopeMap = ["currencyID"];
	slayer
		valueMap = ["flatSlayerAreaEffectNegation", "flatAbyssalSlayerAreaEffectNegation", "damageDealtToSlayerTasks","flatResistanceAgainstSlayerTasks"];
		scopeMap = ["damageTypeID"];
	slayer2
		valueMap = ["autoSlayerUnlocked","bypassSlayerItems","bypassAllSlayerItems", "slayerTaskLength", "slayerTaskCost", "slayerTaskExtensionCost", "doubleSlayerTaskKillChance","damageDealtToSlayerTasks"];
	reflect
		valueMap = ["flatReflectDamage","reflectDamage", "rolledReflectDamage","rawReflectDamage"];
	allow
		valueMap = ["allowCurses", "allowMagic", "allowUnholyPrayerUse", "allowLootContainerStacking","autoLooting"];
	ignore
		valueMap = ["effectIgnoreChance", "effectImmunity","cleansed","sleepImmunity"]
		scopeMap = ["effectGroupID"];
		[Debuff,Curse,StunLike,Stun,Freeze,Crystallize,Sleep,Slow,Fear,CrystalSanction,melvorAoD:Blind,melvorItA:Silence,melvorItA:EldritchCurse,melvorItA:Blight,melvorItA:Wither]
		[DamageOverTime,Frostburn,Burn,Bleed,Poison,DeadlyPoison,melvorItA:Toxin,melvorItA:Ablaze,melvorItA:Laceration,melvorItA:Voidburst]
		[Buff,melvorItA:Corruption,RegenDOT,Drowsy,StunImmune,SleepImmune,FearImmune,melvorItA:SilenceImmune]
	summon
		valueMap = ["flatSummoningAttackInterval", "summoningAttackInterval", "summoningMaxHit"]
	summon2
		valueMap = ["summoningChargePreservationChance", "summoningChargePreservationChanceBypass", "flatSummoningShardCost", "nonShardSummoningCostReduction"]
	barrier
		valueMap = ["flatBarrierDamage", "flatBarrierSummonDamage", "barrierSummonDamage"]
	dmgignore
		valueMap = ["meleeProt", "rangedProt", "magicProt","otherStyleImmu","meleeImmu","rangedImmu","magicImmu"]
	corrupt
		valueMap = ["CounterRate", "instantChance", "bonusChance", "extra", "permanentCost"];
	loot
		valueMap = ["combatLootDoublingChance", "flatMonsterRespawnInterval"];
	critical
		valueMap = ["critChance", "critMultiplier", "meleeCritChance", "rangedCritChance","magicCritChance"];
	atkeffect
		valueMap = ["unholyMarkOnHit", "onHitSlowMagnitude", "curseOnHitWithUnholyMark", "attackRolls","extraLacerationStackChance"];
	astrology
		valueMap = ["meteoriteLocationChance", "starFallChance", "astrologyModifierCost"];
	town
		valueMap = ["townshipMaxStorage", "townshipMaxSoulStorage", "townshipResourceProduction", "flatTownshipEducation","flatTownshipHappiness","flatTownshipPopulation","townshipTraderCost"];
	arch
		valueMap = ["sieveToolLevel", "trowelToolLevel","brushToolLevel" ,"shovelToolLevel","melvorAoD:mapChargePreservationChance","doubleConsumablesArchaeology"];
	arch2
		valueMap = ["tinyArtefactChance","smallArtefactChance", "mediumArtefactChance","largeArtefactChance","flatCurrencyGainPerArchaeologyLevelNoArtefact"];
	cart
		valueMap = ["cartographySightRange","cartographySurveyRange","cartographyTravelCost","cartographySurveyInterval" ,"cartographySurveyXP","travelEventChance","doubleActiveModifiersCartography"];
	cart2
		valueMap = ["cartographyPaperMakingInterval","cartographyMapUpgradeInterval","mapUpgradeActions","initialMapArtefactValues","mapRefinementCost"];
	harvest
		valueMap = ["harvestingUniqueProductChance", "flatHarvestingIntensity", "doubleHarvestingIntensityChance", "minimumHarvestingIntensity","minimumHarvestingIntensity"];
	 */
	static addModiferWithScope(modifiers, data, key, values, scopes, type, lv, mul, extraMul = 1) {
		let valueMap = null
		let scopeMap = null
		if (key.indexOf("sp-") == 0)
			return this.addSpecfiedModifier(modifiers, data, key, values, scopes, type, lv, mul, extraMul);
		switch (key) {
			case "xp": {
				valueMap = ["skillXP", "abyssalSkillXP", "masteryXP"];
				scopeMap = ["skillID", "realmID"];
				break;
			}
			case "skillbase": {
				valueMap = ["skillPreservationChance", "skillItemDoublingChance", "flatSkillInterval", "skillInterval","globalItemDoublingChance"];
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
				break;
			}
			case "skillextra": {
				valueMap = ["skillPreservationCap", "doubleItemsSkill", "flatAdditionalPrimaryProductQuantity", "skillCostReduction"];
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
				break;
			}
			case "bypass": {
				valueMap = ["bypassGlobalPreservationChance", "bypassDoubleItemsSkill", "bypassAmmoPreservationChance", "bypassRunePreservationChance", "summoningChargePreservationChanceBypass", "soulPointPreservationChanceBypass"];
				scopeMap = ["skillID"];
				break;
			}
			case "prayer": {
				valueMap = ["prayerPointPreservationChance", "unholyPrayerPointPreservationChance", "soulPointPreservationChance", "flatPrayerPointCost", "flatSoulPointCost", "prayerPointCost", "abyssalPrayerCost"];
				break;
			}
			case "prayerGet": {
				valueMap = ["flatPrayerPointsFromBurying", "prayerPointsFromBurying", "flatSoulPointsFromReleasing", "doubleBoneDrops", "doubleSoulDropChance", "doubleSoulDrops"];
				break;
			}
			case "prayerGetCombat": {
				valueMap = ["flatPrayerPointsWhenHit", "damageTakenAddedAsPrayerPoints", "flatPrayerPointsPerMonsterKill", "flatSoulPointsWhenHit","flatSoulPointsPerMonsterKill"];
				break;
			}
			case "food": {
				valueMap = ["autoEatThreshold", "autoEatHPLimit", "foodPreservationChance", "autoEatEfficiency", "foodHealingValue"];
				break;
			}
			case "potion": {
				valueMap = ["flatPotionCharges", "potionCharges", "potionChargePreservationChance", "randomHerblorePotionChance"];
				break;
			}
			case "skillsp": {
				valueMap = ["flatSummoningShardCost", "nonShardSummoningCostReduction"];
				scopeMap = ["realmID", "actionID", "categoryID"];
				break;
			}
			case "preserve": {
				valueMap = ["consumablePreservationChance", "runePreservationChance", "ammoPreservationChance"];
				break;

			}
			case "skillAddItem": {
				valueMap = ["flatAdditionalSkillItem", "additionalRandomSkillItemChance", "additionalItemBasedOnPrimaryQuantityChance", "additionalRandomSkillItemChancePerInterval"];
				scopeMap = ["itemID", "skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
				break;
			}
			case "itemRand": {
				valueMap = ["randomProductChance", "flatBaseRandomProductQuantity"];
				scopeMap = ["itemID", "skillID", "actionID"];
				break;
			}
			case "skillItemBase": {
				valueMap = ["flatBasePrimaryProductQuantity", "basePrimaryProductQuantity"];
				scopeMap = ["skillID", "realmID", "actionID", "categoryID", "subcategoryID"];
				break;
			}
			case "fish": {
				valueMap = ["additionalSameAreaFishChance", "increasedChanceToFindLostChest", "fishingCurrencyGainChance", "currencyGainFromRawFishSales", "fishingSpecialChance", "fishingAdditionalSpecialItemChance", "fishingCookedChance"];
				scopeMap = ["currencyID", "realmID"];
				break;
			}
			case "hidden": {
				valueMap = ["flatHiddenSkillLevel", "flatHiddenSkillLevelBasedOnLevels"];
				scopeMap = ["skillID"];
				break;
			}
			case "sphidden": return this.addSpecfiedModifier(modifiers, data, key, values, scopes, type, lv, mul, extraMul);
			case "acc": {
				valueMap = ["accuracyRating", "meleeAccuracyRating","rangedAccuracyRating","magicAccuracyRating"];
				break;
			}
			case "acc2": {
				valueMap = ["convertMissIntoHit", "cantMiss", "flatMeleeAccuracyBonusPerAttackInterval", "flatRangedAccuracyBonusPerAttackInterval", "flatMagicAccuracyBonusPerAttackInterval"];
				break;
			}
			case "eva": {
				valueMap = ["evasion", "meleeEvasion", "rangedEvasion", "magicEvasion"];
				break;
			}
			case "eva2": {
				valueMap = ["dodgeChance", "evasionAgainstMelee", "evasionAgainstRanged", "evasionAgainstMagic"];
				break;
			}
			case "cant": {
				valueMap = ["cantAttack", "cantEvade", "disableHPRegeneration", "disableLifesteal", "cantRegenBarrier", "cantSpecialAttack"];
				break;
			}
			case "atkhits": {
				valueMap = ["flatMinHit", "flatMaxHit", "minHitBasedOnMaxHit", "maxHit"];
				break;
			}
			case "maghits": {
				valueMap = ["flatMagicMinHit", "flatMagicMaxHit","magicMaxHit","magicAccuracyRating"];
				scopeMap = ["subcategoryID"];
				break;
			}
			case "maxHits": {
				valueMap = ["maxHitBasedOnTargetCurrentHitpoints", "maxHitBasedOnPrayerCost", "maxHitBasedOnResistance", "maxHitBasedOnTargetResistance", "meleeMaxHit", "rangedMaxHit","magicMaxHit"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "against": {
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "againstD": {
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopes = ["melvorD:Normal"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "againstP": {
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopes = ["melvorF:Pure"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "againstI": {
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopes = ["melvorItA:Abyssal"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "againstE": {
				valueMap = ["accuracyRatingAgainstDamageType", "evasionAgainstDamageType","maxHitAgainstDamageType","maxHitpointsAgainstDamageType"];
				scopes = ["melvorItA:Eternal"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "res": {
				valueMap = ["flatResistance", "resistance","ignoreResistanceWhenAttackingChance"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "spres": return this.addSpecfiedModifier(modifiers, data, key, values, scopes, type, lv, mul, extraMul);
			case "strBonus": {
				valueMap = ["meleeStrengthBonus", "rangedStrengthBonus", "magicDamageBonus", "flatMeleeStrengthBonusPerAttackInterval", "flatRangedStrengthBonusPerAttackInterval"];
				break;
			}
			case "hp": {
				valueMap = ["flatMaxHitpoints", "maxHitpoints", "rebirthChance"];
				break;
			}
			case "regen": {
				valueMap = ["flatRegenerationInterval", "flatHPRegen", "hitpointRegeneration", "regenPerDamageTaken"];
				break;
			}
			case "regen2": {
				valueMap = ["hPRegenBasedOnMaxHP", "flatHPRegenBasedOnMeleeMaxHit", "flatHPRegenBasedOnRangedMaxHit", "flatHPRegenBasedOnMagicMaxHit"];
				break;
			}
			case "regen3": {
				valueMap = ["regenPerDamageTaken", "healingWhenHit", "healWhenStunned", "healWhenSlept", "regenPerDamageTaken"];
				break;
			}
			case "mine": {
				valueMap = ["miningGemChance", "qualitySuperiorGemChance", "abyssalGemChance", "additionalAbyssalGemChance","gemVeinChance","abyssalGemVeinChanceIncrease"];
				break;
			}
			case "mine2": {
				valueMap = ["miningNodeRespawnInterval", "flatMiningNodeHP", "noMiningNodeDamageChance", "bonusCoalMining"];
				scopeMap = ["realmID", "categoryID", "actionID"];
				break;
			}
			case "farm": {
				valueMap = ["compostPreservationChance", "bypassCompostPreservationChance", "flatFarmingSeedCost", "farmingSeedCost","farmingSeedReturn","regainAbyssalTreeSeedChance"];
				scopeMap = ["realmID", "categoryID", "actionID"];
				break;
			}
			case "woodcut" :{
				valueMap = ["woodcuttingJewelryChance", "woodcuttingDrakeNestJewelryChance", "treeCutLimit"];
				break;
			}
			case "cook": {
				valueMap = ["passiveCookingInterval","flatCoalGainedOnCookingFailure", "flatAbyssalGemsGainedOnCookingFailure"];
				break;
			}
			case "atkspd": {
				valueMap = ["flatAttackInterval", "attackInterval","meleeAttackInterval","rangedAttackInterval","magicAttackInterval"];
				break;
			}
			case "steal": {
				valueMap = ["lifesteal", "summoningAttackLifesteal", "meleeLifesteal","rangedLifesteal","magicLifesteal"];
				break;
			}
			case "steal2": {
				valueMap = ["bleedLifesteal", "burnLifesteal","poisonLifesteal","lacerationLifesteal","ablazeLifesteal","toxinLifesteal"];
				break;
			}
			case "steal3": {
				valueMap = ["doubleLifesteal", "curseLifesteal","lifestealBasedOnHPRegenEffectiveness"];
				break;
			}
			case "dmgTaken": {
				valueMap = ["damageTaken", "dotDamageTaken", "damageTakenBasedOnHP"];
				break;
			}
			case "dmgTaken2": {
				valueMap = ["damageTakenPerAttack", "damageTakenPerMissedAttack", "currentHPDamageTakenOnAttack", "maxHPDamageTakenOnAttack","frostburnDamage"];
				break;
			}
			case "dmg": {
				valueMap = ["damageDealt", "damageBasedOnCurrentHitpoints", "damageBasedOnMaxHitpoints", "damageBasedOnMaxHitpointsSelf","lifestealDamageBasedOnCurrentHitpoints","flatTotalBleedDamage"];
				break;
			}
			case "dmg2": {
				valueMap = ["damageDealtToBosses", "damageDealtToSlayerTasks", "damageDealtToMonstersInArea", "damageDealtToAllMonsters","damageDealtToDamageTypeSlayerTasks"];
				scopeMap = ["categoryID","damageTypeID"];
				break;
			}
			case "dot": {
				valueMap = ["burnDOTDamageTaken", "bleedDOTDamageTaken","poisonDOTDamageTaken","deadlyPoisonDOTDamageTaken","toxinDOTDamageTaken","ablazeDOTDamageTaken","lacerationDOTDamageTaken","voidburstDOTDamageTaken"];
				break;
			}
			case "rune": {
				valueMap = ["runecraftingRuneCostReduction", "elementalRuneChance", "elementalRuneQuantity", "giveRandomComboRunesRunecrafting", "doubleRuneProvision"];
				scopeMap = ["actionID"];
				break;
			}
			case "spellcost": {
				valueMap = ["runePreservationChance","altMagicRunePreservationChance","flatSpellRuneCost", "flatAttackSpellRuneCost"];
				scopeMap = ["itemID","categoryID"];
				break;
			}
			case "thieving": {
				valueMap = ["thievingStealth","flatThievingCurrencyGain", "minThievingCurrencyGain","flatAdditionalThievingCommonDropQuantity"];
				scopeMap = ["currencyID","realmID"];
				break;
			}
			case "firemaking": {
				valueMap = ["firemakingLogCurrencyGain", "firemakingBonfireInterval","additionalRandomFiremakingOilChance"];
				scopeMap = ["currencyID"];
				break;
			}
			case "currency": {
				valueMap = ["flatCurrencyGain", "currencyGain","itemSaleCurrencyGain"];
				scopeMap = ["currencyID","skillID","actionID"];
				break;
			}
			case "currency2": {
				valueMap = ["flatCurrencyGainFromMonsterDrops", "currencyGainFromMonsterDrops", "flatCurrencyGainOnEnemyHit", "currencyGainFromCombat","currencyGainFromSlayerTasks"];
				scopeMap = ["currencyID"];
				break;
			}
			case "currency3": {
				valueMap = ["flatCurrencyGainOnEnemyHitBasedOnCombatLevel","flatCurrencyGainOnMonsterKillBasedOnCombatLevel","currencyGainPerDamageDealt","currencyGainPerDamageDealtBasedOnCurrencyAmount"];
				scopeMap = ["currencyID"];
				break;
			}
			case "currency4": {
				valueMap = ["minCurrencyMultiplierPerDamage","maxCurrencyMultiplierPerDamage","currencyGainPerDamageDealtBasedOnCurrencyAmount"];
				scopeMap = ["currencyID"];
				break;
			}
			case "slayer": {
				valueMap = ["flatSlayerAreaEffectNegation", "flatAbyssalSlayerAreaEffectNegation", "damageDealtToSlayerTasks","flatResistanceAgainstSlayerTasks"];
				scopeMap = ["damageTypeID"];
				break;
			}
			case "slayer2": {
				valueMap = ["autoSlayerUnlocked","bypassSlayerItems","bypassAllSlayerItems", "slayerTaskLength", "slayerTaskCost", "slayerTaskExtensionCost", "doubleSlayerTaskKillChance","damageDealtToSlayerTasks"];
				break;
			}
			case "reflect": {
				valueMap = ["flatReflectDamage","reflectDamage", "rolledReflectDamage","rawReflectDamage"];
				break;
			}
			case "allow": {
				valueMap = ["allowNonMagicCurses", "allowAttackAugmentingMagic", "allowUnholyPrayerUse", "allowLootContainerStacking","autoLooting"];
				break;
			}
			case "ignore": {
				valueMap = ["effectIgnoreChance", "effectImmunity", "cleansed","sleepImmunity"]
				scopeMap = ["effectGroupID"];
				break;
			}
			case "summon": {
				valueMap = ["flatSummoningAttackInterval", "summoningAttackInterval", "summoningMaxHit", "summoningChargePreservationChance","summoningChargePreservationChanceBypass"]
				break;
			}
			case "summon2": {
				valueMap = ["summoningChargePreservationChance", "summoningChargePreservationChanceBypass", "flatSummoningShardCost", "nonShardSummoningCostReduction"]
				break;
			}
			case "barrier": {
				valueMap = ["flatBarrierDamage", "flatBarrierSummonDamage", "barrierSummonDamage"]
				break;
			}
			case "dmgignore": {
				valueMap = ["meleeProtection", "rangedProtection", "magicProtection","otherStyleImmunity","meleeImmunity","rangedImmunity","magicImmunity"]
				break;
			}
			case "corrupt": {
				valueMap = ["corruptionCounterRate", "instantCorruptionChance", "bonusCorruptionChance", "extraCorruptions","permanentCorruptionCost"];
				break;
			}
			case "loot": {
				valueMap = ["combatLootDoublingChance", "flatMonsterRespawnInterval"];
				break;
			}
			case "critical": {
				valueMap = ["critChance", "critMultiplier", "meleeCritChance", "rangedCritChance","magicCritChance"];
				break;
			}
			case "atkeffect": {
				valueMap = ["unholyMarkOnHit", "onHitSlowMagnitude", "curseOnHitWithUnholyMark", "attackRolls","extraLacerationStackChance"];
				break;
			}
			case "astrology": {
				valueMap = ["meteoriteLocationChance", "starFallChance", "astrologyModifierCost"];
				scopeMap = ["realmID"];
				break;
			}
			case "town": {
				valueMap = ["townshipMaxStorage", "townshipMaxSoulStorage", "townshipResourceProduction", "flatTownshipEducation","flatTownshipHappiness","flatTownshipPopulation","townshipTraderCost"];
				break;
			}
			case "arch": {
				valueMap = ["sieveToolLevel", "trowelToolLevel","brushToolLevel" ,"shovelToolLevel","melvorAoD:mapChargePreservationChance","doubleConsumablesArchaeology"];
				break;
			}
			case "arch2":{
				valueMap = ["tinyArtefactChance","smallArtefactChance", "mediumArtefactChance","largeArtefactChance","flatCurrencyGainPerArchaeologyLevelNoArtefact"];
				break;
			}
			case "cart": {
				valueMap = ["cartographySightRange","cartographySurveyRange","cartographyTravelCost","cartographySurveyInterval" ,"cartographySurveyXP","travelEventChance","doubleActiveModifiersCartography"];
				break;
			}
			case "cart2": {
				valueMap = ["cartographyPaperMakingInterval","cartographyMapUpgradeInterval","mapUpgradeActions","initialMapArtefactValues","mapRefinementCost"];
				break;
			}
			case "harvest": {
				valueMap = ["harvestingUniqueProductChance", "flatHarvestingIntensity", "doubleHarvestingIntensityChance", "minimumHarvestingIntensity","minimumHarvestingIntensity"];
				break;
			}
			default: {
				console.log("No such modifier shortcut: " + key);
			}
		}
		if (valueMap)
			this.addModiferWithScopeMinMaxEasy(modifiers, data, values, valueMap, scopes, scopeMap, type, lv, mul, extraMul);
	}

	static addModifersEasy(modifiers, data, key, modData, type, lv, mul, extraMul = 1) {
		if (!(modData instanceof Array))
			return;

		if (modData[0] instanceof Array) {
			modData.forEach(x => {
				this.addModifersEasy(modifiers, data, key, x, type, lv, mul, extraMul);
			});
			return;
		}

		const i = modData.findIndex(x => (x instanceof Array) || typeof (x) == "string");
		if (i == -1)
			return this.addModiferWithScope(modifiers, data, key, modData, null, type, lv, mul, extraMul);

		const value = modData.slice(0, i);
		const scopes = modData.slice(i);

		if (modData[1] === "n") {
			if (!(modData[0] instanceof Array))
				return;
			modData[2].forEach(x => {
				if (x instanceof Array)
					return this.addModiferWithScope(modifiers, data, key, modData[0], x, type, lv, mul, extraMul);
				let a = [];
				a.push(x);
				return this.addModiferWithScope(modifiers, data, key, modData[0], a, type, lv, mul, extraMul);
			});
			return;
		}

		if (modData[1] === "s") {
			if (!(modData[0] instanceof Array))
				return;
			return this.addModiferWithScope(modifiers, data, key, modData[0], modData.slice(2), type, lv, mul, extraMul);
		}
		return this.addModiferWithScope(modifiers, data, key, modData, null, type, lv, mul, extraMul);
	}

	static addModifersModificationEasy(modifiers, data, key, modData, type, lv, mul, extraMul = 1) {
		if (data.add == null)
			data.add = {};
		this.addModifersEasy(modifiers, data.add, key, modData, type, lv, mul, extraMul);
	}

	static translateCombatEffect(effects, data, id) {
		let ret = null;
		if (id.indexOf(":") != -1)
			ret = id;
		else {
			switch (id) {
				case "frost":
				case "Frost":
				case "frostburn":
				case "Frostburn": ret = "BGSCheat:Frostburn"; break;
				case "stun": 
				case "Stun": ret = "BGSCheat:Stun"; break;
				case "freeze": 
				case "Freeze": ret = "BGSCheat:Freeze"; break;
				case "crystal":
				case "Crystal":
				case "crystallize": 
				case "Crystallize": ret = "BGSCheat:Crystallize"; break;
				case "sleep": 
				case "Sleep": ret = "BGSCheat:Sleep"; break;
				case "blind": 
				case "Blind": ret = "BGSCheat:Blind"; break;
				case "silence": 
				case "Silence": ret = "BGSCheat:Silence"; break;
				case "ec":
				case "EC":
				case "EldritchCurse": ret = "BGSCheat:EldritchCurse"; break;
				case "cs":
				case "CS":
				case "CrystalSanction": ret = "BGSCheat:CrystalSanction"; break;
				case "nulled": 
				case "null": 
				case "Nulled": ret = "BGSCheat:Nulled"; break;
				case "cleansed": 
				case "clean": 
				case "Cleansed": ret = "BGSCheat:Cleansed"; break;
				case "slow":
				case "Slow": ret = "BGSCheat:Slow"; break;
				case "fear": 
				case "Fear": ret = "BGSCheat:Fear"; break;
				case "weakening": 
				case "weak": 
				case "weaken": 
				case "Weakening": ret = "BGSCheat:Weakening"; break;
				case "anguish": 
				case "Anguish": ret = "BGSCheat:Anguish"; break;
				case "confusion": 
				case "Confusion": ret = "BGSCheat:Confusion"; break;
				case "decay": 
				case "Decay": ret = "BGSCheat:Decay"; break;
				case "despair": 
				case "Despair": ret = "BGSCheat:Despair"; break;
				case "madness": 
				case "Madness": ret = "BGSCheat:Madness"; break;
				case "torment": 
				case "Torment": ret = "BGSCheat:Torment"; break;
				case "fatigue": 
				case "Fatigue": ret = "BGSCheat:Fatigue"; break;
				case "petrified": 
				case "Petrified": ret = "BGSCheat:Petrified"; break;
				case "wither": 
				case "Wither": ret = "BGSCheat:Wither"; break;
				case "burn": 
				case "Burn": ret = "BGSCheat:Burn"; break;
				case "poison": 
				case "Poison": ret = "BGSCheat:Poison"; break;
				case "poison2": 
				case "dp": 
				case "deadly": 
				case "Deadly": 
				case "DeadlyPoison": ret = "BGSCheat:DeadlyPoison"; break;
				case "bleed": 
				case "Bleed": ret = "BGSCheat:Bleed"; break;
				case "bleed100": 
				case "Bleed100": ret = "BGSCheat:Bleed100"; break;
				case "bleed200": 
				case "Bleed200": ret = "BGSCheat:Bleed200"; break;
				case "bleed400": 
				case "Bleed400": ret = "BGSCheat:Bleed400"; break;
				case "bleed1600": 
				case "Bleed1600": ret = "BGSCheat:Bleed1600"; break;
				case "bleedr": 
				case "BleedReflect": ret = "BGSCheat:BleedReflect"; break;
				case "BarrierBleed": ret = "BGSCheat:BarrierBleed"; break;
				case "BarrierBurn": ret = "BGSCheat:BarrierBurn"; break;
				case "ablaze": 
				case "Ablaze": ret = "BGSCheat:Ablaze"; break;
				case "toxin": 
				case "Toxin": ret = "BGSCheat:Toxin"; break;
				case "laceration": 
				case "lace": 
				case "Lace": 
				case "Laceration": ret = "BGSCheat:Laceration"; break;
				case "voidburst": 
				case "void": 
				case "Void": 
				case "Voidburst": ret = "BGSCheat:Voidburst"; break;
				case "malice": 
				case "Malice": ret = "BGSCheat:Malice"; break;
				case "consume": 
				case "Consume": ret = "BGSCheat:Consume"; break;
				case "eradicate": 
				case "Eradicate": ret = "BGSCheat:Eradicate"; break;
				case "destruct": 
				case "Destruction": ret = "BGSCheat:Destruction"; break;
				case "shade": 
				case "Shadeveil": ret = "BGSCheat:Shadeveil"; break;
				case "spite": 
				case "Spite": ret = "BGSCheat:Spite"; break;
				case "unholy": 
				case "UnholyMark": ret = "BGSCheat:UnholyMark"; break;
				case "blight": 
				case "Blight": ret = "BGSCheat:Blight"; break;
				default: {
					console.log("No such ab effect: " + id);
				}
			}
		}

		if (!ret || ret.indexOf("BGSCheat:") != 0)
			return ret;
		const i = ret.indexOf(":");
		const lID = ret.slice(i + 1);
		switch (lID) {
			case "Frostburn":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Frostburn");
				break;
			case "Stun":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Stun");
				break;
			case "Freeze":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Freeze");
				break;
			case "Crystallize":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Crystallize");
				break;
			case "Sleep":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Sleep");
				break;
			case "Blind":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Blind");
				break;
			case "Silence":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Silence");
				break;
			case "EldritchCurse":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:EldritchCurse");
				break;
			case "CrystalSanction":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:CrystalSanction");
				break;
			case "Nulled":
				Util.removeCombatEffecModificationData(effects, data, "melvorF:Nulled");
				break;
			case "Cleansed":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Cleansed");
				break;
			case "Slow":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Slow");
				break;
			case "Fear":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Cleansed");
				break;
			case "Confusion":
				Util.removeCombatEffecModificationData(effects, data, "melvorF:Confusion");
				break;
			case "Decay":
				Util.removeCombatEffecModificationData(effects, data, "melvorF:Decay");
				break;
			case "Despair":
				Util.removeCombatEffecModificationData(effects, data, "melvorTotH:Despair");
				break;
			case "Madness":
				Util.removeCombatEffecModificationData(effects, data, "melvorTotH:Madness");
				break;
			case "Torment":
				Util.removeCombatEffecModificationData(effects, data, "melvorTotH:Torment");
				break;
			case "Fatigue":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Fatigue");
				break;
			case "Petrified":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Petrified");
				break;
			case "Wither":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Wither");
				break;
			case "Burn":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Burn");
				break;
			case "Poison":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Poison");
				break;
			case "DeadlyPoison":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:DeadlyPoison");
				break;
			case "Bleed":
			case "Bleed100":
			case "Bleed200":
			case "Bleed400":
			case "Bleed1600":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Bleed100");
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Bleed200");
				Util.removeCombatEffecModificationData(effects, data, "melvorD:Bleed400");
				break;
			case "BleedReflect":
				Util.removeCombatEffecModificationData(effects, data, "melvorD:BleedReflect");
				break;
			case "BarrierBleed":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:BarrierBleed");
				break;
			case "BarrierBurn":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:BarrierBurn");
				break;
			case "Ablaze":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Ablaze");
				break;
			case "Toxin":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Toxin");
				break;
			case "Laceration":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Laceration");
				break;
			case "Voidburst":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Voidburst");
				break;
			case "Malice":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Malice");
				break;
			case "Consume":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Consume");
				break;
			case "Eradicate":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Eradicate");
				break;
			case "Shadeveil":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Shadeveil");
				break;
			case "Spite":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:Spite");
				break;
			case "UnholyMark":
				Util.removeCombatEffecModificationData(effects, data, "melvorAoD:UnholyMark");
				break;
			case "Blight":
				Util.removeCombatEffecModificationData(effects, data, "melvorItA:Blight");
				break;
		}

		return ret;
	}

	static setDefaultValue(value, defValue, id) {
		if (id.indexOf("BGSCheat:") != 0)
			return;
		if (value.initialParams == null)
			value.initialParams = [];

		let _a = value.initialParams;
		const i = id.indexOf(":");
		const lID = id.slice(i + 1);
		switch (lID) {
			case "Stun":
			case "Freeze":
			case "Crystallize":
			case "Sleep":
			case "Blind":
			case "Silence":
			case "EldritchCurse":
			case "CrystalSanction":
			case "Nulled":
			case "Cleansed": {
				if (_a.find(x => x.name == "turns") == null)
					_a.push({ "name": "turns", "value": defValue });
				break;
			}
			case "Slow": {
				if (_a.find(x => x.name == "magnitude") == null)
					_a.push({ "name": "magnitude", "value": defValue });
				break;
			}
			case "Fear":
			case "Weakening":
			case "Anguish":
			case "Confusion":
			case "Decay":
			case "Despair":
			case "Madness":
			case "Torment":
			case "Fatigue":
			case "Spite":
			case "Petrified": {
				if (_a.find(x => x.name == "initialStacks") == null)
					_a.push({ "name": "initialStacks", "value": defValue });
				break;
			}
			case "Burn":
			case "Poison":
			case "DeadlyPoison":
			case "Bleed":
			case "Bleed100":
			case "Bleed200":
			case "Bleed400":
			case "Bleed1600":
			case "BleedReflect":
			case "BarrierBleed":
			case "BarrierBurn":
			case "Ablaze":
			case "Voidburst":
			case "Toxin": {
				if (_a.find(x => x.name == "percent") == null)
					_a.push({ "name": "percent", "value": defValue });
				break;
			}
			case "Laceration":
			case "Shadeveil":
			case "UnholyMark":
			case "Wither": {
				if (_a.find(x => x.name == "maxStacks") == null)
					_a.push({ "name": "maxStacks", "value": defValue });
				break;
			}
			case "Malice":
			case "Consume":
			case "Eradicate":
			case "Destruction": {
				if (_a.find(x => x.name == "maxStacks") == null && _a.find(x => x.name == "stacksToAdd") == null) {
					_a.push({ "name": "maxStacks", "value": defValue });
					_a.push({ "name": "stacksToAdd", "value": defValue });
				}
				break;
			}
			case "Blight": {
				if (_a.find(x => x.name == "maxStacks") == null && _a.find(x => x.name == "resetStacks") == null) {
					_a.push({ "name": "maxStacks", "value": defValue });
					_a.push({ "name": "resetStacks", "value": defValue / 2 });
				}
				break;
			}
			case "Frostburn": {
				if (_a.find(x => x.name == "stacksToAdd") == null && _a.find(x => x.name == "initialStacks") == null) {
					_a.push({ "name": "stacksToAdd", "value": defValue });
					_a.push({ "name": "initialStacks", "value": defValue / 2 });
				}
				break;
			}
		}
	}

	static addCombatEffectModificationShortCut(effects, data, modData, type, lv, mul, extraMul = 1) {
		if (!modData instanceof Array)
			return;
		const _a = modData;
		if (_a[0] instanceof Array) {
			_a[0].forEach(x => {
				let d = [];
				d.push(x);
				d.push(..._a.slice(1));
				this.addCombatEffectModificationShortCut(effects, data, d, type, lv, mul, extraMul);
			});
			return;
		}
		if (_a[1] instanceof Array) {
			_a[1].forEach(x => {
				let d = [];
				d.push(_a[0]);
				d.push(x);
				d.push(..._a.slice(2));
				this.addCombatEffectModificationShortCut(effects, data, d, type, lv, mul, extraMul);
			})
			return;
		}
		let v = {};
		let defValue = 0;
		let id = _a[0];
		if (id[0] >= '0' && id[0] <= '9') {
			let d = 1;
			while (id[d] >= '0' && id[d] <= '9')
				++d;
			defValue = Number(id.slice(0, d));
			id = id.slice(d);
		}
		v.effectID = this.translateCombatEffect(effects, data, id);
		if (typeof (_a[1]) == "string") {
			switch(_a[1]){
				case "ab": v.appliesWhen = "PreAttack"; break;
				case "ap": v.appliesWhen = "PostAttack"; break;
				case "ah": v.appliesWhen = "HitWithAttack"; break;
				case "db": v.appliesWhen = "BeingAttacked"; break;
				case "dp": v.appliesWhen = "WasAttacked"; break;
				case "dh": v.appliesWhen = "HitByAttack"; break;
				case "sf": v.appliesWhen = "StartOfFight"; break;
				case "apf": v.appliesWhen = "PostFirstAttack"; break;
				case "ahf": v.appliesWhen = "HitWithFirstAttack"; break;
				case "dhf": v.appliesWhen = "HitByFirstAttack"; break;
				case "su": v.appliesWhen = "SummonAttack"; break;
				case "re": v.appliesWhen = "Rebirth"; break;
				case "ev": v.appliesWhen = "EvadedAttack"; break;
				case "ct": v.appliesWhen = "CritWithAttack"; break;
				default: v.appliesWhen = _a[1];
			}
		}
		else if (isNumber(_a[1])){
			switch(_a[1]){
				case 1: v.appliesWhen = "PreAttack"; break;
				case 2: v.appliesWhen = "PostAttack"; break;
				case 3: v.appliesWhen = "HitWithAttack"; break;
				case 4: v.appliesWhen = "BeingAttacked"; break;
				case 5: v.appliesWhen = "WasAttacked"; break;
				case 6: v.appliesWhen = "HitByAttack"; break;
				case 7: v.appliesWhen = "StartOfFight"; break;
				case 8: v.appliesWhen = "PostFirstAttack"; break;
				case 9: v.appliesWhen = "HitWithFirstAttack"; break;
				case 10: v.appliesWhen = "HitByFirstAttack"; break;
				case 11: v.appliesWhen = "SummonAttack"; break;
				case 12: v.appliesWhen = "Rebirth"; break;
				case 13: v.appliesWhen = "EvadedAttack"; break;
				case 14: v.appliesWhen = "CritWithAttack"; break;
				default: return;
			}
		}
		else
			return;

		if (_a[2])
			v.chance = _a[2];

		if (_a[3]) {
			if (_a[3] instanceof Array)
				v.initialParams = _a[3];
			else {
				let _b = v.initialParams = [];
				Object.entries(_a[3]).forEach(x => {
					if (!x[1] && x[1] !== 0)
						return;
					switch (x[0]) {
						case "t": { _b.push({ "name":"turns", "value": x[1] }); break; }
						case "i": { _b.push({ "name":"interval", "value": x[1] }); break; }
						case "m": { _b.push({ "name":"magnitude", "value": x[1] }); break; }
						case "p": { _b.push({ "name":"percent", "value": x[1] }); break; }
						case "sa": { _b.push({ "name":"stacksToAdd", "value": x[1] }); break; }
						case "sm": { _b.push({ "name":"maxStacks", "value": x[1] }); break; }
						case "si": { _b.push({ "name":"initialStacks", "value": x[1] }); break; }
						case "s": { _b.push({ "name":"stacks", "value": x[1] }); break; }
						case "sr": { _b.push({ "name":"resetStacks", "value": x[1] }); break; }
						case "sp": { _b.push({ "name":"percentPerStack", "value": x[1] }); break; }
						case "x": { _b.push({ "name":"XTurns", "value": x[1] }); break; }
						case "pr": { _b.push({ "name":"procs", "value": x[1] }); break; }
						case "c": { _b.push({ "name":"category", "value": x[1] }); break; }
						default: {
							if (!x[0])
								break;
							_b.push({ "name": x[0], "value": x[1] });
							break;
						}
					}
				});
			}
		}
		if (defValue != 0)
			this.setDefaultValue(v, defValue, v.effectID);

		if (_a[4] instanceof Array) {
			if (typeof(_a[4][0]) == "boolean")
				v.bypassBarrier = _a[4][0];
			if (typeof(_a[4][1]) == "boolean")
				v.applyEffectWhenMerged = _a[4][1];
			if (typeof (_a[4][2]) == "string")
				v.targetOverride = _a[4][2];
			if (typeof (_a[4][3]) == "object")
				v.condition = _a[4][3];
			if (typeof (_a[4][4]) == "boolean")
				v.isNegative = _a[4][4];
		}

		if (typeof(_a[5]) == "string")
			v.descriptionLang = _a[5];
		if (typeof(_a[6]) == "string")
			v.customDescription = _a[6];

		this.addCustomString(v);

		if (v.bypassBarrier === undefined && v.effectID.indexOf("BGSCheat:") == 0)
			v.bypassBarrier = true;
		if (v.applyEffectWhenMerged === undefined && v.effectID.indexOf("BGSCheat:") == 0)
			v.applyEffectWhenMerged = true;
		Util.removeCombatEffecModificationData(effects, data, v.effectID, false);
		Util.addCombatEffecModificationData(effects, data, v, type, lv, mul, extraMul);
	}

	static addCustomString(v) {
		let desc = null;
		let cust = null;
		if (v.appliesWhen == "PostAttack") {
			switch (v.effectID) {
				case "melvorAoD:Cleansed":
				case "BGSCheat:Cleansed":
					desc = "CUSTOM_APPLICATOR_CLEANSED_ON_ATTACK";
					break;
				case "melvorF:Nulled":
				case "BGSCheat:Nulled":
					desc = "CUSTOM_APPLICATOR_NULLED_ON_ATTACK";
					break;
				case "melvorAoD:CrystalSanction":
				case "BGSCheat:CrystalSanction":
					desc = "CUSTOM_APPLICATOR_CRYSTALSANCTION_ON_ATTACK";
					break;
				case "melvorTotH:Shock":
				case "BGSCheat:Shock":
					desc = "CUSTOM_APPLICATOR_SHOCK_ON_ATTACK";
					break;
				case "melvorTotH:DarkBlade":
				case "BGSCheat:DarkBlade":
					desc = "CUSTOM_APPLICATOR_DARKBLADE_ON_ATTACK";
					break;
				case "melvorD:Crystallize":
				case "BGSCheat:Crystallize":
					desc = "CUSTOM_APPLICATOR_CRYSTALLIZATION_ON_ATTACK";
					break;
			}
			if (desc == null) {
				let e = game.combatEffects.getObjectByID(v.effectID);
				if (e && e?.effectGroups?.find(x => x.id == "melvorD:Curse"))
					desc = "CUSTOM_APPLICATOR_CURSE_ON_ATTACK";
			}
		}
		else if (v.appliesWhen == "HitWithAttack") {
			switch (v.effectID) {
				case "melvorD:Slow":
				case "BGSCheat:Slow":
					desc = "CUSTOM_APPLICATOR_SLOW_ON_HIT";
					break;
				case "melvorD:Stun":
				case "BGSCheat:Stun":
					desc = "CUSTOM_APPLICATOR_STUN_ON_HIT";
					break;
				case "melvorD:Freeze":
				case "BGSCheat:Freeze":
					desc = "CUSTOM_APPLICATOR_FREEZE_ON_HIT";
					break;
				case "melvorD:Sleep":
				case "BGSCheat:Sleep":
					desc = "CUSTOM_APPLICATOR_SLEEP_ON_HIT";
					break;
			}
		}
		if (v.appliesWhen == "BeingAttacked") {
			if (v.customDescription === undefined)
				desc = "EFFECT_APPLICATOR_WasAttacked";
		}
		else if (v.appliesWhen == "HitByAttack") {
			switch (v.effectID) {
				case "melvorAoD:Blind":
				case "BGSCheat:Blind":
					desc = "CUSTOM_APPLICATOR_BLIND_WHEN_HIT";
					break;
				case "melvorD:Sleep":
				case "BGSCheat:Sleep":
					desc = "CUSTOM_APPLICATOR_SLEEP_REFLECT";
					break;
				case "melvorF:BleedReflect":
				case "BGSCheat:BleedReflect":
					desc = "CUSTOM_APPLICATOR_BLEED_REFLECT";
					break;
				case "melvorD:Slow":
				case "BGSCheat:Slow":
					desc = "CUSTOM_APPLICATOR_SLOW_WHEN_HIT";
					break;
			}
		}
		else if (v.appliesWhen == "HitByFirstAttack") {
			switch (v.effectID) {
				case "melvorD:Frostburn":
				case "BGSCheat:Frostburn":
					desc = "CUSTOM_APPLICATOR_FROSTBURN_REFLECT";
					break;
			}
		}
		else if (v.appliesWhen == "StartOfFight" && (v.chance == 100 || v.chance === undefined)) {
			switch (v.effectID) {
				case "melvorD:EndOfTurnMaxHealing":
					desc = "CUSTOM_APPLICATOR_END_OF_TURN_MAX_HEALING";
					break;
				case "melvorD:EndOfTurnCurrentHealing":
					desc = "CUSTOM_APPLICATOR_END_OF_TURN_CURRENT_HEALING";
					break;
			}
			if (desc == null) {
				let e = game.combatEffects.getObjectByID(v.effectID);
				if (e && e?.effectGroups?.find(x => x.id == "melvorD:Curse"))
					desc = "CUSTOM_APPLICATOR_CURSE_ON_SPAWN";
			}
		}
		else if (v.appliesWhen == "SummonAttack") {
			switch (v.effectID) {
				case "melvorAoD:BarrierBleed":
				case "BGSCheat:BarrierBleed":
					desc = "CUSTOM_APPLICATOR_BARRIER_BLEED";
					break;
			}
		}

		if (v.effectID == "melvorAoD:UnholyMark" || v.effectID == "melvorAoD:UnholyMark")
			cust = "";
		if (desc && v.descriptionLang === undefined)
			v.descriptionLang = desc;
		if (cust && v.customDescription === undefined)
			v.customDescription = cust;
	}

	static generateEasyEffectModfication(effect, when, chance, params, others, desc, cust) {
		let v = [];
		if (effect == null || when == null)
			return null;
		v.push(effect);
		v.push(when);
		v.push(chance);
		v.push(params);
		v.push(others);
		v.push(desc);
		v.push(cust);
		return v;
	}

	static addCombatEffectModificationParams(effects, data, effect, when, chance, params, others, desc, cust, type, lv, mul, extraMul = 1) {
		let v = this.generateEasyEffectModfication(effect, when, chance, params, others, desc, cust);
		if (v == null)
			return;

		this.addCombatEffectModificationShortCut(effects, data, v, type, lv, mul, extraMul);
	}

	static addCombatEffectsModificationEasyParams(effects, data, key, effect, when, chance, params, others, desc, cust, type, lv, mul, extraMul = 1) {
		let v = this.generateEasyEffectModfication(effect, when, chance, params, others, desc, cust);
		if (v == null)
			return;

		this.addCombatEffectsModificationEasy(effects, data, key, v, type, lv, mul, extraMul);
	}

	static addCombatEffectsModificationEasy(effects, data, key, modData, type, lv, mul, extraMul = 1) {
		let _a = modData;
		let _b;
		if (_a instanceof Array) {
			if (_a[0] == "c") {
				_a.slice(1).forEach(x => {
					this.addCombatEffectsModificationEasy(effects, data, key, x, type, lv, mul, extraMul);
				});
				return;
			}
		}
		else {
			if (key != "cbeasy")
				return;
		}

		switch(key){
			case "cbeasy": {
				if (_a instanceof Array)
					this.addCombatEffectModificationShortCut(effects, data, _a, type, lv, mul, extraMul);
				else if (typeof (_a) == "object") {
					Object.entries(_a).forEach(x => {
						this.addCombatEffectsModificationEasy(effects, data, x[0], x[1], type, lv, mul, extraMul);
					});
				}
				break;
			}
			case "bunderwater":
			case "underwater": {
				if (key[0] == 'b') {
					Util.removeCombatEffecModificationData(effects, data, "melvorAoD:UnderwaterSlow");
					Util.removeCombatEffecModificationData(effects, data, "melvorAoD:UnderwaterAttackSpeed");
				}
				let id = key[0] == 'b' ? "BGSCheat:UnderwaterSlow" : "melvorAoD:UnderwaterSlow";
				this.addCombatEffectsModificationEasyParams(effects, data, "cbeasy", id, _a[0], _a[1] ? _a[1] : 100, _a[2], _a[3], _a[4] ? _a[4]:"MODIFIER_DATA_underwaterEffect", _a[5], type, lv, mul, extraMul);
				id = key[0] == 'b' ? "BGSCheat:UnderwaterAttackSpeed" : "melvorAoD:UnderwaterAttackSpeed";
				this.addCombatEffectsModificationEasyParams(effects, data, "cbeasy", id, _a[0], _a[1] ? _a[1] : 100, _a[2], _a[3], _a[4], _a[5] ? _a[5] : "", type, lv, mul, extraMul);
				break;
			}
			case "buffAuto":
			case "debuffAuto":
			case "debuff":
			case "buff": {
				if (_a[0] instanceof Array) {
					for (let m = 0; m < _a[0].length; ++m) {
						let v = [];
						v.push(_a[0][m]);
						v.push(..._a.slice(1));
						if (m > 0 && v[6] === undefined) {
							while (v.length < 7)
								v.push(0);
							v[6] = "";
						}
						this.addCombatEffectsModificationEasy(effects, data, key, v, type, lv, mul, extraMul);
					}
					return;
				}
				let k = _a[0];
				let defValue = 0;
				if (k[0] >= '0' && k[0] <= '9') {
					let d = 1;
					while (k[d] >= '0' && k[d] <= '9')
						++d;
					defValue = Number(k.slice(0, d));
					k = k.slice(d);
				}
				const b = (key == "buff" || key == "buffAuto");
				let id = null;
				switch (k) {
					case "accu":
					case "acc": id = b?"BGSCheat:BuffAccu":"BGSCheat:DebuffAccu"; break;
					case "eva": id = b?"BGSCheat:BuffEva":"BGSCheat:DebuffEva"; break;
					case "hit":
					case "maxHit": id = b?"BGSCheat:BuffMaxhit":"BGSCheat:DebuffMaxhit"; break;
					case "hitHp":
					case "maxHitOnHp": id = b?"BGSCheat:BuffMaxhitOnCurrHp":null; break;
					case "hitRes":
					case "maxHitOnRes": id = b?"BGSCheat:BuffMaxhitOnRes":null; break;
					case "hitTRes":
					case "maxHitOnTRes": id = b?"BGSCheat:BuffMaxhitOnTargetRes":null; break;
					case "spd": id = b?"BGSCheat:BuffSpd":"BGSCheat:DebuffSpd"; break;
					case "fspd": id = b?"BGSCheat:BuffFSpd":"BGSCheat:DebuffFSpd"; break;
					case "dmg": id = b?"BGSCheat:BuffDealt":"BGSCheat:DebuffDealt"; break;
					case "dmgS":
					case "dmgPerAtk": id = b?null:"BGSCheat:DebuffDmgPerAtk"; break;
					case "dmgOnHp": id = b?"BGSCheat:BuffDmgOnHp":null; break;
					case "dmgOnMHp": id = b?"BGSCheat:BuffDmgOnMaxHp":null; break;
					case "dmgOnSHP":
					case "dmgOnMHpSelf": id = b?"BGSCheat:BuffDmgOnMaxHpSelf":null; break;
					case "stDmg":
					case "stealDmgOnHp": id = b?"BGSCheat:BuffStealDmgOnHp":null; break;
					case "res": id = b?"BGSCheat:BuffRes":"BGSCheat:DebuffRes"; break;
					case "taken": id = b?"BGSCheat:BuffTaken":"BGSCheat:DebuffTaken"; break;
					case "dotTaken": id = b?"BGSCheat:BuffDot":"BGSCheat:DebuffDot"; break;
					case "takenOnHp": id = b?null:"BGSCheat:DebuffTakenOnHp"; break;
					case "hp": id = b?"BGSCheat:BuffHp":"BGSCheat:DebuffHp"; break;
					case "crit": id = b?"BGSCheat:BuffCrit":null; break;
					case "critMul": id = b?"BGSCheat:BuffCritMul":null; break;
					case "steal": id = b?"BGSCheat:BuffSteal":null; break;
				}
				if (id == null) {
					console.log(key + " has no such case: " + _a[0]);
					return;
				}
				let p = Object.assign({},_a[3]);
				if (p && (p.t || p.turns)) {
					id += "T";
				}
				if (typeof(p.category) == "string" || typeof(p.c) == "string") {
					let c = p.category ? p.category : p.c;
					let cv = 1;
					switch(c){
						case "weapon": 
						case "w": cv = 2; break;
						case "shield": 
						case "s": cv = 3; break;
						case "ammo": 
						case "a": cv = 5; break;
						case "helmet": 
						case "h": cv = 7; break;
						case "body": 
						case "b": cv = 11; break;
						case "legs": 
						case "l": cv = 13; break;
						case "boots": 
						case "o": cv = 17; break;
						case "gloves": 
						case "g": cv = 19; break;
						case "amulet": 
						case "m": cv = 23; break;
						case "ring": 
						case "r": cv = 29; break;
						case "gem": 
						case "e": cv = 31; break;
						case "consumable": 
						case "c": cv = 37; break;
						case "attack": 
						case "a": cv = 41; break;
					}
					if (cv > 1) {
						if (p.category)
							p.category = cv;
						else
							p.c = cv;
					}
				}

				if (defValue != 0 && !p.sa && !p.stacksToAdd && !p.si && !p.initialStacks) {
					p.stacksToAdd = defValue;
					p.initialStacks = defValue;
				}
				this.addCombatEffectModificationParams(effects, data, id, _a[1], _a[2] ? _a[2] : 100, p, _a[4], _a[5], typeof(_a[6]) == "string" ? _a[6] : null, type, lv, mul, extraMul);
				break;
			}
			default: {
				console.log("No such combat effect shortcut: " + key);
				break;
			}
		}
	}

	static addEasyValueInternal(statObject, data, key, value, mType, type, lv, mul, base, extraMul = 1) {
		let _v = value;
		switch (key) {
			case "modifiers": {
				if (data.modifiers == null)
					data.modifiers = {};
				let _a = data.modifiers;
				let _b = statObject.modifiers;
				_v.remove?.forEach(x => {
					Util.removeModifierModificationData(_b, _a, x);
				});
				if (_v.add) {
					if (_a.add == null)
						_a.add = {};
					Util.addModifiersData(_b, _a.add, _v.add, type, lv, mul, extraMul);
				}
				break;
			}
			case "enemyModifiers": {
				if (data.enemyModifiers == null)
					data.enemyModifiers = {};
				let _a = data.enemyModifiers ;
				let _b = statObject.enemyModifiers;
				_v.remove?.forEach(x => {
					Util.removeModifierModificationData(_b, _a, x);
				});
				if (_v.add) {
					if (_a.add == null)
						_a.add = {};
					Util.addModifiersData(_b, _a.add, _v.add, type, lv, mul, extraMul);
				}
				break;
			}
			case "conditionalModifiers": {
				if (data.conditionalModifiers == null)
					data.conditionalModifiers = {};
				let _a = data.conditionalModifiers ;
				if (_v.removed) {
					if (_a.removed == null)
						_a.removed = [];
					_a.removed.push(..._v.removed);
				}
				if (_v.add) {
					if (_a.add == null)
						_a.add = [];
					_v.add.forEach(x => {
						_a.add.push(Util.newConditionalModiferData(x, type, lv, mul, extraMul));
					});
				}
				break;
			}
			case "combatEffects": {
				if (data.combatEffects == null)
					data.combatEffects = {};
				let _a = data.combatEffects;
				let _b = statObject.combatEffects;
				_v.remove?.forEach(x => {
					Util.removeCombatEffecModificationData(_b, _a, x);
				});
				if (_v.add) {
					_v.add.forEach(x => {
						Util.addCombatEffecModificationData(_b, _a, x, type, lv, mul, extraMul);
					});
				}
				break;
			}
			case "buffAuto":
			case "debuffAuto": {
				if (_v.length < 2) {
					console.log("data is too less: " + statObject.id);
				}
				let c = null;
				statObject?.validSlots?.forEach(x => {
					if (c > 1) return;
					switch (x.id) {
						case "melvorD:Helmet": c = "helmet"; break;
						case "melvorD:Platebody": c = "body"; break;
						case "melvorD:Platelegs": c = "legs"; break;
						case "melvorD:Boots": c = "boots"; break;
						case "melvorD:Weapon": c = "weapon"; break;
						case "melvorD:Shield": c = "shield"; break;
						case "melvorD:Amulet": c = "amulet"; break;
						case "melvorD:Ring": c = "ring"; break;
						case "melvorD:Gloves": c = "gloves"; break;
						case "melvorD:Quiver": c = "ammo"; break;
						case "melvorD:Consumable": c = "consumable"; break;
						case "melvorD:Gem": c = "gem"; break;
					}
				});
				if (typeof(c) == "string") {
					let p = Object.assign({}, _v[3]);
					p.category = c;
					if (_v.length < 3)
						_v.push(100);
					if (_v.length < 4)
						_v.push(p);
					else
						_v[3] = p;
				}
				else {
					console.log("Can't find category for: " + statObject.id);
					return;
				}
			}
			case "buff":
			case "debuff": 
			case "cbeasy": {
				if (data.combatEffects == null)
					data.combatEffects = {};
				this.addCombatEffectsModificationEasy(statObject.combatEffects, data.combatEffects, key, _v, type, lv, mul, extraMul);
				break;
			}
			case "equipmentStats": {
				if (data.equipmentStats == null)
					data.equipmentStats = {};
				let _a = data.equipmentStats;
				let _b = statObject.equipmentStats;
				_a?.remove?.forEach(x => {
					Util.removeEquipmentStatModification(_b,_a, x);
				});
				if (_a.add)
					Util.addEquipmentStatsModification(_b, _a, _v, type, lv, mul, extraMul);
				break;
			}
			case "cstats": {
				if (data.equipmentStats == null)
					data.equipmentStats = {};
				let _a = data.equipmentStats;
				let _b = statObject.equipmentStats;
				Util.addEquipmentStatsAlias(_b, _a, _v.spd, _v.atk, _v.str, _v.def, _v.res, _v.sum, type, lv, mul, extraMul);
				break;
			}
			case "mstats": {
				if (data.equipmentStats == null)
					data.equipmentStats = {};
				let _a = data.equipmentStats;
				let _b = statObject.equipmentStats;

				Util.addEquipmentStatsAliasMul(_b, _a, _v.spd, _v.atk, _v.str, _v.def, _v.res, _v.sum, base, type, lv, mul, extraMul);
				break;
			}
			case "spd": return this.addEasyValueInternal(statObject, data, "cstats", {"spd":_v}, mType, type, lv, mul, base, extraMul);
			case "atks": return this.addEasyValueInternal(statObject, data, "cstats", {"atk":_v}, mType, type, lv, mul, base, extraMul);
			case "strs": return this.addEasyValueInternal(statObject, data, "cstats", {"str":_v}, mType, type, lv, mul, base, extraMul);
			case "defs": return this.addEasyValueInternal(statObject, data, "cstats", {"def":_v}, mType, type, lv, mul, base, extraMul);
			case "ress": return this.addEasyValueInternal(statObject, data, "cstats", {"res":_v}, mType, type, lv, mul, base, extraMul);
			case "sums": return this.addEasyValueInternal(statObject, data, "cstats", { "sum": _v }, mType, type, lv, mul, base, extraMul);
			case "mspd": return this.addEasyValueInternal(statObject, data, "mstats", {"spd":_v}, mType, type, lv, mul, base, extraMul);
			case "matks": return this.addEasyValueInternal(statObject, data, "mstats", {"atk":_v}, mType, type, lv, mul, base, extraMul);
			case "mstrs": return this.addEasyValueInternal(statObject, data, "mstats", {"str":_v}, mType, type, lv, mul, base, extraMul);
			case "mdefs": return this.addEasyValueInternal(statObject, data, "mstats", {"def":_v}, mType, type, lv, mul, base, extraMul);
			case "mress": return this.addEasyValueInternal(statObject, data, "mstats", {"res":_v}, mType, type, lv, mul, base, extraMul);
			case "msums": return this.addEasyValueInternal(statObject, data, "mstats", {"sum":_v}, mType, type, lv, mul, base, extraMul);
			case "spsa": {
				Util.addSpecialAttacksDataAlias(statObject, data, _v, type, lv, mul, extraMul);
				break;
			}
			case "spsar": {
				Util.removeAllSpecialAttackData(statObject.specialAttacks, data);
				Util.addSpecialAttacksDataAlias(statObject, data, _v, type, lv, mul, extraMul);
				break;
			}
			case "sps": {
				Util.addSpecialAttacksData(statObject, data, _v, type, lv, mul, extraMul);
				break;
			}
			case "spsr": {
				Util.removeAllSpecialAttackData(statObject.specialAttacks, data);
				Util.addSpecialAttacksData(statObject, data, _v, type, lv, mul, extraMul);
				break;
			}
			case "uniqueAttack": {
				if (attackData) {
					const atk = attackData.find(x => x.id == _v.id);
					if (atk) {
						let name = statObject.localID;
						Util.removeAllSpecialAttackData(statObject.specialAttacks, data);
						Util.levelUpSpecialAttack(name, atk, _v, type, lv, mul, extraMul);
						let v = { "specialAttacks": { "add": [`BGSCheat:${name}`] },"overrideSpecialChances":[0] };
						Util.addSpecialAttacksData(statObject, data, v, type, lv, mul, extraMul);
					}
				}
				break;
			}
			case "uniqueAtks": {
				if (attackData) {
					let order = 0;
					Util.removeAllSpecialAttackData(statObject.specialAttacks, data);
					_v.forEach(x => {
						const atk = attackData.find(y => y.id == x.id);
						if (atk) {
							let name = statObject.localID;
							name += order;
							order++;
							Util.levelUpSpecialAttack(name, atk, _v, type, lv, mul, extraMul);
							let v = { "specialAttacks": { "add": [`BGSCheat:${name}`] }, "overrideSpecialChances": [0] };
							Util.addSpecialAttacksData(statObject, data, v, type, lv, mul, extraMul);
						}
					});
				}
				break;
			}
			case "rm": {
				if (data.modifiers == null)
					data.modifiers = {};
				let _a = data.modifiers;
				_v?.forEach(x => {
					Util.removeModifierModificationData(statObject.modifiers, _a, x);
				});
				break;
			}
			case "rc": {
				if (data.combatEffects == null)
					data.combatEffects = {};
				let _a = data.combatEffects;
				_v?.forEach(x => {
					Util.removeCombatEffecModificationData(statObject.combatEffects, _a, x);
				});
				break;
			}
			case "rem": {
				if (data.enemyModifiers == null)
					data.enemyModifiers = {};
				let _a = data.enemyModifiers;
				_v?.forEach(x => {
					Util.removeModifierModificationData(statObject.modifiers, _a, x);
				});
				break;
			}
			case "rcm": {
				if (data.conditionalModifiers == null)
					data.conditionalModifiers = {};
				let _a = data.conditionalModifiers ;
				if (_a.removed == null)
					_a.removed = [];
				_a.removed.push(..._v);
				break;
			}
			case "rs": {
				if (data.equipmentStats == null)
					data.equipmentStats = {};
				let _b = statObject.equipmentStats;
				Util.removeEquipmentStatsAlias(_b, data, _v.atks ? _v.atks : [], _v.strs ? _v.strs : [], _v.defs ? _v.defs : [], _v.ress ? _v.ress : [], _v.sums ? _v.sums : []);
				break;
			}
			case "rsp": {
				Util.removeSpecialAttacksData(statObject, data, { "remove": _v });
				break;
			}
			case "rasp": {
				Util.removeAllSpecialAttackData(statObject.specialAttacks, data);
				break;
			}
			default: {
				if (mType == 'm') {
					if (data.modifiers == null)
						data.modifiers = {};
					this.addModifersModificationEasy(statObject.modifiers, data.modifiers, key, _v, type, lv, mul, extraMul);
				}
				if (mType == 'e') {
					if (data.enemyModifiers == null)
						data.enemyModifiers = {};
					this.addModifersModificationEasy(statObject.enemyModifiers, data.enemyModifiers , key, _v, type, lv, mul, extraMul);
				}
				if (mType == 'c') {
					if (data.combatEffects == null)
						data.combatEffects = {};
					this.addCombatEffectsModificationEasy(statObject.combatEffects, data.combatEffects, key, _v, type, lv, mul, extraMul);
				}
				break;
			}
		}
	}

	static addEasyValue(statObject, data, key, value, lv, mul, base = null, extraMul = 1) {
		let k = key;
		if (k[0] >= '0' && k[0] <= '9') {
			let d = 1;
			while (k[d] >= '0' && k[d] <= '9')
				++d;
			let uLv = Number(k.slice(0, d));
			if (lv < uLv)
				return;
			k = k.slice(d);
		}
		let type = 0;
		let mType = 'm';
		let i = k.indexOf(':');
		if (i > 0) {
			if (k[0] == 'l' || k[0] == 'v')
				type = 1;
			if (k[0] == 'm' || k[0] == 'u')
				type = 2;
			if (k[0] == 'o' || k[0] == 'v' || k[0] == 'u')
				type = type | 0x1000;
			if (i > 1) {
				if (k[1] == 'c')
					mType = 'c';
				if (k[1] == 'e')
					mType = 'e';
				if (k[1] == 'd')
					mType = 'd';
				if (k[1] == 's')
					mType = 's';
			}
		}
		else {
			if (k[0] == 'L' || k[0] == 'V')
				type = 1;
			if (k[0] == 'M' || k[0] == 'U')
				type = 2;
			if (k[0] == 'O' || k[0] == 'N')
				type = 3;
			if (k[0] == 'V' || k[0] == 'U' || k[0] == 'N')
				type = type | 0x1000;
			if (k[0] >= 'A' && k[0] <= 'Z')
				k = k.slice(1);
		}
		let name = i == -1 ? k : k.slice(i + 1);
		this.addEasyValueInternal(statObject, data, name, value, mType, type, lv, mul, base, extraMul);
	}
}
