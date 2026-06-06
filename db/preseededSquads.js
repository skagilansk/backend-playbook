// preseededSquads.js — Static local database for Premier League and La Liga teams
// Provides instant offline squad and match rosters for top teams to avoid API limits.

const squads = {
  "arsenal": {
    "teamName": "Arsenal",
    "formation": "4-3-3",
    "starters": [
      {
        "number": 22,
        "name": "David Raya",
        "position": "GK"
      },
      {
        "number": 4,
        "name": "Ben White",
        "position": "RB"
      },
      {
        "number": 2,
        "name": "William Saliba",
        "position": "CB"
      },
      {
        "number": 6,
        "name": "Gabriel Magalhães",
        "position": "CB"
      },
      {
        "number": 12,
        "name": "Jurrien Timber",
        "position": "LB"
      },
      {
        "number": 5,
        "name": "Thomas Partey",
        "position": "CDM"
      },
      {
        "number": 41,
        "name": "Declan Rice",
        "position": "CM"
      },
      {
        "number": 8,
        "name": "Martin Ødegaard",
        "position": "CAM"
      },
      {
        "number": 7,
        "name": "Bukayo Saka",
        "position": "RW"
      },
      {
        "number": 11,
        "name": "Gabriel Martinelli",
        "position": "LW"
      },
      {
        "number": 29,
        "name": "Kai Havertz",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 32,
        "name": "Neto",
        "position": "GK"
      },
      {
        "number": 33,
        "name": "Riccardo Calafiori",
        "position": "CB"
      },
      {
        "number": 15,
        "name": "Jakub Kiwior",
        "position": "LB"
      },
      {
        "number": 20,
        "name": "Jorginho",
        "position": "CDM"
      },
      {
        "number": 23,
        "name": "Mikel Merino",
        "position": "CM"
      },
      {
        "number": 19,
        "name": "Leandro Trossard",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Gabriel Jesus",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-18",
        "home": "Arsenal",
        "away": "Everton",
        "score": "2-0",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-11",
        "home": "Manchester United",
        "away": "Arsenal",
        "score": "1-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-04",
        "home": "Arsenal",
        "away": "Bournemouth",
        "score": "3-0",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-28",
        "home": "Tottenham Hotspur",
        "away": "Arsenal",
        "score": "2-3",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-21",
        "home": "Arsenal",
        "away": "Chelsea",
        "score": "5-0",
        "result": "W",
        "competition": "Premier League"
      }
    ]
  },
  "chelsea": {
    "teamName": "Chelsea",
    "formation": "4-2-3-1",
    "starters": [
      {
        "number": 1,
        "name": "Robert Sánchez",
        "position": "GK"
      },
      {
        "number": 27,
        "name": "Malo Gusto",
        "position": "RB"
      },
      {
        "number": 29,
        "name": "Wesley Fofana",
        "position": "CB"
      },
      {
        "number": 6,
        "name": "Levi Colwill",
        "position": "CB"
      },
      {
        "number": 3,
        "name": "Marc Cucurella",
        "position": "LB"
      },
      {
        "number": 25,
        "name": "Moises Caicedo",
        "position": "CDM"
      },
      {
        "number": 8,
        "name": "Enzo Fernández",
        "position": "CM"
      },
      {
        "number": 11,
        "name": "Noni Madueke",
        "position": "RW"
      },
      {
        "number": 20,
        "name": "Cole Palmer",
        "position": "CAM"
      },
      {
        "number": 19,
        "name": "Jadon Sancho",
        "position": "LW"
      },
      {
        "number": 15,
        "name": "Nicolas Jackson",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 12,
        "name": "Filip Jörgensen",
        "position": "GK"
      },
      {
        "number": 5,
        "name": "Benoit Badiashile",
        "position": "CB"
      },
      {
        "number": 40,
        "name": "Renato Veiga",
        "position": "LB"
      },
      {
        "number": 45,
        "name": "Romeo Lavia",
        "position": "CDM"
      },
      {
        "number": 7,
        "name": "Pedro Neto",
        "position": "RW"
      },
      {
        "number": 14,
        "name": "João Félix",
        "position": "CAM"
      },
      {
        "number": 18,
        "name": "Christopher Nkunku",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-19",
        "home": "Chelsea",
        "away": "Tottenham Hotspur",
        "score": "2-1",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-12",
        "home": "Nottingham Forest",
        "away": "Chelsea",
        "score": "2-3",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-05",
        "home": "Chelsea",
        "away": "West Ham United",
        "score": "5-0",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-27",
        "home": "Aston Villa",
        "away": "Chelsea",
        "score": "2-2",
        "result": "D",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-21",
        "home": "Arsenal",
        "away": "Chelsea",
        "score": "5-0",
        "result": "L",
        "competition": "Premier League"
      }
    ]
  },
  "mancity": {
    "teamName": "Manchester City",
    "formation": "4-3-3",
    "starters": [
      {
        "number": 31,
        "name": "Ederson",
        "position": "GK"
      },
      {
        "number": 82,
        "name": "Rico Lewis",
        "position": "RB"
      },
      {
        "number": 3,
        "name": "Rúben Dias",
        "position": "CB"
      },
      {
        "number": 25,
        "name": "Manuel Akanji",
        "position": "CB"
      },
      {
        "number": 24,
        "name": "Josko Gvardiol",
        "position": "LB"
      },
      {
        "number": 16,
        "name": "Rodri",
        "position": "CDM"
      },
      {
        "number": 8,
        "name": "Mateo Kovacic",
        "position": "CM"
      },
      {
        "number": 17,
        "name": "Kevin De Bruyne",
        "position": "CAM"
      },
      {
        "number": 20,
        "name": "Bernardo Silva",
        "position": "RW"
      },
      {
        "number": 47,
        "name": "Phil Foden",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Erling Haaland",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 18,
        "name": "Stefan Ortega",
        "position": "GK"
      },
      {
        "number": 5,
        "name": "John Stones",
        "position": "CB"
      },
      {
        "number": 6,
        "name": "Nathan Aké",
        "position": "LB"
      },
      {
        "number": 19,
        "name": "Ilkay Gündogan",
        "position": "CM"
      },
      {
        "number": 27,
        "name": "Matheus Nunes",
        "position": "CM"
      },
      {
        "number": 11,
        "name": "Jérémy Doku",
        "position": "LW"
      },
      {
        "number": 26,
        "name": "Savinho",
        "position": "RW"
      }
    ],
    "matches": [
      {
        "date": "2026-05-18",
        "home": "Manchester City",
        "away": "West Ham United",
        "score": "3-1",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-11",
        "home": "Tottenham Hotspur",
        "away": "Manchester City",
        "score": "0-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-04",
        "home": "Manchester City",
        "away": "Wolverhampton",
        "score": "5-1",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-28",
        "home": "Nottingham Forest",
        "away": "Manchester City",
        "score": "0-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-25",
        "home": "Brighton",
        "away": "Manchester City",
        "score": "0-4",
        "result": "W",
        "competition": "Premier League"
      }
    ]
  },
  "manunited": {
    "teamName": "Manchester United",
    "formation": "4-2-3-1",
    "starters": [
      {
        "number": 24,
        "name": "André Onana",
        "position": "GK"
      },
      {
        "number": 20,
        "name": "Diogo Dalot",
        "position": "RB"
      },
      {
        "number": 4,
        "name": "Matthijs de Ligt",
        "position": "CB"
      },
      {
        "number": 6,
        "name": "Lisandro Martínez",
        "position": "CB"
      },
      {
        "number": 3,
        "name": "Noussair Mazraoui",
        "position": "LB"
      },
      {
        "number": 18,
        "name": "Casemiro",
        "position": "CDM"
      },
      {
        "number": 37,
        "name": "Kobbie Mainoo",
        "position": "CM"
      },
      {
        "number": 16,
        "name": "Amad Diallo",
        "position": "RW"
      },
      {
        "number": 8,
        "name": "Bruno Fernandes",
        "position": "CAM"
      },
      {
        "number": 17,
        "name": "Alejandro Garnacho",
        "position": "LW"
      },
      {
        "number": 11,
        "name": "Rasmus Højlund",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 1,
        "name": "Altay Bayindir",
        "position": "GK"
      },
      {
        "number": 5,
        "name": "Harry Maguire",
        "position": "CB"
      },
      {
        "number": 23,
        "name": "Luke Shaw",
        "position": "LB"
      },
      {
        "number": 14,
        "name": "Christian Eriksen",
        "position": "CM"
      },
      {
        "number": 25,
        "name": "Manuel Ugarte",
        "position": "CDM"
      },
      {
        "number": 10,
        "name": "Marcus Rashford",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Joshua Zirkzee",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-19",
        "home": "Brighton",
        "away": "Manchester United",
        "score": "0-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-15",
        "home": "Manchester United",
        "away": "Newcastle United",
        "score": "3-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-12",
        "home": "Manchester United",
        "away": "Arsenal",
        "score": "1-2",
        "result": "L",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-06",
        "home": "Crystal Palace",
        "away": "Manchester United",
        "score": "4-0",
        "result": "L",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-27",
        "home": "Manchester United",
        "away": "Burnley",
        "score": "1-1",
        "result": "D",
        "competition": "Premier League"
      }
    ]
  },
  "liverpool": {
    "teamName": "Liverpool",
    "formation": "4-3-3",
    "starters": [
      {
        "number": 1,
        "name": "Alisson Becker",
        "position": "GK"
      },
      {
        "number": 66,
        "name": "Trent Alexander-Arnold",
        "position": "RB"
      },
      {
        "number": 5,
        "name": "Ibrahima Konaté",
        "position": "CB"
      },
      {
        "number": 4,
        "name": "Virgil van Dijk",
        "position": "CB"
      },
      {
        "number": 26,
        "name": "Andrew Robertson",
        "position": "LB"
      },
      {
        "number": 38,
        "name": "Ryan Gravenberch",
        "position": "CDM"
      },
      {
        "number": 10,
        "name": "Alexis Mac Allister",
        "position": "CM"
      },
      {
        "number": 8,
        "name": "Dominik Szoboszlai",
        "position": "CAM"
      },
      {
        "number": 11,
        "name": "Mohamed Salah",
        "position": "RW"
      },
      {
        "number": 7,
        "name": "Luis Díaz",
        "position": "LW"
      },
      {
        "number": 20,
        "name": "Diogo Jota",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 62,
        "name": "Caoimhín Kelleher",
        "position": "GK"
      },
      {
        "number": 78,
        "name": "Jarell Quansah",
        "position": "CB"
      },
      {
        "number": 84,
        "name": "Conor Bradley",
        "position": "RB"
      },
      {
        "number": 3,
        "name": "Wataru Endo",
        "position": "CDM"
      },
      {
        "number": 17,
        "name": "Curtis Jones",
        "position": "CM"
      },
      {
        "number": 18,
        "name": "Cody Gakpo",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Darwin Núñez",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-19",
        "home": "Liverpool",
        "away": "Wolverhampton",
        "score": "2-0",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-13",
        "home": "Aston Villa",
        "away": "Liverpool",
        "score": "3-3",
        "result": "D",
        "competition": "Premier League"
      },
      {
        "date": "2026-05-05",
        "home": "Liverpool",
        "away": "Tottenham Hotspur",
        "score": "4-2",
        "result": "W",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-27",
        "home": "West Ham United",
        "away": "Liverpool",
        "score": "2-2",
        "result": "D",
        "competition": "Premier League"
      },
      {
        "date": "2026-04-24",
        "home": "Everton",
        "away": "Liverpool",
        "score": "2-0",
        "result": "L",
        "competition": "Premier League"
      }
    ]
  },
  "realmadrid": {
    "teamName": "Real Madrid",
    "formation": "4-3-3",
    "starters": [
      {
        "number": 1,
        "name": "Thibaut Courtois",
        "position": "GK"
      },
      {
        "number": 2,
        "name": "Dani Carvajal",
        "position": "RB"
      },
      {
        "number": 3,
        "name": "Éder Militão",
        "position": "CB"
      },
      {
        "number": 22,
        "name": "Antonio Rüdiger",
        "position": "CB"
      },
      {
        "number": 23,
        "name": "Ferland Mendy",
        "position": "LB"
      },
      {
        "number": 14,
        "name": "Aurélien Tchouaméni",
        "position": "CDM"
      },
      {
        "number": 8,
        "name": "Federico Valverde",
        "position": "CM"
      },
      {
        "number": 5,
        "name": "Jude Bellingham",
        "position": "CAM"
      },
      {
        "number": 11,
        "name": "Rodrygo Goes",
        "position": "RW"
      },
      {
        "number": 7,
        "name": "Vinícius Júnior",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Kylian Mbappé",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 13,
        "name": "Andriy Lunin",
        "position": "GK"
      },
      {
        "number": 17,
        "name": "Lucas Vázquez",
        "position": "RB"
      },
      {
        "number": 10,
        "name": "Luka Modric",
        "position": "CM"
      },
      {
        "number": 6,
        "name": "Eduardo Camavinga",
        "position": "CDM"
      },
      {
        "number": 15,
        "name": "Arda Güler",
        "position": "CAM"
      },
      {
        "number": 21,
        "name": "Brahim Díaz",
        "position": "RW"
      },
      {
        "number": 16,
        "name": "Endrick",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-20",
        "home": "Real Madrid",
        "away": "Real Betis",
        "score": "3-0",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-05-14",
        "home": "Villarreal",
        "away": "Real Madrid",
        "score": "4-4",
        "result": "D",
        "competition": "La Liga"
      },
      {
        "date": "2026-05-09",
        "home": "Real Madrid",
        "away": "Deportivo Alavés",
        "score": "5-0",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-05-04",
        "home": "Granada",
        "away": "Real Madrid",
        "score": "0-4",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-04-26",
        "home": "Real Sociedad",
        "away": "Real Madrid",
        "score": "0-1",
        "result": "W",
        "competition": "La Liga"
      }
    ]
  },
  "barcelona": {
    "teamName": "Barcelona",
    "formation": "4-3-3",
    "starters": [
      {
        "number": 1,
        "name": "Marc-André ter Stegen",
        "position": "GK"
      },
      {
        "number": 23,
        "name": "Jules Koundé",
        "position": "RB"
      },
      {
        "number": 2,
        "name": "Pau Cubarsí",
        "position": "CB"
      },
      {
        "number": 5,
        "name": "Iñigo Martínez",
        "position": "CB"
      },
      {
        "number": 3,
        "name": "Alejandro Balde",
        "position": "LB"
      },
      {
        "number": 17,
        "name": "Marc Casadó",
        "position": "CDM"
      },
      {
        "number": 8,
        "name": "Pedri González",
        "position": "CM"
      },
      {
        "number": 20,
        "name": "Dani Olmo",
        "position": "CAM"
      },
      {
        "number": 19,
        "name": "Lamine Yamal",
        "position": "RW"
      },
      {
        "number": 11,
        "name": "Raphinha Dias",
        "position": "LW"
      },
      {
        "number": 9,
        "name": "Robert Lewandowski",
        "position": "ST"
      }
    ],
    "subs": [
      {
        "number": 13,
        "name": "Iñaki Peña",
        "position": "GK"
      },
      {
        "number": 24,
        "name": "Eric García",
        "position": "CB"
      },
      {
        "number": 32,
        "name": "Héctor Fort",
        "position": "RB"
      },
      {
        "number": 6,
        "name": "Gavi",
        "position": "CDM"
      },
      {
        "number": 21,
        "name": "Frenkie de Jong",
        "position": "CM"
      },
      {
        "number": 10,
        "name": "Ansu Fati",
        "position": "LW"
      },
      {
        "number": 18,
        "name": "Pau Víctor",
        "position": "ST"
      }
    ],
    "matches": [
      {
        "date": "2026-05-19",
        "home": "Sevilla",
        "away": "Barcelona",
        "score": "1-2",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-05-13",
        "home": "Barcelona",
        "away": "Real Sociedad",
        "score": "2-0",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-05-04",
        "home": "Girona",
        "away": "Barcelona",
        "score": "4-2",
        "result": "L",
        "competition": "La Liga"
      },
      {
        "date": "2026-04-29",
        "home": "Barcelona",
        "away": "Valencia",
        "score": "4-2",
        "result": "W",
        "competition": "La Liga"
      },
      {
        "date": "2026-04-21",
        "home": "Real Madrid",
        "away": "Barcelona",
        "score": "3-2",
        "result": "L",
        "competition": "La Liga"
      }
    ]
  }
};

module.exports = squads;
