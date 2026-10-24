import type { TravelAdvisory } from '../types.ts';

export const TRAVEL_ADVISORIES_DATABASE: Record<string, TravelAdvisory> = {
  india: {
    country: 'India',
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: 'India is welcoming to millions of international and domestic visitors. General safety precautions, staying alert in crowded transportation hubs, and drinking filtered or bottled water are advised.',
    regionalWarnings: [
      'Check local seasonal weather advisories during the southwest monsoon (June to September) in coastal regions, Kerala, and Himalayan mountain passes.',
      'Exercise heightened caution when driving or hiring vehicles along steep Himalayan ghat roads in Himachal Pradesh, Uttarakhand, and Sikkim.',
      'Special permits (Inner Line Permit / Protected Area Permit) are legally required for certain border areas in Arunachal Pradesh, Ladakh (Pangong/Nubra), and Andaman tribal islands.'
    ],
    weatherAlerts: [
      'Summer temperatures in northern and central plains (May–June) frequently exceed 40°C (104°F); carry hydration electrolytes and schedule outdoor sightseeing in morning hours.',
      'Monsoon downpours can cause localized waterlogging in low-lying coastal cities (Mumbai, Chennai) and flash mudslides on hill-station roads.'
    ],
    localLawsAndCulture: [
      'Temples and religious shrines require modest attire (shoulders and knees covered) and removal of footwear outside the sanctum.',
      'Certain states (Gujarat, Bihar, Nagaland) enforce strict complete alcohol prohibition laws; possession without an official tourist permit is illegal.',
      'Flying recreational drones without prior Digital Sky clearance from the Directorate General of Civil Aviation (DGCA) is strictly prohibited near monuments, airports, and military installations.',
      'Always request explicit permission before photographing local residents, particularly sadhus, temple rituals, or rural communities.'
    ],
    commonScams: [
      'Unmetered auto-rickshaws and cabs outside railway stations and airports: Always use official prepaid taxi booths, Uber, or Ola to avoid arbitrary tariff inflation.',
      'Fake "Government Tourist Information" touts: In Delhi (Paharganj / Connaught Place) and Agra, touts may claim trains are canceled or hotel is closed to redirect you to commission-paying agency counters. Never alter reservations without verifying at the official IRCTC ticket counter.',
      'Shoe-cleaning or blessed-flower extortion near prominent temple ghats: Politely decline unsolicited blessings, peacock feathers, or footwear cleaning services.'
    ],
    healthAndEntry: [
      'Drink only sealed branded bottled water (Bisleri, Kinley, Aquafina) or verified UV/RO filtered water. Avoid raw street salads and tap ice in budget eateries.',
      'Carry mosquito repellent containing DEET/Picaridin, especially during and post-monsoon months (dengue prevention).',
      'Ensure standard routine vaccinations (Tetanus, Typhoid, Hepatitis A) are up to date before traveling.'
    ],
    source: 'Ministry of Tourism India, Bureau of Immigration & WHO Travel Health Guide',
    publishedDate: '2026-02-15',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://tourism.gov.in'
  },

  thailand: {
    country: 'Thailand',
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: 'Thailand enjoys high tourist safety with millions of annual visitors. Maintain routine safety vigilance in nightlife areas and when renting motorbikes.',
    regionalWarnings: [
      'Exercise caution when renting motorbikes or scooters in Phuket, Koh Samui, and Chiang Mai: International Driving Permit (IDP) with motorcycle endorsement and helmets are mandatory by law.',
      'Avoid unpaved rural tracks during heavy monsoon squalls (July to October).'
    ],
    weatherAlerts: [
      'Tropical monsoon rains peak between August and October. Flash floods and strong ocean undercurrents (red flag beaches) occur on the Andaman Coast.'
    ],
    localLawsAndCulture: [
      'Strict Lèse-majesté laws: Defaming, insulting, or criticizing the Royal Family or Thai Monarchy is a severe criminal offense carrying heavy imprisonment.',
      'Vaping and e-cigarettes are illegal in Thailand; possession can lead to fines and confiscation.',
      'Temples (Wats) require shoulders and knees covered. Remove shoes before stepping over (never on) the door threshold.',
      'Cannabis regulations have been restricted to medical and wellness use; recreational public smoking remains illegal.'
    ],
    commonScams: [
      'Grand Palace is "Closed Today" scam: Tuk-tuk drivers outside Bangkok temples claim the attraction is closed for a Buddhist holiday and offer to take you to a gem shop or tailor instead. Politely ignore them and walk directly to the ticket booth.',
      'Jet ski and motorbike rental damage scam: Take comprehensive photos and video timestamps of the vehicle before renting to prevent bogus repair claims upon return.'
    ],
    healthAndEntry: [
      'Comprehensive travel and medical insurance covering emergency hospital care and motorbike accidents is strongly recommended.',
      'Stay hydrated in tropical humidity and apply reef-safe sunscreen when swimming in marine national parks.'
    ],
    source: 'Tourism Authority of Thailand (TAT) & Royal Thai Government Gazette',
    publishedDate: '2026-02-10',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://www.tatnews.org'
  },

  japan: {
    country: 'Japan',
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: 'Japan is widely recognized as one of the safest travel destinations in the world, with exceptionally low violent crime rates and highly reliable public infrastructure.',
    regionalWarnings: [
      'Japan is seismically active. Familiarize yourself with emergency earthquake drill procedures and download the Japan Safety Tips app for real-time multilingual disaster alerts.'
    ],
    weatherAlerts: [
      'Typhoon season spans from June to October, occasionally causing shinkansen bullet train delays or airport flight suspensions.'
    ],
    localLawsAndCulture: [
      'Zero tolerance for narcotics and certain over-the-counter stimulant medications (including pseudoephedrine/Sudafed and codeine); check Japan Ministry of Health regulations before flying with prescription meds.',
      'Public etiquette: Keep voices down on trains, stand on the designated escalator side (left in Tokyo, right in Osaka), and avoid eating while walking down crowded streets.',
      'Trash bins are rare in public spaces; carry a small bag to carry your garbage until returning to your hotel room or convenience store recycling bins.'
    ],
    commonScams: [
      'Touts in Tokyo nightlife entertainment districts (Kabukicho in Shinjuku, Roppongi): Avoid following street touts into bars offering cheap "nomihodai" (all-you-can-drink), which frequently end in exorbitant hidden cover charges.'
    ],
    healthAndEntry: [
      'Medical facilities are world-class, though international credit cards may not be accepted in small clinics; carry travel insurance with direct cashless guarantee.'
    ],
    source: 'Japan National Tourism Organization (JNTO) & Disaster Prevention Bureau',
    publishedDate: '2026-02-20',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://www.japan.travel/en/plan/emergency-assistance/'
  },

  'united arab emirates': {
    country: 'United Arab Emirates',
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: 'The UAE (Dubai, Abu Dhabi) is an exceptionally safe, modern destination with stringent law enforcement and modern emergency response.',
    regionalWarnings: [
      'Strict adherence to local civil laws and customs is enforced across all Emirates, with Sharjah being the most conservative.'
    ],
    weatherAlerts: [
      'Extreme desert heat from June through September with temperatures often topping 45°C (113°F). Keep outdoor activities to climate-controlled indoor attractions or evenings.'
    ],
    localLawsAndCulture: [
      'Strict zero tolerance for illegal narcotics, including trace amounts of CBD oil or banned substances.',
      'Public displays of overt affection are discouraged in family and public areas.',
      'Photography of government installations, military sites, police stations, and palaces is strictly prohibited without authorization.',
      'During Ramadan, eating, drinking, or smoking in public outdoor areas during fasting hours is restricted.'
    ],
    commonScams: [
      'Fake designer goods touts in traditional souks: Purchase from certified retail stores or check authenticity.',
      'Unlicensed airport drivers: Always follow signs to official RTA taxi ranks (cream-colored taxis) with official meters.'
    ],
    healthAndEntry: [
      'Tap water in Dubai is desalinated and safe for hygiene, though bottled or filtered drinking water is preferred by most travelers.'
    ],
    source: 'UAE Ministry of Foreign Affairs & Dubai Economy and Tourism',
    publishedDate: '2026-02-22',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://u.ae'
  },

  france: {
    country: 'France',
    advisoryLevel: 'exercise_caution',
    advisoryLevelLabel: 'Exercise Increased Caution',
    advisorySummary: 'France is a major international tourist destination. Travelers should maintain vigilant personal awareness against petty pickpocketing in crowded tourist centers and metro networks.',
    regionalWarnings: [
      'Elevated vigilance in crowded transit nodes (Gare du Nord, Châtelet-Les Halles, metro line 1) and major landmarks (Eiffel Tower, Louvre, Montmartre).'
    ],
    weatherAlerts: [
      'Summer heatwaves ("canicule") can elevate temperatures above 38°C in Paris and southern regions; carry water and seek shade in air-conditioned museums.'
    ],
    localLawsAndCulture: [
      'Always carry valid government photo identification (passport or national ID card) as French police have the legal right to conduct spot identity checks.',
      'Validate your metro ticket before passing barriers and retain it until leaving the station; RATP transport controllers conduct frequent platform inspections.'
    ],
    commonScams: [
      'The "Petition" scam: Young women or children holding clipboards asking you to sign a charity petition while an accomplice attempts to pick your pockets. Walk past without engaging.',
      'The "Gold Ring" scam: A stranger pretends to pick up a dropped gold ring near you and tries to hand it to you in exchange for cash reward. Ignore completely.',
      'The "Friendship Bracelet" scam at the base of Sacré-Cœur: Touts forcefully tie braided string around your finger and demand payment.'
    ],
    healthAndEntry: [
      'The European Health Insurance Card (EHIC/GHIC) applies for eligible European travelers. Other international visitors must carry comprehensive health insurance covering repatriation.'
    ],
    source: 'Ministère de l’Intérieur France & Paris Police Prefecture',
    publishedDate: '2026-02-18',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://www.diplomatie.gouv.fr'
  },

  indonesia: {
    country: 'Indonesia',
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: 'Bali and Yogyakarta are popular cultural and tropical beach destinations. Exercise caution regarding ocean currents, scooter rentals, and volcano hiking excursions.',
    regionalWarnings: [
      'Active volcanic peaks (Mount Batur, Mount Agung) may have periodic exclusion zones established by the Center for Volcanology and Geological Hazard Mitigation (PVMBG). Always use licensed local guides.',
      'Strong rip currents and large shore breaks on south Bali beaches (Canggu, Uluwatu, Kuta): Only swim between red and yellow flags where lifeguards are stationed.'
    ],
    weatherAlerts: [
      'Wet season runs from November through March, bringing frequent afternoon tropical downpours and occasional flash flooding in low-lying village roads.'
    ],
    localLawsAndCulture: [
      'Strict drug penalties: Indonesia imposes severe prison sentences and capital punishment for illicit drug trafficking and possession.',
      'Sacred Balinese Hindu temples require sarongs and sashes (usually available for hire or free at the gate). Do not step on "Canang Sari" daily flower offerings placed on pavements.',
      'Respect monkey sanctuary guidelines in Ubud: Do not touch, taunt, or bring open food/sunglasses near long-tailed macaques.'
    ],
    commonScams: [
      'Money changer short-changing: Only exchange currency at authorized bank kiosks or reputable money changers displaying Bank Indonesia certification. Avoid tiny unvetted alleyway counters offering rates above official market spot prices.',
      'Unauthorized airport taxi drivers: Book via official airport counter or Grab/Gojek pickup lounge.'
    ],
    healthAndEntry: [
      'Drink bottled or filtered water exclusively ("Bali Belly" prevention). Wash hands frequently and dine at busy restaurants with high food turnover.',
      'Check tourist levy entry requirements for Bali (mandatory online provincial tourist voucher).'
    ],
    source: 'Ministry of Tourism and Creative Economy of Indonesia (Kemenparekraf)',
    publishedDate: '2026-02-12',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://www.indonesia.travel'
  }
};

