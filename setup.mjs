const { settings, characterStorage, patch} = mod.getContext(import.meta);

export class CheatManaget{
	levelFormula;
	mySetting;
	formulaType;
	formulaInput;
	maxLevel;
	agilityManager;
	astrologyManager;
	smithingManager;
	fletchingManager;
	craftingManager;
	runecraftingManager;
	herbloreManager;
	archaeologyManager;
	levelMultiplierFunction;

	constructor(){
		this.levelFormula = new mod.api.BGSCheat.LevelUpFormula();
		this.mySetting = settings.section("BGSCheat");
		this.formulaType = 0;
		this.formulaInput = null;
		this.maxLevel = 20;
	}

	async init(ctx){
		this.levelMultiplierFunction = await mod.api.BGSCheat.Util.getFunction("return ((lv<0)?0:(lv<11)?lv*0.1:(lv<20)?(lv-10)*(lv-9)*0.5+1:100)");
		await this.initSettings();
		await this.loadSkills(ctx);
	}

	initCharacter(ctx){
		this.loadLevelTable();
		this.agilityManager.initCharacter();
		this.astrologyManager.initCharacter();
		this.smithingManager.initCharacter();
		this.fletchingManager.initCharacter();
		this.craftingManager.initCharacter();
		this.runecraftingManager.initCharacter();
		this.herbloreManager.initCharacter();
		this.archaeologyManager.initCharacter();
	}

	initSettings(){
		this.mySetting.add([
			{
				type: "dropdown",
				name: "LevelFormula",
				label: "Level Formula",
				hint: "Level formula for mastery xp.",
				default: 1,
				options: [
					{
						value: 1,
						display: Object.assign(document.createElement('span'), { innerHTML: 'Custom (Javascript Code)' })
					},
					{
						value: 2,
						display: Object.assign(document.createElement('span'), { innerHTML: 'Custom (XP table)' })
					}
				],
				onChange: (val, prev) => {
					this.formulaType = val;
					this.loadMasteryXpSettings(this.mySetting.get("FormulaInput") ?? null);
					this.initLevelTable();
					this.updateSkillsLevelTables();
				}
			},
			{
				type: "text",
				name: "FormulaInput",
				label: "Input for Custom Formula",
				hint: "See custom formula manual at the bottom of the dialog.",
				default: "[[9,2,0.6,8,0.4,2]]",
				default: "return 90000*(lv+2)**0.6*8**(0.4*(lv+2))",
				onChange: (val, prev) => {
					this.loadMasteryXpSettings(val);
					this.initLevelTable();
					this.updateSkillsLevelTables();
				}
			},
			{
				type: "label",
				name: "FormulaManual",
				label: Object.assign(document.createElement('span'), { innerHTML: '<font size="5" color="#99ee99">Custom Formula Manual</font><br/><hr/>' }),
				hint: Object.assign(document.createElement('span'), { innerHTML: '\
					<p>The formula input for mastery xp expect one of three formats.</p>\
					<dl>\
						<dt><font color="#ee99ee">Javascript code</font></dt>\
						<dd><p>The mod expected to get a simple java code to calculate the xp need from level <i>lv</i>-1 to level <i>lv</i>. The code should retrun a number.</p>\
							<p>For example, the code<br/>\
								let s=lv<5?lv:4+lv/5>>0;return Math.pow(2,s)<br/>means<br/>\
								The table of xp to next level is 2,4,8,16,32,32,32,32,32,64,64...<br/>\
							</p>\
							<p>You can expect three variable:\
								<ul>\
									<li><b>lv</b>: The level to be calculated.</li>\
									<li><b>lxp</b>: The required xp from <i>lv</i> - 2 to <i>lv</i> - 1.</li>\
									<li><b>lsxp</b>: The total required xp from 0 to <i>lv</i> - 1.</li>\
								</ul>\
							</p>\
						</dd>\
						<dt><font color="#ee99ee">XP Table</font></dt>\
						<dd><p>A number arry. The xp table for evary level.</p>\
							<p>For example,<br/>[1,2,3,4,5]<br/>means<br/>\
								1,2,3,4,5,5,5,5...<br/>\
							</p>\
						</dd>\
					</dl>\
				'}),
			}
		]);
	}

	loadMasteryXpSettings(input){
		this.formulaInput = null;
		if (this.formulaType == 0 || this.formulaType == 2){
			try{
				this.formulaInput = JSON.parse(input);
			}
			catch(e){
			}
		}
		else
			this.formulaInput = input;
	}

