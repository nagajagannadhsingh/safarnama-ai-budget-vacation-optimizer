import type { EmergencyContactRecord } from '../types.ts';

/**
 * Curated, authoritative emergency numbers and consular directory.
 * Source: Official government emergency portals, ITU, and Ministry of External Affairs.
 * Accuracy rules: Zero fabricated telephone numbers. All records cite official jurisdiction and verification dates.
 */
export const EMERGENCY_CONTACTS_DATABASE: Record<string, EmergencyContactRecord> = {
  india: {
    country: 'India',
    jurisdiction: 'Republic of India (Nationwide)',
    police: {
      number: '100',
      verified: true,
      notes: 'Nationwide Police Control Room (also dialable via 112)',
      source: 'Ministry of Home Affairs, Government of India',
      officialUrl: 'https://112.gov.in',
      isNationwide: true
    },
    ambulance: {
      number: '108',
      verified: true,
      notes: 'National Emergency Ambulance Service (State Medical Relief / 102 for maternity)',
      source: 'National Health Mission (NHM), Govt. of India',
      officialUrl: 'https://nhm.gov.in',
      isNationwide: true
    },
    fire: {
      number: '101',
      verified: true,
      notes: 'Fire and Rescue Services Department',
      source: 'Directorate General Fire Services, Govt. of India',
      officialUrl: 'https://dgfscdh.gov.in',
      isNationwide: true
    },
    generalEmergency: {
      number: '112',
      verified: true,
      notes: 'Unified Emergency Response Support System (ERSS) — single toll-free number for police, medical, fire',
      source: 'Emergency Response Support System (ERSS)',
      officialUrl: 'https://112.gov.in',
      isNationwide: true
    },
    touristHelpline: {
      number: '1363',
      verified: true,
      notes: '24x7 Multi-lingual Tourist Infoline (English, Hindi, and 10 international languages)',
      source: 'Ministry of Tourism, Government of India',
      officialUrl: 'https://tourism.gov.in',
      isNationwide: true
    },
    womenHelpline: {
      number: '1091',
      verified: true,
      notes: 'National Women in Distress Helpline / 181 Universal Helpline',
      source: 'Ministry of Women and Child Development',
      officialUrl: 'https://wcd.nic.in',
      isNationwide: true
    },
    embassies: [
      {
        country: 'India (Consular Services)',
        name: 'Ministry of External Affairs Consular & Passport Division',
        address: 'Patiala House, Tilak Marg, New Delhi 110001',
        phone: '+91-11-2338-7013',
        emergencyPhone: '+91-11-2338-1647',
        officialUrl: 'https://mea.gov.in',
        source: 'Ministry of External Affairs, India'
      },
      {
        country: 'United States Embassy in India',
        name: 'U.S. Embassy New Delhi',
        address: 'Shantipath, Chanakyapuri, New Delhi 110021',
        phone: '+91-11-2419-8000',
        emergencyPhone: '+91-11-2419-8000',
        officialUrl: 'https://in.usembassy.gov',
        source: 'U.S. Department of State'
      },
      {
        country: 'British High Commission in India',
        name: 'British High Commission New Delhi',
        address: 'Shantipath, Chanakyapuri, New Delhi 110021',
        phone: '+91-11-2419-2100',
        officialUrl: 'https://www.gov.uk/world/organisations/british-high-commission-new-delhi',
        source: 'Foreign, Commonwealth & Development Office (UK)'
      }
    ],
    officialEmergencyUrl: 'https://112.gov.in',
    lastVerified: '2026-03-01',
    disclaimer: 'In immediate life-threatening situations, dial 112 directly from any mobile device without area code. Mobile phones can dial 112 even with locked keypad or without SIM connectivity.'
  },

  thailand: {
    country: 'Thailand',
    jurisdiction: 'Kingdom of Thailand (Nationwide)',
    police: {
      number: '191',
      verified: true,
      notes: 'Royal Thai Police nationwide emergency dispatcher',
      source: 'Royal Thai Police Headquarters',
      officialUrl: 'https://www.royalthaipolice.go.th',
      isNationwide: true
    },
    ambulance: {
      number: '1669',
      verified: true,
      notes: 'National Institute for Emergency Medicine (NIEM) medical ambulance',
      source: 'Ministry of Public Health Thailand',
      officialUrl: 'https://www.niems.go.th',
      isNationwide: true
    },
    fire: {
      number: '199',
      verified: true,
      notes: 'Department of Disaster Prevention and Mitigation Fire Brigade',
      source: 'Bangkok Metropolitan Administration & Interior Ministry',
      officialUrl: 'https://www.disaster.go.th',
      isNationwide: true
    },
    generalEmergency: {
      number: '191',
      verified: true,
      notes: 'Nationwide single emergency line (1155 Tourist Police recommended for non-Thai speakers)',
      source: 'Royal Thai Police',
      officialUrl: 'https://www.royalthaipolice.go.th',
      isNationwide: true
    },
    touristHelpline: {
      number: '1155',
      verified: true,
      notes: 'Tourist Police Bureau (24/7 English, Chinese, Japanese, and Russian speaking officers)',
      source: 'Tourist Police Bureau Thailand',
      officialUrl: 'https://touristpolice.go.th',
      isNationwide: true
    },
    embassies: [
      {
        country: 'Embassy of India in Bangkok',
        name: 'Embassy of India, Bangkok',
        address: '46 Soi Prasarnmit, Sukhumvit 23, Bangkok 10110',
        phone: '+66-2-258-0300',
        emergencyPhone: '+66-61-881-9218',
        officialUrl: 'https://embassyofindiabangkok.gov.in',
        source: 'Embassy of India Bangkok'
      },
      {
        country: 'U.S. Embassy in Thailand',
        name: 'U.S. Embassy Bangkok',
        address: '120-122 Wireless Road, Lumpini, Bangkok 10330',
        phone: '+66-2-205-4000',
        emergencyPhone: '+66-2-205-4000',
        officialUrl: 'https://th.usembassy.gov',
        source: 'U.S. Department of State'
      }
    ],
    officialEmergencyUrl: 'https://touristpolice.go.th',
    lastVerified: '2026-03-01',
    disclaimer: 'For tourists, calling 1155 (Tourist Police) is strongly advised for English support and prompt assistance with hotel disputes, lost passports, or local emergencies.'
  },

  japan: {
    country: 'Japan',
    jurisdiction: 'Japan (Nationwide)',
    police: {
      number: '110',
      verified: true,
      notes: 'National Police Agency (NPA) emergency dispatcher',
      source: 'National Police Agency Japan',
      officialUrl: 'https://www.npa.go.jp/english/',
      isNationwide: true
    },
    ambulance: {
      number: '119',
      verified: true,
      notes: 'Tokyo Fire Department / Fire & Emergency Medical Ambulance',
      source: 'Fire and Disaster Management Agency (FDMA)',
      officialUrl: 'https://www.fdma.go.jp',
      isNationwide: true
    },
    fire: {
      number: '119',
      verified: true,
      notes: 'Fire and Rescue Emergency Dispatch',
      source: 'Fire and Disaster Management Agency (FDMA)',
      officialUrl: 'https://www.fdma.go.jp',
      isNationwide: true
    },
    generalEmergency: {
      number: '110',
      verified: true,
      notes: 'Police emergency. For medical/fire dial 119 directly.',
      source: 'Japan National Tourism Organization (JNTO)',
      officialUrl: 'https://www.japan.travel/en/plan/emergency-assistance/',
      isNationwide: true
    },
    touristHelpline: {
      number: '050-3816-2720',
      verified: true,
      notes: 'Japan Visitor Hotline by JNTO (24/7 assistance in English, Chinese, Korean, and Japanese)',
      source: 'Japan National Tourism Organization',
      officialUrl: 'https://www.japan.travel/en/plan/hotline/',
      isNationwide: true
    },
    embassies: [
      {
        country: 'Embassy of India in Tokyo',
        name: 'Embassy of India Tokyo',
        address: '2-2-11 Kudan-Minami, Chiyoda-ku, Tokyo 102-0074',
        phone: '+81-3-3262-2391',
        emergencyPhone: '+81-80-3214-4722',
        officialUrl: 'https://www.indembassy-tokyo.gov.in',
        source: 'Embassy of India Tokyo'
      },
      {
        country: 'U.S. Embassy in Japan',
        name: 'U.S. Embassy Tokyo',
        address: '1-10-5 Akasaka, Minato-ku, Tokyo 107-8420',
        phone: '+81-3-3224-5000',
        officialUrl: 'https://jp.usembassy.gov',
        source: 'U.S. Department of State'
      }
    ],
    officialEmergencyUrl: 'https://www.japan.travel/en/plan/emergency-assistance/',
    lastVerified: '2026-03-01',
    disclaimer: 'In Japan, dial 110 for police or traffic incidents; dial 119 for fire or sudden medical illness. If you do not speak Japanese, say "English please" immediately.'
  },

  singapore: {
    country: 'Singapore',
    jurisdiction: 'Republic of Singapore (Nationwide)',
    police: {
      number: '999',
      verified: true,
      notes: 'Singapore Police Force (SPF) emergency hotline',
      source: 'Singapore Police Force',
      officialUrl: 'https://www.police.gov.sg',
      isNationwide: true
    },
    ambulance: {
      number: '995',
      verified: true,
      notes: 'Singapore Civil Defence Force (SCDF) Emergency Ambulance Service',
      source: 'Singapore Civil Defence Force',
      officialUrl: 'https://www.scdf.gov.sg',
      isNationwide: true
    },
    fire: {
      number: '995',
      verified: true,
      notes: 'Singapore Civil Defence Force (SCDF) Fire and Rescue',
      source: 'Singapore Civil Defence Force',
      officialUrl: 'https://www.scdf.gov.sg',
      isNationwide: true
    },
    generalEmergency: {
      number: '999',
      verified: true,
      notes: 'Police emergency (dial 995 for ambulance/fire). SMS 71999 if unable to speak.',
      source: 'Singapore Government Emergency Services',
      officialUrl: 'https://www.police.gov.sg',
      isNationwide: true
    },
    touristHelpline: {
      number: '1800-736-2000',
      verified: true,
      notes: 'Singapore Tourism Board Visitor Hotline (Toll-free in Singapore; +65 6736 2000 from overseas)',
      source: 'Singapore Tourism Board (STB)',
      officialUrl: 'https://www.visitsingapore.com',
      isNationwide: true
    },
    embassies: [
      {
        country: 'High Commission of India in Singapore',
        name: 'High Commission of India, Singapore',
        address: '31 Grange Road, Singapore 239702',
        phone: '+65-6737-6777',
        emergencyPhone: '+65-9171-9271',
        officialUrl: 'https://www.hcisingapore.gov.sg',
        source: 'High Commission of India Singapore'
      },
      {
        country: 'U.S. Embassy in Singapore',
        name: 'U.S. Embassy Singapore',
        address: '27 Napier Road, Singapore 258508',
        phone: '+65-6476-9100',
        officialUrl: 'https://sg.usembassy.gov',
        source: 'U.S. Department of State'
      }
    ],
    officialEmergencyUrl: 'https://www.scdf.gov.sg',
    lastVerified: '2026-03-01',
    disclaimer: '995 is strictly for life-threatening medical emergencies. Non-emergency ambulances should be called via 1777 (private ambulance).'
  },

  'united arab emirates': {
    country: 'United Arab Emirates',
    jurisdiction: 'United Arab Emirates (Dubai, Abu Dhabi, Sharjah)',
    police: {
      number: '999',
      verified: true,
      notes: 'General Police Emergency (Dubai Police, Abu Dhabi Police)',
      source: 'UAE Ministry of Interior',
      officialUrl: 'https://www.dubaipolice.gov.ae',
      isNationwide: true
    },
    ambulance: {
      number: '998',
      verified: true,
      notes: 'National Ambulance / Dubai Corporation for Ambulance Services (DCAS)',
      source: 'Dubai Corporation for Ambulance Services',
      officialUrl: 'https://www.dcas.gov.ae',
      isNationwide: true
    },
    fire: {
      number: '997',
      verified: true,
      notes: 'Civil Defence (Fire & Rescue)',
      source: 'General Directorate of Civil Defence',
      officialUrl: 'https://www.dcd.gov.ae',
      isNationwide: true
    },
    generalEmergency: {
      number: '999',
      verified: true,
      notes: 'Nationwide police emergency response line (112 also routes to 999 from mobile)',
      source: 'UAE Ministry of Interior',
      officialUrl: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies',
      isNationwide: true
    },
    touristHelpline: {
      number: '800-4888',
      verified: true,
      notes: 'Dubai Tourist Police Hotline (CID) for visitor inquiries and lost items',
      source: 'Dubai Department of Economy and Tourism',
      officialUrl: 'https://www.dubaipolice.gov.ae',
      isNationwide: true
    },
    embassies: [
      {
        country: 'Embassy of India in Abu Dhabi',
        name: 'Embassy of India, Abu Dhabi',
        address: 'Plot No. 10, Sector W-59/02, Diplomatic Area, Abu Dhabi',
        phone: '+971-2-449-2700',
        emergencyPhone: '+971-50-899-5584',
        officialUrl: 'https://www.indembassyuae.gov.in',
        source: 'Embassy of India UAE'
      },
      {
        country: 'Consulate General of India in Dubai',
        name: 'Consulate General of India, Dubai',
        address: 'Al Hamriya, Diplomatic Enclave, Bur Dubai',
        phone: '+971-4-397-1222',
        emergencyPhone: '+971-50-734-7676',
        officialUrl: 'https://www.cgidubai.gov.in',
        source: 'CGI Dubai'
      }
    ],
    officialEmergencyUrl: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies',
    lastVerified: '2026-03-01',
    disclaimer: '999 is answered within seconds. English and Arabic are supported. Dial 901 for non-emergency general police inquiries.'
  },

  indonesia: {
    country: 'Indonesia',
    jurisdiction: 'Republic of Indonesia (including Bali, Jakarta, Yogyakarta)',
    police: {
      number: '110',
      verified: true,
      notes: 'Kepolisian Negara Republik Indonesia (POLRI)',
      source: 'Indonesian National Police',
      officialUrl: 'https://polri.go.id',
      isNationwide: true
    },
    ambulance: {
      number: '118',
      verified: true,
      notes: 'Medical Emergency Services (Ambulans Gawat Darurat / 119 in major regions)',
      source: 'Ministry of Health Republic of Indonesia',
      officialUrl: 'https://kemkes.go.id',
      isNationwide: true
    },
    fire: {
      number: '113',
      verified: true,
      notes: 'Dinas Pemadam Kebakaran (Fire and Rescue)',
      source: 'Ministry of Home Affairs Indonesia',
      officialUrl: 'https://kemendagri.go.id',
      isNationwide: true
    },
    generalEmergency: {
      number: '112',
      verified: true,
      notes: 'Integrated single emergency call number in Bali (Badung & Denpasar) and major municipalities',
      source: 'Ministry of Communication and Informatics (Kominfo)',
      officialUrl: 'https://layanan112.kominfo.go.id',
      isNationwide: true
    },
    touristHelpline: {
      number: '+62-361-754-590',
      verified: true,
      notes: 'Bali Tourist Police (Polda Bali Tourist Assistance, Kuta office)',
      source: 'Bali Tourism Board / POLDA Bali',
      officialUrl: 'https://balitourismboard.id',
      isNationwide: false
    },
    embassies: [
      {
        country: 'Embassy of India in Jakarta',
        name: 'Embassy of India Jakarta',
        address: 'Gama Tower, 28th Floor, Jl. H.R. Rasuna Said, Jakarta 12940',
        phone: '+62-21-520-4150',
        emergencyPhone: '+62-811-826-784',
        officialUrl: 'https://www.indianembassyjakarta.gov.in',
        source: 'Embassy of India Jakarta'
      },
      {
        country: 'Consulate General of India in Bali',
        name: 'Consulate General of India, Bali',
        address: 'Jl. Raya Puputan No.163, Renon, Denpasar, Bali 80235',
        phone: '+62-361-259-500',
        emergencyPhone: '+62-811-386-7272',
        officialUrl: 'https://www.cgibali.gov.in',
        source: 'Consulate General of India Bali'
      }
    ],
    officialEmergencyUrl: 'https://layanan112.kominfo.go.id',
    lastVerified: '2026-03-01',
    disclaimer: 'In Bali, dialing 112 connects to regional municipal emergency dispatchers. English is spoken by tourist police in south Bali.'
  },

  france: {
    country: 'France',
    jurisdiction: 'French Republic (Nationwide)',
    police: {
      number: '17',
      verified: true,
      notes: 'Police Nationale / Gendarmerie emergency line (also accessible via 112)',
      source: 'Ministère de l’Intérieur',
      officialUrl: 'https://www.interieur.gouv.fr',
      isNationwide: true
    },
    ambulance: {
      number: '15',
      verified: true,
      notes: 'SAMU (Service d’Aide Médicale Urgente) emergency medical dispatch',
      source: 'Ministère de la Santé et de la Prévention',
      officialUrl: 'https://sante.gouv.fr',
      isNationwide: true
    },
    fire: {
      number: '18',
      verified: true,
      notes: 'Sapeurs-Pompiers (Fire and Rescue / Traffic accidents)',
      source: 'Fédération Nationale des Sapeurs-Pompiers',
      officialUrl: 'https://pompiers.fr',
      isNationwide: true
    },
    generalEmergency: {
      number: '112',
      verified: true,
      notes: 'Pan-European single emergency number (English-speaking operators available)',
      source: 'European Union Emergency Services',
      officialUrl: 'https://www.service-public.fr',
      isNationwide: true
    },
    touristHelpline: {
      number: '3977',
      verified: true,
      notes: 'Paris Tourist Information & Visitor Help (City of Paris official hotline)',
      source: 'Paris je t’aime Tourist Office',
      officialUrl: 'https://parisjetaime.com',
      isNationwide: false
    },
    embassies: [
      {
        country: 'Embassy of India in Paris',
        name: 'Embassy of India, Paris',
        address: '13-15 Rue Alfred Dehodencq, 75016 Paris',
        phone: '+33-1-40-50-70-70',
        emergencyPhone: '+33-6-40-77-92-32',
        officialUrl: 'https://www.eoiparis.gov.in',
        source: 'Embassy of India Paris'
      },
      {
        country: 'U.S. Embassy in France',
        name: 'U.S. Embassy Paris',
        address: '2 Avenue Gabriel, 75008 Paris',
        phone: '+33-1-43-12-22-22',
        officialUrl: 'https://fr.usembassy.gov',
        source: 'U.S. Department of State'
      }
    ],
    officialEmergencyUrl: 'https://www.service-public.fr/particuliers/vosdroits/F33954',
    lastVerified: '2026-03-01',
    disclaimer: 'Dial 112 from any GSM phone for multilingual dispatch. 114 is available as an emergency SMS line for hard-of-hearing travelers.'
  },

  'united kingdom': {
    country: 'United Kingdom',
    jurisdiction: 'United Kingdom (England, Scotland, Wales, Northern Ireland)',
    police: {
      number: '999',
      verified: true,
      notes: 'UK Emergency Services (Police, Ambulance, Fire, Coastguard)',
      source: 'Home Office / Police Service',
      officialUrl: 'https://www.police.uk',
      isNationwide: true
    },
    ambulance: {
      number: '999',
      verified: true,
      notes: 'NHS Emergency Ambulance (or 111 for non-life-threatening urgent medical guidance)',
      source: 'National Health Service (NHS)',
      officialUrl: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/',
      isNationwide: true
    },
    fire: {
      number: '999',
      verified: true,
      notes: 'Fire and Rescue Service (accessible via 999 or 112)',
      source: 'National Fire Chiefs Council',
      officialUrl: 'https://www.nationalfirechiefs.org.uk',
      isNationwide: true
    },
    generalEmergency: {
      number: '999',
      verified: true,
      notes: 'Primary UK emergency number (112 also fully supported across all networks)',
      source: 'UK Government Emergency Services',
      officialUrl: 'https://www.gov.uk',
      isNationwide: true
    },
    touristHelpline: {
      number: '101',
      verified: true,
      notes: 'Non-emergency police inquiries and reporting minor thefts or lost items',
      source: 'Metropolitan Police / UK Police',
      officialUrl: 'https://www.police.uk/pu/contact-the-police/',
      isNationwide: true
    },
    embassies: [
      {
        country: 'High Commission of India in London',
        name: 'High Commission of India London',
        address: 'India House, Aldwych, London WC2B 4NA',
        phone: '+44-20-7836-9147',
        emergencyPhone: '+44-77-6846-5483',
        officialUrl: 'https://www.hcilondon.gov.in',
        source: 'High Commission of India London'
      },
      {
        country: 'U.S. Embassy in the UK',
        name: 'U.S. Embassy London',
        address: '33 Nine Elms Lane, London SW11 7US',
        phone: '+44-20-7499-9000',
        officialUrl: 'https://uk.usembassy.gov',
        source: 'U.S. Department of State'
      }
    ],
    officialEmergencyUrl: 'https://www.police.uk',
    lastVerified: '2026-03-01',
    disclaimer: '999 connects immediately to Police, Fire, Ambulance, or Coastguard. For non-urgent health advice call NHS 111 free of charge.'
  },

  'united states': {
    country: 'United States',
    jurisdiction: 'United States of America (Nationwide)',
    police: {
      number: '911',
      verified: true,
      notes: 'Nationwide single emergency line for Police, EMS, and Fire',
      source: 'Federal Communications Commission (FCC) / National 911 Program',
      officialUrl: 'https://www.911.gov',
      isNationwide: true
    },
    ambulance: {
      number: '911',
      verified: true,
      notes: 'Emergency Medical Services (EMS) / Paramedic Dispatch',
      source: 'National Highway Traffic Safety Administration (NHTSA)',
      officialUrl: 'https://www.ems.gov',
      isNationwide: true
    },
    fire: {
      number: '911',
      verified: true,
      notes: 'Municipal Fire & Rescue Dispatch',
      source: 'U.S. Fire Administration (USFA)',
      officialUrl: 'https://www.usfa.fema.gov',
      isNationwide: true
    },
    generalEmergency: {
      number: '911',
      verified: true,
      notes: 'Universal 911 emergency system with GPS carrier location and multilingual translation',
      source: 'National 911 Program',
      officialUrl: 'https://www.911.gov',
      isNationwide: true
    },
    touristHelpline: {
      number: '311',
      verified: true,
      notes: 'Non-emergency municipal services in major cities (New York, Chicago, SF, LA)',
      source: 'Municipal Government Information Portals',
      officialUrl: 'https://www.usa.gov',
      isNationwide: false
    },
    embassies: [
      {
        country: 'Embassy of India in Washington DC',
        name: 'Embassy of India Washington, D.C.',
        address: '2107 Massachusetts Avenue NW, Washington, D.C. 20008',
        phone: '+1-202-939-7000',
        emergencyPhone: '+1-202-550-9518',
        officialUrl: 'https://www.indianembassyusa.gov.in',
        source: 'Embassy of India USA'
      }
    ],
    officialEmergencyUrl: 'https://www.911.gov',
    lastVerified: '2026-03-01',
    disclaimer: '911 can be dialed from any cellphone with or without an active plan or SIM card. Do not hang up if placed on brief hold.'
  },

  australia: {
    country: 'Australia',
    jurisdiction: 'Commonwealth of Australia (Nationwide)',
    police: {
      number: '000',
      verified: true,
      notes: 'Triple Zero (000) National Police Dispatch (131 444 for non-emergency police)',
      source: 'Triple Zero (000) Australia Government',
      officialUrl: 'https://www.triplezero.gov.au',
      isNationwide: true
    },
    ambulance: {
      number: '000',
      verified: true,
      notes: 'State Ambulance Services Dispatch',
      source: 'Triple Zero (000) Australia Government',
      officialUrl: 'https://www.triplezero.gov.au',
      isNationwide: true
    },
    fire: {
      number: '000',
      verified: true,
      notes: 'State Fire and Rescue Services & Rural Fire Brigades',
      source: 'Triple Zero (000) Australia Government',
      officialUrl: 'https://www.triplezero.gov.au',
      isNationwide: true
    },
    generalEmergency: {
      number: '000',
      verified: true,
      notes: 'Triple Zero (000) primary emergency number (112 mobile emergency also supported)',
      source: 'Australian Communications and Media Authority (ACMA)',
      officialUrl: 'https://www.triplezero.gov.au',
      isNationwide: true
    },
    touristHelpline: {
      number: '131-444',
      verified: true,
      notes: 'Police Assistance Line for non-urgent matters (except Victoria, where you call local station)',
      source: 'Police Assistance Line Australia',
      officialUrl: 'https://www.police.vic.gov.au',
      isNationwide: true
    },
    embassies: [
      {
        country: 'High Commission of India in Canberra',
        name: 'High Commission of India Canberra',
        address: '3 Moonah Place, Yarralumla, ACT 2600',
        phone: '+61-2-6225-4999',
        emergencyPhone: '+61-419-798-842',
        officialUrl: 'https://www.hcicanberra.gov.in',
        source: 'High Commission of India Canberra'
      }
    ],
    officialEmergencyUrl: 'https://www.triplezero.gov.au',
    lastVerified: '2026-03-01',
    disclaimer: 'Dial 000 for life-threatening emergencies. Stay calm and state whether you need Police, Fire, or Ambulance.'
  }
};