/**
 * Returns travel advisory for destination or country
 */
export function getTravelAdvisoryForDestination(destinationName: string, countryName?: string): TravelAdvisory {
  const query = `${destinationName} ${countryName || ''}`.toLowerCase();

  for (const [key, advisory] of Object.entries(TRAVEL_ADVISORIES_DATABASE)) {
    if (query.includes(key) || (countryName && countryName.toLowerCase().includes(key))) {
      return {
        ...advisory,
        destination: destinationName
      };
    }
  }

  // European destination fallback
  const euKeywords = ['italy', 'rome', 'spain', 'barcelona', 'madrid', 'germany', 'berlin', 'amsterdam', 'netherlands', 'switzerland', 'greece', 'athens'];
  if (euKeywords.some(k => query.includes(k))) {
    return {
      country: countryName || 'European Union',
      destination: destinationName,
      advisoryLevel: 'normal',
      advisoryLevelLabel: 'Exercise Normal Precautions',
      advisorySummary: `Standard European travel precautions apply in ${destinationName}. Be vigilant of pickpockets in crowded transit hubs and respect municipal laws.`,
      regionalWarnings: [
        'Keep passports and wallets secure in zipped interior pockets when using public transport.',
        'Retain validated transport tickets until exiting destination stations.'
      ],
      weatherAlerts: [
        'Check seasonal forecasts before mountain or outdoor activities.'
      ],
      localLawsAndCulture: [
        'Carry valid photo ID at all times.',
        'Observe quiet hours in residential zones and respect historical monument codes of conduct.'
      ],
      commonScams: [
        'Unsolicited street petitioners and distraction theft in busy squares.'
      ],
      healthAndEntry: [
        'Carry valid travel health insurance with cashless emergency hospitalization coverage.'
      ],
      source: 'European Union Official Travel and Health Portals',
      lastCheckedDate: '2026-03-01',
      officialSourceUrl: 'https://europa.eu/youreurope/'
    };
  }

  // Default to India advisory if country matches or default
  if (!countryName || countryName.toLowerCase() === 'india' || query.includes('india')) {
    return {
      ...TRAVEL_ADVISORIES_DATABASE.india,
      destination: destinationName
    };
  }

  // Honest general fallback without fabricating current live situation
  return {
    country: countryName || destinationName,
    destination: destinationName,
    advisoryLevel: 'normal',
    advisoryLevelLabel: 'Exercise Normal Precautions',
    advisorySummary: `Live government travel advisories for ${destinationName} should be checked through your national foreign affairs ministry or embassy website before departure.`,
    regionalWarnings: [
      `Review current regional safety advisories through official diplomatic missions in ${countryName || destinationName}.`
    ],
    weatherAlerts: [
      'Check local meteorological services for real-time weather and severe weather warnings.'
    ],
    localLawsAndCulture: [
      'Respect local cultural customs, religious traditions, and municipal dress codes.',
      'Keep copies of travel visas and passports easily accessible in digital format.'
    ],
    commonScams: [
      'Use only metered taxis, ride-hailing apps, or official airport transport desks to avoid arbitrary charges.'
    ],
    healthAndEntry: [
      'Ensure standard international travel health insurance is active with medical evacuation coverage.'
    ],
    source: 'International Travel Advisory Reference Directory',
    lastCheckedDate: '2026-03-01',
    officialSourceUrl: 'https://travel.state.gov'
  };
}