	initLevelTable(){
		this.levelFormula.cleanFormula();
		if (this.formulaInput == null){
			this.levelFormula.defaultTables(this.maxLevel);
		}
		else{
			try{
				if (this.formulaType == 0){
					this.levelFormula.setSumFormulas(this.formulaInput);
					this.levelFormula.calcTables(this.maxLevel);
				}
				else if (this.formulaType == 1){
					this.levelFormula.setStringFormula(this.formulaInput);
					this.levelFormula.calcTables(this.maxLevel);
				}
				else
					this.levelFormula.setTable(this.formulaInput, this.maxLevel);
			}
			catch(e){
				this.levelFormula.cleanFormula();
				this.levelFormula.defaultTables(this.maxLevel);
			}
		}
		console.log("Init table: " + this.levelFormula.tableUpValues);
		console.log("Total Table: " + this.levelFormula.tableTotalUpValues);
	}

	updateSkillsLevelTables(){
		this.agilityManager.reformulaAgility();
		this.astrologyManager.updateAstrology();
		this.smithingManager.updateItems();
		this.fletchingManager.updateItems();
		this.craftingManager.updateItems();
		this.runecraftingManager.updateItems();
		this.herbloreManager.updateItems();
		this.archaeologyManager.updateItems();
	}

	async loadSkills(ctx){
		const { AgilityCheatManager } = await ctx.loadModule("agility/agility.mjs");
		this.agilityManager = await new AgilityCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.agilityManager.init(ctx);

		const { AstrologyCheatManager } = await ctx.loadModule("astrology/astrology.mjs");

		this.astrologyManager = await new AstrologyCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.astrologyManager.init(ctx);

		const { ItemTool, SkillCheatManager} = await ctx.loadModule("item/item.mjs");
		await ctx.api({ItemTool});

		let atkData = await ctx.loadData("item/attackData.json");
		mod.api.BGSCheat.EasyTool.setAttackData(atkData);

		this.smithingManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.smithingManager.init(ctx, Smithing, game.smithing, "smithing/item.json", "smithing/skill.json");
		this.fletchingManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.fletchingManager.init(ctx, Fletching, game.fletching, "fletching/item.json", "fletching/skill.json");
		this.craftingManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.craftingManager.init(ctx, Crafting, game.crafting, "crafting/item.json", "crafting/skill.json");
		this.runecraftingManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.runecraftingManager.init(ctx, Runecrafting, game.runecrafting, "runecrafting/item.json", "runecrafting/skill.json");
		this.herbloreManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.herbloreManager.init(ctx, Herblore, game.herblore, "herblore/item.json", "herblore/skill.json");
		this.archaeologyManager = await new SkillCheatManager(this.levelFormula, this.levelMultiplierFunction);
		await this.archaeologyManager.init(ctx, Archaeology, game.archaeology, "archaeology/item.json", "archaeology/skill.json");
	}

	loadLevelTable(){
		this.formulaType = this.mySetting.get("LevelFormula") ?? 0;
		this.loadMasteryXpSettings(this.mySetting.get("FormulaInput")) ?? null;
		this.initLevelTable();
	}
}

async function modifyMyDataLang(){
	let specialAttacks = await game.specialAttacks.filter(x=>x.namespace === "BGSCheat");
	await specialAttacks.forEach(x=>{
		if (x.localID==null || x.localID.length == 0)
			return;
		let n = x.localID;
		if (n[n.length - 1] >= '0' && n[n.length - 1] <= '9')
			n = n.slice(0,-1);
		let newName = loadedLangJson[`SPECIAL_ATTACK_NAME_${n}`];
		let newDesc = loadedLangJson[`SPECIAL_ATTACK_${n}`];
		if (newName)
			x._name = newName;
		if (newDesc){
			x._description = newDesc;
			delete x._modifiedDescription;
		}
	});
}

export async function setup(ctx) {

	if (cloudManager.hasAoDEntitlement){
		await ctx.gameData.addPackage('MyMode.json');
		let theMode = await game.gamemodes.getObjectByID("BGSCheat:BGSARMode");
		if (theMode!==undefined){
			await game.skills.forEach(s => {
				let r = s.rareDrops.find(x => x.item.id.includes('_Lesser_Relic'));
				if (r!==undefined)
					r.gamemodes.push(theMode);
			});
		}
	}

	await modifyMyDataLang();

	const { Util,EasyTool,LevelUpFormula} = await ctx.loadModule("Util.mjs");
	await ctx.api({Util,EasyTool,LevelUpFormula});

	let cheatManager = new CheatManaget();
	await cheatManager.init(ctx);

	await ctx.onCharacterLoaded(async() => {
		await cheatManager.initCharacter(ctx);
	});
}
