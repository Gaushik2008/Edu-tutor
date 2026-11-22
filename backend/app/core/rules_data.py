"""Misconception rules: single source of truth for the Python engine AND the JS demo
(demo/build.py injects these into the page). Patterns run on lower-cased text.
`unless` patterns veto a match (e.g. the correct statement shares keywords)."""
RULES = [
 dict(tag="R_UP_I_UP", concept="ohms_law",
  label="Believes current rises when resistance rises",
  fix="Use I = V/R with V = 10 V: R = 2 Ω gives 5 A, R = 5 Ω gives 2 A.",
  patterns=[
   r"\b(resistance|r)\b.{0,40}\b(increas\w*|higher|more|bigger|greater|larger|goes up|rises?)\b.{0,60}\bcurrent\b.{0,30}\b(increas\w*|higher|more|bigger|greater|larger|rises?|goes up)\b",
   r"\bcurrent\b.{0,30}\b(increas\w*|rises?|goes up|higher|bigger|more)\b.{0,40}\b(resistance|r)\b.{0,30}\b(increas\w*|higher|more|bigger|greater|goes up)",
   r"\b(more|higher|greater|bigger|increased?)\s+(resistance|r)\b.{0,30}\b(more|higher|greater|bigger)\s+current\b",
  ]),
 dict(tag="CURRENT_USED_UP", concept="electric_current",
  label="Thinks current is used up as it passes through a component",
  fix="Show ammeters before and after a bulb reading equal; energy, not charge, is transferred.",
  patterns=[
   r"\b(current|charge)\b.{0,40}\b(used up|use up|uses up|consumed|consumes|gets less|lost|disappear\w*|eaten|eats)\b",
   r"\b(uses?|used|eats?|consumes?|absorbs?)\b( up)?( some of| most of| all of)?( the| some)? current",
   r"used up by the (bulb|resistor)",
  ]),
 dict(tag="PARALLEL_ADDS", concept="parallel_combination",
  label="Adds resistances directly in a parallel combination",
  fix="Derive 1/Rp = 1/R1 + 1/R2; Rp is smaller than the smallest branch.",
  patterns=[
   r"parallel\b.{0,60}\b(add|sum|total of)\b",
   r"\badd(ed|ing)?\b.{0,60}parallel",
  ], unless=[r"reciprocal", r"1\s*/\s*r"]),
 dict(tag="SERIES_SPLITS_I", concept="series_combination",
  label="Thinks current divides between resistors in series",
  fix="Current is identical in a series loop; the voltage divides.",
  patterns=[
   r"series\b.{0,60}\bcurrent\b.{0,40}\b(divid\w*|split\w*|shar\w*)",
   r"\bcurrent\b.{0,50}\b(divid\w*|split\w*|shar\w*)\b.{0,50}\bseries",
  ], unless=[r"\b(same|equal|constant)\b.{0,30}current", r"current.{0,30}\b(same|equal|constant)\b"]),
 dict(tag="POWER_I_ONLY", concept="electric_power",
  label="Uses an incorrect relation for electric power",
  fix="Start from P = VI, then combine with Ohm’s law to get I²R and V²/R.",
  patterns=[
   r"\bpower\b.{0,15}(=|is|equals)\s*(the )?(v\s*/\s*i|i\s*/\s*v|current (divided by|over) voltage|voltage (divided by|over) current)",
   r"\bp\s*=\s*(v\s*/\s*i|i\s*/\s*v)",
   r"power depends only on",
  ]),
 dict(tag="RESIST_LENGTH_INV", concept="resistance_factors",
  label="Believes longer wires have lower resistance",
  fix="R = ρL/A: doubling the length doubles R. Use a long narrow pipe as an analogy.",
  patterns=[
   r"(longer|length)\b.{0,50}\b(less|lower|decreas\w*|smaller|reduc\w*)\b.{0,30}resist",
   r"(longer|length)\b.{0,30}resist\w*.{0,20}\b(decreas\w*|less|lower|smaller)",
   r"\bshort(er)?\b.{0,40}\b(more|higher|greater|larger|bigger)\b.{0,20}resist",
  ]),
 dict(tag="PD_IS_CURRENT", concept="electric_current",
  label="Confuses potential difference with current",
  fix="Current is charge per second; potential difference is energy per coulomb.",
  patterns=[
   r"\b(voltage|potential difference|pd)\b.{0,20}\b(is|means|equals|=)\b.{0,30}\b(current|flow of charge|rate of flow)",
  ]),
 dict(tag="CONV_CURRENT_DIR", concept="electric_circuit",
  label="Reverses the direction of conventional current",
  fix="Conventional current runs from the positive terminal round to the negative; electrons drift the other way.",
  patterns=[
   r"\bcurrent\b.{0,50}\b(from|flows? from|goes from|runs)\b.{0,15}\bnegative\b.{0,25}\bto\b.{0,15}\bpositive",
   r"\bcurrent\b.{0,30}\bnegative\b.{0,25}\bto\b.{0,15}\bpositive",
  ], unless=[r"\belectron\w* (flow|move|drift|travel|go|current)\b"]),
 dict(tag="HEAT_I_LINEAR", concept="heating_effect",
  label="Thinks heat is proportional to current instead of current squared",
  fix="H = I²Rt: doubling I gives four times the heat. Try I = 1 A and 2 A.",
  patterns=[
   r"heat\b.{0,40}proportional to (the )?(current|i)\b(?!\s*(squared|\^2|²))",
   r"\bcurrent\b.{0,30}\b(doubled?|doubles|twice|tripled)\b.{0,40}\bheat\b.{0,25}\b(doubled?|doubles|twice|tripled)\b",
   r"\bheat\b.{0,30}\b(doubled?|doubles|twice)\b.{0,40}\bcurrent\b",
  ], unless=[r"squared|\^2|²|four times|4 times"]),
]
