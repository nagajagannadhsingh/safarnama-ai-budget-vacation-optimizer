export interface InternationalDestination {
  id: string;
  name: string;
  country: string;
  continent: string;
  tagline: string;
  description: string;
  category: string;
  image: string;
  fallbackImage: string;
  lat: number;
  lon: number;
  avgDailyCostPerPersonINR: number;
  suggestedDays: number;
  budgetRangeText: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  exchangeRateToINR: number; // 1 Unit of local currency = X INR (indicative planning baseline)
  keyHighlights: string[];
  budgetTips: string[];
  visaNotice: string;
  isPopular?: boolean;
}

export const INTERNATIONAL_DESTINATIONS: InternationalDestination[] = [
  {
    id: 'thailand-bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    continent: 'Southeast Asia',
    tagline: 'Ornate golden temples, bustling river ferries, and vibrant night street markets.',
    description: 'From the sacred Grand Palace and Wat Pho reclining Buddha to Chao Phraya river express boats and Michelin-rated street food at Chinatown Yaowarat, Bangkok is Southeast Asia’s most accessible budget haven.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80',
    lat: 13.7563,
    lon: 100.5018,
    avgDailyCostPerPersonINR: 3200,
    suggestedDays: 4,
    budgetRangeText: '₹28,000 – ₹42,000 (Incl. Economy Flight Est.)',
    currency: 'Thai Baht',
    currencyCode: 'THB',
    currencySymbol: '฿',
    exchangeRateToINR: 2.35,
    keyHighlights: ['Grand Palace & Wat Phra Kaew', 'Wat Arun Temple of Dawn', 'Chao Phraya Express River Boats', 'Chatuchak Weekend Market'],
    budgetTips: [
      'Ride the MRT and BTS Skytrain instead of hailing taxis in Bangkok rush-hour jams',
      'Dine at mall food courts like Pier 21 (Terminal 21) for authentic pad thai at 40–60 THB (~₹100–₹140)'
    ],
    visaNotice: 'Visa-free entry for Indian passport holders (under active bilateral tourist waiver agreements). Verify passport validity (minimum 6 months).'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    continent: 'Southeast Asia',
    tagline: 'Futuristic solar Supertrees, lush botanic gardens, and UNESCO hawker centres.',
    description: 'A global garden city blending sustainable architecture at Gardens by the Bay, historic shophouses in Chinatown and Little India, and world-renowned street fare at Maxwell and Lau Pa Sat hawker centres.',
    category: 'Major Cities',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1506351421178-63b52a2d2562?auto=format&fit=crop&w=1200&q=80',
    lat: 1.3521,
    lon: 103.8198,
    avgDailyCostPerPersonINR: 6500,
    suggestedDays: 4,
    budgetRangeText: '₹45,000 – ₹68,000 (Incl. Flights)',
    currency: 'Singapore Dollar',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    exchangeRateToINR: 63.5,
    keyHighlights: ['Gardens by the Bay & Supertree Grove', 'Marina Bay Sands Promenade', 'Chinatown & Buddha Tooth Relic Temple', 'Singapore Botanic Gardens (Free UNESCO site)'],
    budgetTips: [
      'Get an EZ-Link card or use contactless bank cards on the world-class SMRT subway network',
      'Eat at neighborhood hawker centres (Chinatown Complex, Old Airport Road) for Michelin-level meals under S$6 (~₹380)'
    ],
    visaNotice: 'Electronic Visa (e-Visa) required for Indian tourists prior to departure via authorized visa agents.'
  },
  {
    id: 'indonesia-bali',
    name: 'Bali',
    country: 'Indonesia',
    continent: 'Southeast Asia',
    tagline: 'Emerald rice terraces, clifftop sea temples, and serene surf beaches.',
    description: 'The Island of the Gods offers spiritual heritage at Uluwatu and Tanah Lot temples, volcanic vistas of Mount Batur, and artistic sanctuary amidst the sacred monkey forest and green valleys of Ubud.',
    category: 'Beaches & Coastal',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    lat: -8.3405,
    lon: 115.0920,
    avgDailyCostPerPersonINR: 2800,
    suggestedDays: 5,
    budgetRangeText: '₹34,000 – ₹52,000 (Incl. Flights)',
    currency: 'Indonesian Rupiah',
    currencyCode: 'IDR',
    currencySymbol: 'Rp',
    exchangeRateToINR: 0.0054,
    keyHighlights: ['Uluwatu Sunset Temple & Kecak Dance', 'Tegallalang Emerald Rice Terraces', 'Tanah Lot Sea Shrine', 'Sacred Monkey Forest Sanctuary in Ubud'],
    budgetTips: [
      'Rent a scooter or book rides via Grab / Gojek app rather than airport freelance cabs',
      'Enjoy authentic Indonesian Warung meals (Nasi Campur, Nasi Goreng) for 25,000–40,000 IDR (~₹140–₹220)'
    ],
    visaNotice: 'Electronic Visa on Arrival (e-VOA) available online or on arrival at Ngurah Rai International Airport (Denpasar).'
  },
  {
    id: 'malaysia-kuala-lumpur',
    name: 'Kuala Lumpur',
    country: 'Malaysia',
    continent: 'Southeast Asia',
    tagline: 'Soaring Petronas Twin Towers, limestone Batu Caves, and multicultural street food.',
    description: 'Malaysia’s dynamic capital connects modern high-rise skylines with the colorful 272 steps of Hindu Batu Caves, street food crossroads of Jalan Alor, and peaceful green bird parks in Lake Gardens.',
    category: 'Major Cities',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=1200&q=80',
    lat: 3.1390,
    lon: 101.6869,
    avgDailyCostPerPersonINR: 3100,
    suggestedDays: 3,
    budgetRangeText: '₹26,000 – ₹38,000 (Incl. Flights)',
    currency: 'Malaysian Ringgit',
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    exchangeRateToINR: 18.8,
    keyHighlights: ['Petronas Twin Towers & KLCC Park', 'Batu Caves Lord Murugan Statue', 'Jalan Alor Night Food Market', 'Merdeka Square & Sultan Abdul Samad Building'],
    budgetTips: [
      'Take the free GoKL purple and green city buses connecting major tourist centers',
      'Savor Roti Canai and Teh Tarik at Mamak eateries for under RM 7 (~₹130)'
    ],
    visaNotice: 'Visa-free entry for Indian citizens for tourism stays up to 30 days (verify digital MDAC arrival card before flying).'
  },
  {
    id: 'vietnam-hanoi',
    name: 'Hanoi & Ha Long Bay',
    country: 'Vietnam',
    continent: 'Southeast Asia',
    tagline: 'French-colonial Old Quarter, emerald karst sea pillars, and world-class egg coffee.',
    description: 'Hanoi captivates with narrow trading lanes in the 36 Guilds Old Quarter, peaceful Hoan Kiem Lake, historic Temple of Literature, and access to UNESCO limestone karsts in Ha Long Bay.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    lat: 21.0285,
    lon: 105.8542,
    avgDailyCostPerPersonINR: 2400,
    suggestedDays: 5,
    budgetRangeText: '₹29,000 – ₹45,000 (Incl. Flights)',
    currency: 'Vietnamese Dong',
    currencyCode: 'VND',
    currencySymbol: '₫',
    exchangeRateToINR: 0.0034,
    keyHighlights: ['Hanoi Old Quarter & Train Street', 'Hoan Kiem Lake & Ngoc Son Temple', 'Temple of Literature (Van Mieu)', 'Ha Long Bay Overnight Karst Cruise'],
    budgetTips: [
      'Street food like Pho Bo and Banh Mi costs under 40,000 VND (~₹135) at sidewalk stalls',
      'Use Grab app for reliable fixed-price motorbike and car transit'
    ],
    visaNotice: 'Convenient official e-Visa available online through Vietnam Immigration portal for Indian citizens.'
  },
  {
    id: 'uae-dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    continent: 'Middle East',
    tagline: 'Record-shattering architecture, desert safari dunes, and historic gold souks.',
    description: 'Dubai blends the futuristic heights of Burj Khalifa and Dubai Mall fountains with traditional Abra boat rides across Dubai Creek and sensory spices in Deira souks.',
    category: 'Major Cities',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80',
    lat: 25.2048,
    lon: 55.2708,
    avgDailyCostPerPersonINR: 5800,
    suggestedDays: 4,
    budgetRangeText: '₹42,000 – ₹65,000 (Incl. Flights)',
    currency: 'UAE Dirham',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    exchangeRateToINR: 23.2,
    keyHighlights: ['Burj Khalifa Observation Deck', 'Dubai Mall & Fountain Show (Free)', 'Dubai Creek Abra Ride (1 AED)', 'Al Fahidi Historic District & Gold Souk'],
    budgetTips: [
      'Purchase an NOL Red or Silver card for the automated Dubai Metro',
      'Take the 1 AED (~₹23) traditional wooden Abra across the Creek between Bur Dubai and Deira'
    ],
    visaNotice: 'Tourist Visa required prior to travel, easily applied through airlines (Emirates, flydubai) or visa services.'
  },
  {
    id: 'japan-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    continent: 'East Asia',
    tagline: 'High-tech neon crossings, tranquil Shinto shrines, and world-class culinary mastery.',
    description: 'An unforgettable juxtaposition of ancient tradition at Senso-ji Temple and Meiji Jingu Shrine with the kinetic energy of Shibuya Crossing and Akihabara electronics town.',
    category: 'Major Cities',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    lat: 35.6762,
    lon: 139.6503,
    avgDailyCostPerPersonINR: 6200,
    suggestedDays: 6,
    budgetRangeText: '₹75,000 – ₹1,10,000 (Incl. Flights)',
    currency: 'Japanese Yen',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    exchangeRateToINR: 0.57,
    keyHighlights: ['Senso-ji Buddhist Temple in Asakusa', 'Shibuya Scramble Crossing & Hachiko', 'Meiji Jingu Shinto Forest Shrine', 'Tsukiji Outer Seafood Market'],
    budgetTips: [
      'Eat at Japanese Konbini (7-Eleven, Lawson, FamilyMart) and conveyor belt sushi (Sushiro) for fantastic meals under 1,000 JPY (~₹570)',
      'Use 24/48/72-hour Tokyo Subway Tourist Passes for unlimited transit'
    ],
    visaNotice: 'eVisa available for Indian nationals for short-term tourism via official Japan eVISA website.'
  },
  {
    id: 'france-paris',
    name: 'Paris',
    country: 'France',
    continent: 'Europe',
    tagline: 'Iconic Eiffel Tower silhouette, Louvre masterpieces, and bohemian Montmartre.',
    description: 'The City of Light invites travelers to stroll along the Seine River, admire Gothic architecture at Notre-Dame, explore Impressionist art at Musée d’Orsay, and enjoy fresh baguettes in Jardin du Luxembourg.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1520939817895-060bdef4ad1b?auto=format&fit=crop&w=1200&q=80',
    lat: 48.8566,
    lon: 2.3522,
    avgDailyCostPerPersonINR: 7800,
    suggestedDays: 5,
    budgetRangeText: '₹85,000 – ₹1,30,000 (Incl. Flights)',
    currency: 'Euro',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateToINR: 92.4,
    keyHighlights: ['Eiffel Tower & Champ de Mars', 'Louvre Museum & Glass Pyramid', 'Sacré-Cœur Basilica in Montmartre', 'Seine River Cruise & Notre-Dame Cathedral'],
    budgetTips: [
      'Buy a carnet of 10 digital Metro tickets (Navigo Easy) instead of single rides',
      'Pack a picnic of fresh bakery baguettes, brie cheese, and grapes from local markets for lunch in public gardens'
    ],
    visaNotice: 'Schengen Visa (Short-stay Type C) required prior to departure via VFS Global center.'
  },
  {
    id: 'sri-lanka-colombo',
    name: 'Sri Lanka (Colombo & Kandy)',
    country: 'Sri Lanka',
    continent: 'South Asia',
    tagline: 'Lush Ceylon tea hills, sacred Temple of the Tooth, and scenic blue train rides.',
    description: 'Just across the Palk Strait, Sri Lanka offers ancient Sigiriya rock fortress, cool highland tea estates of Nuwara Eliya, golden beaches of Bentota, and the sacred Temple of the Tooth in Kandy.',
    category: 'Hill Stations & Nature',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80',
    lat: 6.9271,
    lon: 79.8612,
    avgDailyCostPerPersonINR: 2600,
    suggestedDays: 4,
    budgetRangeText: '₹24,000 – ₹36,000 (Incl. Flights)',
    currency: 'Sri Lankan Rupee',
    currencyCode: 'LKR',
    currencySymbol: 'LKR',
    exchangeRateToINR: 0.28,
    keyHighlights: ['Temple of the Sacred Tooth Relic in Kandy', 'Galle Dutch Colonial Fort & Lighthouse', 'Scenic Kandy-to-Ella Highland Blue Train', 'Sigiriya Lion Rock Citadel'],
    budgetTips: [
      'Take Sri Lankan Railways 2nd/3rd class observation cars for stunning views at tiny prices (under ₹300)',
      'Eat traditional rice and curry packets for 300–450 LKR (~₹85–₹125)'
    ],
    visaNotice: 'Sri Lanka offers visa-free / ETA waiver facilities for Indian tourists under active government tourism programs.'
  },
  {
    id: 'nepal-kathmandu',
    name: 'Kathmandu & Pokhara',
    country: 'Nepal',
    continent: 'South Asia',
    tagline: 'Snowy Annapurna reflections, ancient Durbar squares, and sacred stupas.',
    description: 'Framed by the Himalayas, Nepal offers spiritual serenity at Boudhanath Stupa and Pashupatinath Temple, combined with tranquil boat rides on Phewa Lake in Pokhara facing the Annapurna range.',
    category: 'Spiritual & Pilgrimage',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1584281722572-88ec0c5fa06f?auto=format&fit=crop&w=1200&q=80',
    lat: 27.7172,
    lon: 85.3240,
    avgDailyCostPerPersonINR: 2000,
    suggestedDays: 4,
    budgetRangeText: '₹18,000 – ₹29,000 (Incl. Flight/Bus)',
    currency: 'Nepalese Rupee',
    currencyCode: 'NPR',
    currencySymbol: 'NPR',
    exchangeRateToINR: 0.625,
    keyHighlights: ['Pashupatinath Sacred Hindu Temple', 'Boudhanath Giant Buddhist Stupa', 'Phewa Lake Boating in Pokhara', 'Kathmandu Durbar Square UNESCO Heritage'],
    budgetTips: [
      'Indian currency notes (up to ₹100 denomination) are widely accepted across Nepal',
      'Local tourist buses between Kathmandu and Pokhara cost ~₹700–₹1,000'
    ],
    visaNotice: 'No visa required for Indian citizens under the 1950 Indo-Nepal Treaty (valid Voter ID card or Passport accepted).'
  },
  {
    id: 'uk-london',
    name: 'London',
    country: 'United Kingdom',
    continent: 'Europe',
    tagline: 'Historic Big Ben, world-class free museums, and Thames river walks.',
    description: 'London combines centuries of royal history with modern vibrancy. Explore the Tower of London, British Museum, Hyde Park, and vibrant street markets of Camden and Borough.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=1200&q=80',
    lat: 51.5074,
    lon: -0.1278,
    avgDailyCostPerPersonINR: 8500,
    suggestedDays: 5,
    budgetRangeText: '₹95,000 – ₹1,45,000 (Incl. Flights)',
    currency: 'British Pound',
    currencyCode: 'GBP',
    currencySymbol: '£',
    exchangeRateToINR: 108.5,
    keyHighlights: ['British Museum & National Gallery (Free)', 'Tower Bridge & River Thames Walk', 'Big Ben & Westminster Abbey', 'Borough Market Street Food'],
    budgetTips: [
      'Almost all national museums in London are completely free to enter',
      'Tap your contactless debit/credit card for capped daily London Underground (Tube) fares'
    ],
    visaNotice: 'Standard UK Visitor Visa required prior to departure for Indian passport holders.'
  },
  {
    id: 'italy-rome',
    name: 'Rome',
    country: 'Italy',
    continent: 'Europe',
    tagline: 'Colosseum gladiators, Vatican masterpieces, and authentic Roman pasta.',
    description: 'The Eternal City is an open-air museum where ancient ruins like the Roman Colosseum and Pantheon meet Renaissance fountains, cobblestone piazzas, and world-renowned gelato.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=1200&q=80',
    lat: 41.9028,
    lon: 12.4964,
    avgDailyCostPerPersonINR: 7200,
    suggestedDays: 4,
    budgetRangeText: '₹80,000 – ₹1,20,000 (Incl. Flights)',
    currency: 'Euro',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateToINR: 92.4,
    keyHighlights: ['Colosseum & Roman Forum', 'St. Peter’s Basilica & Vatican Museums', 'Trevi Fountain & Spanish Steps', 'Trastevere Culinary Neighborhood'],
    budgetTips: [
      'Fill up your reusable bottle from Rome’s hundreds of historic clean public water fountains (Nasoni)',
      'Eat pizza al taglio (by the slice) for under €4 (~₹370) for quick, delicious lunches'
    ],
    visaNotice: 'Schengen Short-Stay Visa required prior to departure via VFS Global.'
  },
  {
    id: 'spain-barcelona',
    name: 'Barcelona',
    country: 'Spain',
    continent: 'Europe',
    tagline: 'Gaudí’s surreal Sagrada Família, Mediterranean beaches, and lively tapas bars.',
    description: 'Catalonia’s coastal capital dazzles with Antoni Gaudí’s architectural wonders at Park Güell and Sagrada Família, alongside breezy seaside walks on Barceloneta Beach and Gothic Quarter plazas.',
    category: 'Beaches & Coastal',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    lat: 41.3879,
    lon: 2.1699,
    avgDailyCostPerPersonINR: 6800,
    suggestedDays: 4,
    budgetRangeText: '₹78,000 – ₹1,15,000 (Incl. Flights)',
    currency: 'Euro',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateToINR: 92.4,
    keyHighlights: ['Basílica de la Sagrada Família', 'Park Güell Mosaic Terraces', 'Gothic Quarter (Barri Gòtic)', 'Barceloneta Beach Promenade'],
    budgetTips: [
      'Get a T-Casual 10-trip metro card for convenient, discounted public transport',
      'Look for the "Menú del Día" (menu of the day) at local lunch taverns for 3-course meals under €12 (~₹1,100)'
    ],
    visaNotice: 'Schengen Short-Stay Visa required prior to departure via Spanish consulate/VFS.'
  },
  {
    id: 'usa-newyork',
    name: 'New York City',
    country: 'United States',
    continent: 'North America',
    tagline: 'Soaring Manhattan skylines, Central Park paths, and Broadway lights.',
    description: 'The City That Never Sleeps features iconic views from Empire State and Brooklyn Bridge, peaceful picnics in Central Park, and diverse global food cultures from Chinatown to Greenwich Village.',
    category: 'Major Cities',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
    lat: 40.7128,
    lon: -74.0060,
    avgDailyCostPerPersonINR: 11000,
    suggestedDays: 5,
    budgetRangeText: '₹1,25,000 – ₹1,90,000 (Incl. Flights)',
    currency: 'US Dollar',
    currencyCode: 'USD',
    currencySymbol: '$',
    exchangeRateToINR: 86.8,
    keyHighlights: ['Central Park & Strawberry Fields', 'Brooklyn Bridge Pedestrian Walkway (Free)', 'Times Square & Broadway Theater District', 'High Line Elevated Park'],
    budgetTips: [
      'Take the free Staten Island Ferry for stunning views of the Statue of Liberty and Manhattan skyline without spending on tour boats',
      'Grab classic $1–$2 New York pizza slices and street bagels for great budget meals'
    ],
    visaNotice: 'US B1/B2 Tourist Visa required with mandatory in-person consular interview.'
  },
  {
    id: 'australia-sydney',
    name: 'Sydney',
    country: 'Australia',
    continent: 'Oceania',
    tagline: 'Iconic Opera House sails, Bondi coastal cliffs, and pristine harbor ferries.',
    description: 'Australia’s premier harbor city showcases architectural grandeur at the Sydney Opera House and Harbour Bridge, dramatic Pacific ocean scenery along the Bondi to Coogee coastal walk, and scenic ferry commutes.',
    category: 'Beaches & Coastal',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d4750?auto=format&fit=crop&w=1200&q=80',
    lat: -33.8688,
    lon: 151.2093,
    avgDailyCostPerPersonINR: 9000,
    suggestedDays: 5,
    budgetRangeText: '₹1,10,000 – ₹1,65,000 (Incl. Flights)',
    currency: 'Australian Dollar',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    exchangeRateToINR: 56.5,
    keyHighlights: ['Sydney Opera House & Circular Quay', 'Harbour Bridge Pylon Lookout', 'Bondi to Coogee Coastal Walk', 'Manly Beach Scenic Public Ferry'],
    budgetTips: [
      'Travel on weekends with Opal card fare caps for unlimited trains, buses, and ferries',
      'The Bondi to Coogee 6km coastal cliff walk is one of the world’s most scenic free experiences'
    ],
    visaNotice: 'Australian Visitor Visa (subclass 600) applied online via ImmiAccount.'
  },
  {
    id: 'egypt-cairo',
    name: 'Cairo & Giza',
    country: 'Egypt',
    continent: 'Africa',
    tagline: 'Great Pyramids of Giza, enigmatic Sphinx, and bustling Khan el-Khalili bazaar.',
    description: 'Explore the last remaining wonder of the ancient world at the Giza Pyramids, discover priceless Pharaonic treasures in the Grand Egyptian Museum, and sail traditional felucca boats along the historic Nile River.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
    lat: 30.0444,
    lon: 31.2357,
    avgDailyCostPerPersonINR: 3200,
    suggestedDays: 4,
    budgetRangeText: '₹45,000 – ₹65,000 (Incl. Flights)',
    currency: 'Egyptian Pound',
    currencyCode: 'EGP',
    currencySymbol: 'E£',
    exchangeRateToINR: 1.72,
    keyHighlights: ['Great Pyramids of Giza & Sphinx', 'Grand Egyptian Museum', 'Khan el-Khalili Souk', 'Nile Sunset Felucca Sail'],
    budgetTips: [
      'Use Uber or Careem apps for fixed transparent cab fares instead of street taxis',
      'Enjoy delicious local Koshary and Taameya (falafel) dishes for under 40 EGP (~₹70)'
    ],
    visaNotice: 'Visa on Arrival / Official e-Visa available for Indian tourists with valid passport.'
  },
  {
    id: 'brazil-rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    continent: 'South America',
    tagline: 'Christ the Redeemer summit, Copacabana sands, and lush Tijuca rainforest.',
    description: 'Set between granite mountains and the turquoise South Atlantic, Rio de Janeiro captivates with the mountaintop Christ the Redeemer, Sugarloaf Mountain cable car vistas, and the lively rhythm of Copacabana and Ipanema beaches.',
    category: 'Beaches & Coastal',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1200&q=80',
    lat: -22.9068,
    lon: -43.1729,
    avgDailyCostPerPersonINR: 5200,
    suggestedDays: 5,
    budgetRangeText: '₹98,000 – ₹1,55,000 (Incl. Flights)',
    currency: 'Brazilian Real',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    exchangeRateToINR: 15.1,
    keyHighlights: ['Christ the Redeemer at Corcovado', 'Sugarloaf Mountain Cable Car', 'Copacabana & Ipanema Beachfronts', 'Selarón Tile Steps in Lapa'],
    budgetTips: [
      'Take the modern Rio Metrô Rio system which connects South Zone beaches directly to downtown',
      'Dine at local "comida a quilo" (pay-by-weight buffets) for fresh Brazilian feijoada and grilled meats at half the cost of tourist restaurants'
    ],
    visaNotice: 'Brazil Tourist Visa applied online via electronic visa portal.'
  },
  {
    id: 'south-africa-capetown',
    name: 'Cape Town',
    country: 'South Africa',
    continent: 'Africa',
    tagline: 'Majestic Table Mountain, Boulders Beach penguins, and Cape of Good Hope.',
    description: 'Where two oceans meet rugged mountains. Ascend the Table Mountain cableway, meet African penguins at Boulders Beach, and drive the world-famous Chapman’s Peak cliffside coastal road.',
    category: 'Hill Stations & Nature',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    lat: -33.9249,
    lon: 18.4241,
    avgDailyCostPerPersonINR: 4800,
    suggestedDays: 5,
    budgetRangeText: '₹75,000 – ₹1,15,000 (Incl. Flights)',
    currency: 'South African Rand',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    exchangeRateToINR: 4.8,
    keyHighlights: ['Table Mountain Aerial Cableway', 'Boulders Beach African Penguin Colony', 'Cape Point & Cape of Good Hope', 'V&A Waterfront & Kirstenbosch Gardens'],
    budgetTips: [
      'The MyCiTi bus system provides safe, affordable transit throughout the city and beach suburbs',
      'Hike Lion’s Head at sunrise for panoramic views of Table Mountain and the Atlantic without paying cableway fees'
    ],
    visaNotice: 'South African Tourist e-Visa available online for Indian nationals.'
  },
  {
    id: 'turkey-istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    continent: 'Eurasia',
    tagline: 'Hagia Sophia dome, Blue Mosque minarets, and Bosphorus Strait crossroads.',
    description: 'The ancient capital spanning Europe and Asia. Marvel at Byzantine mosaics inside Hagia Sophia, explore the underground Basilica Cistern, browse 4,000 shops in the Grand Bazaar, and cross continents on a 15-minute Bosphorus ferry.',
    category: 'Heritage & Architecture',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80',
    lat: 41.0082,
    lon: 28.9784,
    avgDailyCostPerPersonINR: 3600,
    suggestedDays: 4,
    budgetRangeText: '₹48,000 – ₹72,000 (Incl. Flights)',
    currency: 'Turkish Lira',
    currencyCode: 'TRY',
    currencySymbol: '₺',
    exchangeRateToINR: 2.38,
    keyHighlights: ['Hagia Sophia & Blue Mosque', 'Topkapi Palace Imperial Treasury', 'Grand Bazaar & Spice Market', 'Bosphorus Public Ferry Cruise between Europe & Asia'],
    budgetTips: [
      'Buy an Istanbulkart for public ferries, trams, and metro rides at a fraction of taxi prices',
      'Savor street Simit sesame bread and Balık Ekmek (grilled fish sandwiches) under the Galata Bridge for under 100 TRY (~₹240)'
    ],
    visaNotice: 'Turkish e-Visa available online for Indian passport holders possessing valid US, UK, Ireland, or Schengen visa/residence permit.'
  }
];

export function findInternationalDestination(query: string): InternationalDestination | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  const clean = q.replace(/[^a-z0-9]/g, '');

  return INTERNATIONAL_DESTINATIONS.find(dest => {
    const nameLower = dest.name.toLowerCase();
    const countryLower = dest.country.toLowerCase();
    const nameClean = nameLower.replace(/[^a-z0-9]/g, '');
    const countryClean = countryLower.replace(/[^a-z0-9]/g, '');

    return (
      q === nameLower ||
      q === countryLower ||
      clean === nameClean ||
      clean === countryClean ||
      nameLower.includes(q) ||
      q.includes(nameLower) ||
      countryLower.includes(q) ||
      q.includes(countryLower)
    );
  }) || null;
}
