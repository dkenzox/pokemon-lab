var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  RandomMNMLS: () => RandomMNMLS,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_teams = require("../gen9/teams");
class RandomMNMLS extends import_teams.RandomTeams {
  randomSets = require("./sets.json");
  randomMnMLSTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const seed = this.prng.getSeed();
    const ruleTable = this.dex.formats.getRuleTable(this.format);
    const pokemon = [];
    const isMonotype = !!this.forceMonotype || ruleTable.has("sametypeclause");
    const isDoubles = this.format.gameType !== "singles";
    const typePool = this.dex.types.names().filter((name) => name !== "Stellar");
    const type = this.forceMonotype || this.sample(typePool);
    const baseFormes = {};
    const typeCount = {};
    const typeComboCount = {};
    const typeWeaknesses = {};
    const typeDoubleWeaknesses = {};
    const teamDetails = {};
    let magicBouncers = 0;
    let pokemonList = Object.keys(this.randomSets);
    const CAPTiers = ["CAP", "CAP NFE", "CAP LC"];
    if (pokemonList.filter((mon) => CAPTiers.includes(this.dex.species.get(mon).tier)).length >= 6) {
      if (ruleTable.has("+tag:cap"))
        pokemonList = pokemonList.filter((mon) => CAPTiers.includes(this.dex.species.get(mon).tier));
      else
        pokemonList = pokemonList.filter((mon) => !CAPTiers.includes(this.dex.species.get(mon).tier));
    }
    const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(type, pokemon, isMonotype, pokemonList);
    while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
      const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
      const species = this.dex.species.get(this.sample(pokemonPool[baseSpecies]));
      if (!species.exists) continue;
      if (baseFormes[species.baseSpecies]) continue;
      if (["ogerpon", "ogerponhearthflame", "terapagos"].includes(species.id) && teamDetails.teraBlast) continue;
      if (species.baseSpecies === "Zoroark" && pokemon.length >= this.maxTeamSize - 1) continue;
      const types = species.types;
      const typeCombo = types.slice().sort().join();
      const weakToFreezeDry = this.dex.getEffectiveness("Ice", species) > 0 || this.dex.getEffectiveness("Ice", species) > -2 && types.includes("Water");
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      if (!isMonotype && !this.forceMonotype) {
        let skip = false;
        for (const typeName of types) {
          if (typeCount[typeName] >= 2 * limitFactor) {
            skip = true;
            break;
          }
        }
        if (skip) continue;
        for (const typeName of this.dex.types.names()) {
          if (this.dex.getEffectiveness(typeName, species) > 0) {
            if (!typeWeaknesses[typeName]) typeWeaknesses[typeName] = 0;
            if (typeWeaknesses[typeName] >= 3 * limitFactor) {
              skip = true;
              break;
            }
          }
          if (this.dex.getEffectiveness(typeName, species) > 1) {
            if (!typeDoubleWeaknesses[typeName]) typeDoubleWeaknesses[typeName] = 0;
            if (typeDoubleWeaknesses[typeName] >= limitFactor) {
              skip = true;
              break;
            }
          }
        }
        if (skip) continue;
        if (this.dex.getEffectiveness("Fire", species) === 0 && Object.values(species.abilities).filter((a) => ["Dry Skin", "Fluffy"].includes(a)).length) {
          if (!typeWeaknesses["Fire"]) typeWeaknesses["Fire"] = 0;
          if (typeWeaknesses["Fire"] >= 3 * limitFactor) continue;
        }
        if (weakToFreezeDry) {
          if (!typeWeaknesses["Freeze-Dry"]) typeWeaknesses["Freeze-Dry"] = 0;
          if (typeWeaknesses["Freeze-Dry"] >= 4 * limitFactor) continue;
        }
        if ((species.id === "fezandipiti" || species.id === "jirachi" || species.id === "ursalunabloodmoon") && magicBouncers >= 1) {
          continue;
        }
        if (!this.getPokemonCompatibility(species, pokemon, isDoubles)) continue;
      }
      if (!this.forceMonotype && isMonotype && typeComboCount[typeCombo] >= 3 * limitFactor) continue;
      const set = this.randomSet(species, teamDetails, false, isDoubles);
      pokemon.push(set);
      if (pokemon.length === this.maxTeamSize) break;
      baseFormes[species.baseSpecies] = 1;
      for (const typeName of types) {
        if (typeName in typeCount) {
          typeCount[typeName]++;
        } else {
          typeCount[typeName] = 1;
        }
      }
      if (typeCombo in typeComboCount) {
        typeComboCount[typeCombo]++;
      } else {
        typeComboCount[typeCombo] = 1;
      }
      for (const typeName of this.dex.types.names()) {
        if (this.dex.getEffectiveness(typeName, species) > 0) {
          typeWeaknesses[typeName]++;
        }
        if (this.dex.getEffectiveness(typeName, species) > 1) {
          typeDoubleWeaknesses[typeName]++;
        }
      }
      if (["Dry Skin", "Fluffy"].includes(set.ability) && this.dex.getEffectiveness("Fire", species) === 0) {
        typeWeaknesses["Fire"]++;
      }
      if (weakToFreezeDry) typeWeaknesses["Freeze-Dry"]++;
      if (species.id === "fezandipiti" || species.id === "jirachi" || species.id === "ursalunabloodmoon") magicBouncers++;
      if (set.ability === "Drizzle" || set.moves.includes("raindance")) teamDetails.rain = 1;
      if (set.ability === "Drought" || set.ability === "Orichalcum Pulse" || set.moves.includes("sunnyday")) {
        teamDetails.sun = 1;
      }
      if (set.ability === "Sand Stream") teamDetails.sand = 1;
      if (set.ability === "Snow Warning" || set.moves.includes("snowscape") || set.moves.includes("chillyreception")) {
        teamDetails.snow = 1;
      }
      if (set.moves.includes("healbell")) teamDetails.statusCure = 1;
      if (set.moves.includes("spikes") || set.moves.includes("ceaselessedge")) {
        teamDetails.spikes = (teamDetails.spikes || 0) + 1;
      }
      if (set.moves.includes("toxicspikes") || set.ability === "Toxic Debris") teamDetails.toxicSpikes = 1;
      if (set.moves.includes("stealthrock") || set.moves.includes("stoneaxe")) teamDetails.stealthRock = 1;
      if (set.moves.includes("stickyweb")) teamDetails.stickyWeb = 1;
      if (set.moves.includes("defog")) teamDetails.defog = 1;
      if (set.moves.includes("rapidspin") || set.moves.includes("mortalspin")) teamDetails.rapidSpin = 1;
      if (set.moves.includes("auroraveil") || set.moves.includes("reflect") && set.moves.includes("lightscreen")) {
        teamDetails.screens = 1;
      }
      if (set.role === "Tera Blast user" || ["ogerpon", "ogerponhearthflame", "terapagos"].includes(species.id)) {
        teamDetails.teraBlast = 1;
      }
    }
    if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
  /* All items are generated in getItem, so we shouldn't override anything */
  getPriorityItem(ability, types, moves, counter, teamDetails, species, isLead, teraType, role, isDoubles) {
    return;
  }
  getItem(ability, types, moves, counter, teamDetails, species, isLead, teraType, role) {
    if (species.id === "dragonite") return "Scizorite";
    if (species.id === "garganacl") return "Scraftinite";
    if (species.id === "greattusk") return "Lopunnite";
    if (species.id === "heatran") return "Garchompite Z";
    if (species.id === "pecharunt") return "Gyaradosite";
    if (species.id === "ragingbolt" || species.id === "landorustherian") return "Manectite";
    if (species.id === "annihilape") return "Crabominite";
    if (species.id === "archaludon") return "Blue Orb";
    if (species.id === "ceruledge") return "Eelektrossite";
    if (species.id === "gholdengo") return "Magearnite";
    if (species.id === "gougingfire" || species.id === "revavroom") return "Pinsirite";
    if (species.id === "magearna") return "Metagrossite";
    if (species.id === "roaringmoon") return "Sharpedonite";
    if (species.id === "walkingwake") return "Charizardite Y";
    if (species.id === "darkrai") return "Hawluchanite";
    if (species.id === "dragapult" || species.id === "zamazenta") return "Red Orb";
    if (species.id === "gengar") return "Dragoninite";
    if (species.id === "ironboulder") return "Aerodactylite";
    if (species.id === "regieleki" || species.id === "flygon") return "Altarianite";
    if (species.id === "shayminsky" || species.id === "umbreon") return "Meganiumite";
    if (species.id === "weavile") return "Zygardite";
    if (species.id === "mandibuzz") return "Mawilite";
    if (species.id === "skarmory") return "Starminite";
    if (species.id === "salazzle") return "Beedrillite";
    if (species.id === "mamoswine") return "Lucarionite Z";
    if (species.id === "fezandipiti" || species.id === "jirachi") return "Clefablite";
    if (species.id === "hippowdon" || species.id === "rhyperior") return "Steelixite";
    if (species.id === "drifblim") return "Victreebelite";
    if (species.id === "tinkaton") return "Banettite";
    if (species.id === "hydreigon" || species.id === "ironmoth") return "Chimechite";
    if (species.id === "lugia") return "Wellspring Mask";
    if (species.id === "kyuremblack") return "Zap Plate";
    if (species.id === "regigigas") return "Iron Plate";
    if (species.id === "palossand") return "Kangaskhanite";
    if (species.id === "vikavolt") return "Aggronite";
    if (species.id === "fluttermane") return "Cornerstone Mask";
    if (species.id === "rotomwash") return "Pidgeotite";
    if (species.id === "hariyama" || species.id === "bronzong") return "Scolipite";
    if (species.id === "ursalunabloodmoon") return "Sablenite";
    if (species.id === "screamtail") return "Gardevoirite";
    if (species.id === "politoed") return "Swampertite";
    if (species.id === "cryogonal") return "Froslassite";
    if (species.id === "tinglu") return "Tyranitarite";
    if (species.id === "brutebonnet") return "Staraptite";
    if (species.id === "arcanine" || species.id === "hoopaunbound") return "Absolite";
    if (species.id === "zapdos") return "Raichunite X";
    if (species.id === "dialga") return "Griseous Core";
    if (species.id === "overqwil") return "Falinksite";
    if (species.id === "mimikyu") return "Garchompite";
    if (species.id === "appletun") return "Ampharosite";
    if (species.id === "lucario") return "Feraligite";
    if (species.id === "baxcalibur") return "Heracronite";
    if (species.id === "floatzel") return "Barbaracite";
    if (species.id === "ironhands") return "Dragalgite";
    if (species.id === "empoleon") return "Abomasite";
    if (species.id === "gastrodon" || species.id === "primarina") return "Chandelurite";
    if (species.id === "slitherwing") return "Drampanite";
    if (species.id === "corviknight") return "Venusaurite";
    if (species.id === "lunala") return "Pixie Plate";
    if (species.id === "groudon") return "Hearthflame Mask";
    if (species.id === "zacian") return "Fighting Memory";
    if (species.id === "goodra") return "Audinite";
    if (species.id === "milotic") return "Excadrite";
    if (species.id === "glimmora") return "Gengarite";
    else return "Life Orb";
  }
}
var stdin_default = RandomMNMLS;
