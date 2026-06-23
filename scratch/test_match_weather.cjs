const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STADIUMS_WEATHER_INFO = {
    "Estadio Akron": { city: "Guadalajara", lat: 20.6811, lon: -103.4628, altitude: 1566, roof: "Open (Slight overhang)" },
    "Lumen Field": { city: "Seattle", lat: 47.5952, lon: -122.3316, altitude: 54, roof: "Open (Covered stands)" },
    "Gillette Stadium": { city: "Foxborough", lat: 42.0909, lon: -71.2643, altitude: 88, roof: "Open" },
    "BC Place": { city: "Vancouver", lat: 49.2768, lon: -123.1120, altitude: 4, roof: "Retractable" },
    "Arrowhead Stadium": { city: "Kansas City", lat: 39.0489, lon: -94.4839, altitude: 277, roof: "Open" },
    "BMO Field": { city: "Toronto", lat: 43.6328, lon: -79.4186, altitude: 76, roof: "Open" },
    "NRG Stadium": { city: "Houston", lat: 29.6847, lon: -95.4107, altitude: 15, roof: "Retractable Dome" },
    "MetLife Stadium": { city: "East Rutherford", lat: 40.8128, lon: -74.0743, altitude: 2, roof: "Open" },
    "AT&T Stadium": { city: "Arlington", lat: 32.7473, lon: -97.0945, altitude: 184, roof: "Retractable Dome" },
    "Mercedes-Benz Stadium": { city: "Atlanta", lat: 33.7573, lon: -84.4006, altitude: 320, roof: "Retractable Dome" },
    "Levi's Stadium": { city: "Santa Clara", lat: 37.4033, lon: -121.9698, altitude: 23, roof: "Open" },
    "Hard Rock Stadium": { city: "Miami Gardens", lat: 25.9580, lon: -80.2389, altitude: 3, roof: "Open (Canopy roof)" },
    "SoFi Stadium": { city: "Inglewood", lat: 33.9534, lon: -118.3387, altitude: 40, roof: "Fixed Translucent Roof (Open sides)" },
    "Estadio BBVA": { city: "Monterrey", lat: 25.6689, lon: -100.2446, altitude: 540, roof: "Open" },
    "Estadio Azteca": { city: "Mexico City", lat: 19.3029, lon: -99.1505, altitude: 2240, roof: "Open" },
    "Lincoln Financial Field": { city: "Philadelphia", lat: 39.9008, lon: -75.1675, altitude: 12, roof: "Open" }
};

function getStadiumInfo(venueName, venueCity) {
    const name = (venueName || '').toLowerCase();
    const city = (venueCity || '').toLowerCase();

    if (name.includes('azteca') || city.includes('mexico')) {
        return { name: "Estadio Azteca", city: "Mexico City", lat: 19.3029, lon: -99.1505, altitude: 2240, roof: "Open" };
    }
    if (name.includes('akron') || city.includes('guadalajara') || city.includes('zapopan')) {
        return { name: "Estadio Akron", city: "Guadalajara", lat: 20.6811, lon: -103.4628, altitude: 1566, roof: "Open (Slight overhang)" };
    }
    if (name.includes('bbva') || city.includes('monterrey') || city.includes('guadalupe')) {
        return { name: "Estadio BBVA", city: "Monterrey", lat: 25.6689, lon: -100.2446, altitude: 540, roof: "Open" };
    }
    if (name.includes('lumen') || city.includes('seattle')) {
        return { name: "Lumen Field", city: "Seattle", lat: 47.5952, lon: -122.3316, altitude: 54, roof: "Open (Covered stands)" };
    }
    if (name.includes('bc place') || city.includes('vancouver')) {
        return { name: "BC Place", city: "Vancouver", lat: 49.2768, lon: -123.1120, altitude: 4, roof: "Retractable" };
    }
    if (name.includes('sofi') || city.includes('los angeles') || city.includes('inglewood')) {
        return { name: "SoFi Stadium", city: "Inglewood", lat: 33.9534, lon: -118.3387, altitude: 40, roof: "Fixed Translucent Roof (Open sides)" };
    }
    if (name.includes('levi') || city.includes('santa clara') || city.includes('san francisco')) {
        return { name: "Levi's Stadium", city: "Santa Clara", lat: 37.4033, lon: -121.9698, altitude: 23, roof: "Open" };
    }
    if (name.includes('at&t') || city.includes('arlington') || city.includes('dallas')) {
        return { name: "AT&T Stadium", city: "Arlington", lat: 32.7473, lon: -97.0945, altitude: 184, roof: "Retractable Dome" };
    }
    if (name.includes('nrg') || city.includes('houston')) {
        return { name: "NRG Stadium", city: "Houston", lat: 29.6847, lon: -95.4107, altitude: 15, roof: "Retractable Dome" };
    }
    if (name.includes('arrowhead') || city.includes('kansas')) {
        return { name: "Arrowhead Stadium", city: "Kansas City", lat: 39.0489, lon: -94.4839, altitude: 277, roof: "Open" };
    }
    if (name.includes('mercedes') || city.includes('atlanta')) {
        return { name: "Mercedes-Benz Stadium", city: "Atlanta", lat: 33.7573, lon: -84.4006, altitude: 320, roof: "Retractable Dome" };
    }
    if (name.includes('hard rock') || city.includes('miami')) {
        return { name: "Hard Rock Stadium", city: "Miami Gardens", lat: 25.9580, lon: -80.2389, altitude: 3, roof: "Open (Canopy roof)" };
    }
    if (name.includes('lincoln') || city.includes('philadelphia')) {
        return { name: "Lincoln Financial Field", city: "Philadelphia", lat: 39.9008, lon: -75.1675, altitude: 12, roof: "Open" };
    }
    if (name.includes('metlife') || city.includes('east ruth') || city.includes('new york') || city.includes('new jersey')) {
        return { name: "MetLife Stadium", city: "East Rutherford", lat: 40.8128, lon: -74.0743, altitude: 2, roof: "Open" };
    }
    if (name.includes('gillette') || city.includes('foxborough') || city.includes('boston')) {
        return { name: "Gillette Stadium", city: "Foxborough", lat: 42.0909, lon: -71.2643, altitude: 88, roof: "Open" };
    }
    if (name.includes('bmo') || city.includes('toronto')) {
        return { name: "BMO Field", city: "Toronto", lat: 43.6328, lon: -79.4186, altitude: 76, roof: "Open" };
    }

    return { name: venueName || "Stadium", city: venueCity || "Abidjan", lat: 5.3453, lon: -4.0244, altitude: 10, roof: "Open" };
}

async function main() {
  const match = await prisma.worldCupMatch.findFirst({
    where: { venueCity: 'Mexico City' }
  });
  if (!match) {
    console.log("No match found in Mexico City. Finding any match...");
    const fallbackMatch = await prisma.worldCupMatch.findFirst();
    if (!fallbackMatch) {
        console.error("No matches found in DB!");
        return;
    }
    const stadium = getStadiumInfo(fallbackMatch.venueName, fallbackMatch.venueCity);
    console.log("Stadium Info for first match:", stadium);
  } else {
    const stadium = getStadiumInfo(match.venueName, match.venueCity);
    console.log("Stadium Info for Mexico City match:", stadium);
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