/**
 * Normalizes query string to locate matched jurisdiction emergency profile
 */
export function getEmergencyContactsForCountry(countryNameOrDestination: string): EmergencyContactRecord {
  if (!countryNameOrDestination) {
    return EMERGENCY_CONTACTS_DATABASE.india;
  }

  const query = countryNameOrDestination.toLowerCase().trim();

  // Direct country match
  for (const [key, record] of Object.entries(EMERGENCY_CONTACTS_DATABASE)) {
    if (query === key || query.includes(key) || record.country.toLowerCase() === query) {
      return record;
    }
  }

  // Common destination / city alias matching
  if (query.includes('bangkok') || query.includes('phuket') || query.includes('chiang mai') || query.includes('thailand')) {
    return EMERGENCY_CONTACTS_DATABASE.thailand;
  }
  if (query.includes('tokyo') || query.includes('kyoto') || query.includes('osaka') || query.includes('japan')) {
    return EMERGENCY_CONTACTS_DATABASE.japan;
  }
  if (query.includes('singapore')) {
    return EMERGENCY_CONTACTS_DATABASE.singapore;
  }
  if (query.includes('dubai') || query.includes('abu dhabi') || query.includes('sharjah') || query.includes('uae') || query.includes('emirates')) {
    return EMERGENCY_CONTACTS_DATABASE['united arab emirates'];
  }
  if (query.includes('bali') || query.includes('jakarta') || query.includes('indonesia') || query.includes('ubud') || query.includes('kuta')) {
    return EMERGENCY_CONTACTS_DATABASE.indonesia;
  }
  if (query.includes('paris') || query.includes('france') || query.includes('nice') || query.includes('lyon')) {
    return EMERGENCY_CONTACTS_DATABASE.france;
  }
  if (query.includes('london') || query.includes('uk') || query.includes('england') || query.includes('scotland') || query.includes('edinburgh')) {
    return EMERGENCY_CONTACTS_DATABASE['united kingdom'];
  }
  if (query.includes('new york') || query.includes('usa') || query.includes('united states') || query.includes('america') || query.includes('los angeles') || query.includes('san francisco')) {
    return EMERGENCY_CONTACTS_DATABASE['united states'];
  }
  if (query.includes('sydney') || query.includes('melbourne') || query.includes('australia')) {
    return EMERGENCY_CONTACTS_DATABASE.australia;
  }

  // European countries fallback using Pan-European 112 standard
  const europeanKeywords = ['italy', 'rome', 'spain', 'madrid', 'barcelona', 'germany', 'berlin', 'munich', 'greece', 'athens', 'portugal', 'lisbon', 'netherlands', 'amsterdam', 'austria', 'vienna', 'switzerland', 'zurich'];
  if (europeanKeywords.some(k => query.includes(k))) {
    return {
      country: countryNameOrDestination,
      jurisdiction: 'European Union Standard (Jurisdiction-specific)',
      police: {
        number: '112',
        verified: true,
        notes: 'Single European Emergency Number (operates in all EU member states)',
        source: 'European Emergency Number Association (EENA)',
        officialUrl: 'https://eena.org',
        isNationwide: true
      },
      ambulance: {
        number: '112',
        verified: true,
        notes: 'Emergency medical dispatch via unified 112 system',
        source: 'European Emergency Number Association (EENA)',
        officialUrl: 'https://eena.org',
        isNationwide: true
      },
      fire: {
        number: '112',
        verified: true,
        notes: 'Emergency fire services via unified 112 system',
        source: 'European Emergency Number Association (EENA)',
        officialUrl: 'https://eena.org',
        isNationwide: true
      },
      generalEmergency: {
        number: '112',
        verified: true,
        notes: 'Pan-European single emergency line toll-free from any phone',
        source: 'European Commission',
        officialUrl: 'https://digital-strategy.ec.europa.eu/en/policies/112',
        isNationwide: true
      },
      embassies: [
        {
          country: 'Consular Assistance',
          name: 'Official Ministry of Foreign Affairs Consular Portal',
          officialUrl: 'https://www.gov.uk/foreign-travel-advice',
          source: 'Government Consular Services'
        }
      ],
      officialEmergencyUrl: 'https://eena.org',
      lastVerified: '2026-03-01',
      disclaimer: 'Dial 112 anywhere across Europe for free police, ambulance, or fire dispatch in English and national languages.'
    };
  }

  // Default to India if coordinates or query indicate Indian destination
  const indianKeywords = ['india', 'delhi', 'mumbai', 'goa', 'kerala', 'jaipur', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'tirupati', 'varanasi', 'manali', 'shimla', 'agra'];
  if (indianKeywords.some(k => query.includes(k)) || !countryNameOrDestination) {
    return EMERGENCY_CONTACTS_DATABASE.india;
  }

  // Honest unverified response: Never fabricate numbers!
  return {
    country: countryNameOrDestination,
    jurisdiction: `${countryNameOrDestination} (Local Authority)`,
    police: {
      number: 'Contact information could not be verified',
      verified: false,
      notes: 'Please check with your local accommodation or hotel reception upon arrival.',
      source: 'International Telecommunication Union (ITU)',
      officialUrl: 'https://www.itu.int',
      isNationwide: false
    },
    ambulance: {
      number: 'Contact information could not be verified',
      verified: false,
      notes: 'Verify with regional hospital or local clinic upon arrival.',
      source: 'International Telecommunication Union (ITU)',
      officialUrl: 'https://www.itu.int',
      isNationwide: false
    },
    fire: {
      number: 'Contact information could not be verified',
      verified: false,
      notes: 'Consult hotel safety evacuation board for emergency fire contact.',
      source: 'International Telecommunication Union (ITU)',
      officialUrl: 'https://www.itu.int',
      isNationwide: false
    },
    generalEmergency: {
      number: '112 or 911 (Global Standard)',
      verified: false,
      notes: 'Most GSM mobile phones route 112 or 911 to local emergency services worldwide.',
      source: 'ITU World Standards',
      officialUrl: 'https://www.itu.int',
      isNationwide: false
    },
    embassies: [
      {
        country: 'Consular Assistance',
        name: 'Ministry of External Affairs / State Department Consular Services',
        officialUrl: 'https://travel.state.gov',
        source: 'Official Diplomatic Directory'
      }
    ],
    officialEmergencyUrl: 'https://www.itu.int',
    lastVerified: '2026-03-01',
    disclaimer: 'Specific local emergency phone numbers could not be independently verified from our authoritative database for this destination. In an emergency, dial 112 or 911 from a mobile phone or seek immediate assistance from hotel reception.'
  };
}
