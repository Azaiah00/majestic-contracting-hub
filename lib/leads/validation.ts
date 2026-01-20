/**
 * ===========================================
 * VIRGINIA GEOFENCING & VALIDATION
 * ===========================================
 * Validates leads are within Virginia service area.
 * Uses ZIP code and county validation.
 */

/**
 * Virginia ZIP code prefix ranges.
 * VA ZIP codes start with 20, 22, or 23.
 */
const VA_ZIP_PREFIXES = ['20', '22', '23'];

/**
 * Major Virginia counties/cities that Majestic serves.
 * Organized by region for territory analysis.
 */
export const VA_COUNTIES = {
  // Northern Virginia (NoVA) - Primary market
  northernVA: [
    'Fairfax',
    'Fairfax City',
    'Arlington',
    'Alexandria',
    'Loudoun',
    'Prince William',
    'Manassas',
    'Manassas Park',
    'Falls Church',
    'Fauquier',
    'Stafford',
    'Spotsylvania',
    'Fredericksburg',
  ],
  // Richmond Metro - Secondary market
  richmondMetro: [
    'Richmond',
    'Henrico',
    'Chesterfield',
    'Hanover',
    'Goochland',
    'Powhatan',
    'Colonial Heights',
    'Petersburg',
  ],
  // Hampton Roads
  hamptonRoads: [
    'Virginia Beach',
    'Norfolk',
    'Newport News',
    'Hampton',
    'Chesapeake',
    'Portsmouth',
    'Suffolk',
    'Williamsburg',
    'James City',
    'York',
  ],
  // Central Virginia
  centralVA: [
    'Albemarle',
    'Charlottesville',
    'Lynchburg',
    'Bedford',
    'Roanoke',
    'Salem',
    'Montgomery',
    'Blacksburg',
  ],
} as const;

/**
 * All VA counties as a flat array.
 */
export const ALL_VA_COUNTIES = [
  ...VA_COUNTIES.northernVA,
  ...VA_COUNTIES.richmondMetro,
  ...VA_COUNTIES.hamptonRoads,
  ...VA_COUNTIES.centralVA,
];

/**
 * Full Virginia county list.
 * This is used for county-based lead searches and validation.
 * Note: Independent cities are not included here.
 */
export const VA_COUNTY_NAMES = [
  'Accomack',
  'Albemarle',
  'Alleghany',
  'Amelia',
  'Amherst',
  'Appomattox',
  'Arlington',
  'Augusta',
  'Bath',
  'Bedford',
  'Bland',
  'Botetourt',
  'Brunswick',
  'Buchanan',
  'Buckingham',
  'Campbell',
  'Caroline',
  'Carroll',
  'Charles City',
  'Charlotte',
  'Chesterfield',
  'Clarke',
  'Craig',
  'Culpeper',
  'Cumberland',
  'Dickenson',
  'Dinwiddie',
  'Essex',
  'Fairfax',
  'Fauquier',
  'Floyd',
  'Fluvanna',
  'Franklin',
  'Frederick',
  'Giles',
  'Gloucester',
  'Goochland',
  'Grayson',
  'Greene',
  'Greensville',
  'Halifax',
  'Hanover',
  'Henrico',
  'Henry',
  'Highland',
  'Isle of Wight',
  'James City',
  'King and Queen',
  'King George',
  'King William',
  'Lancaster',
  'Lee',
  'Loudoun',
  'Louisa',
  'Lunenburg',
  'Madison',
  'Mathews',
  'Mecklenburg',
  'Middlesex',
  'Montgomery',
  'Nelson',
  'New Kent',
  'Northampton',
  'Northumberland',
  'Nottoway',
  'Orange',
  'Page',
  'Patrick',
  'Pittsylvania',
  'Powhatan',
  'Prince Edward',
  'Prince George',
  'Prince William',
  'Pulaski',
  'Rappahannock',
  'Richmond',
  'Roanoke',
  'Rockbridge',
  'Rockingham',
  'Russell',
  'Scott',
  'Shenandoah',
  'Smyth',
  'Southampton',
  'Spotsylvania',
  'Stafford',
  'Surry',
  'Sussex',
  'Tazewell',
  'Warren',
  'Washington',
  'Westmoreland',
  'Wise',
  'Wythe',
  'York',
] as const;

/**
 * County display names with "County" suffix.
 * This keeps the UI clear and avoids confusion with city names.
 */
export const VA_COUNTY_DISPLAY_NAMES = VA_COUNTY_NAMES.map(
  (county) => `${county} County`
);

/**
 * Sample ZIP to county mapping for common areas.
 * This is a simplified mapping - production should use a full database.
 */
const ZIP_TO_COUNTY: Record<string, string> = {
  // Fairfax
  '22030': 'Fairfax',
  '22031': 'Fairfax',
  '22032': 'Fairfax',
  '22033': 'Fairfax',
  '22034': 'Fairfax',
  '22035': 'Fairfax',
  '22039': 'Fairfax',
  '22041': 'Fairfax',
  '22042': 'Fairfax',
  '22043': 'Fairfax',
  '22044': 'Fairfax',
  '22046': 'Falls Church',
  '22060': 'Fairfax',
  '22079': 'Fairfax',
  '22101': 'Fairfax',
  '22102': 'Fairfax',
  '22124': 'Fairfax',
  '22150': 'Fairfax',
  '22151': 'Fairfax',
  '22152': 'Fairfax',
  '22153': 'Fairfax',
  '22180': 'Fairfax',
  '22181': 'Fairfax',
  '22182': 'Fairfax',
  
  // Arlington
  '22201': 'Arlington',
  '22202': 'Arlington',
  '22203': 'Arlington',
  '22204': 'Arlington',
  '22205': 'Arlington',
  '22206': 'Arlington',
  '22207': 'Arlington',
  '22209': 'Arlington',
  '22211': 'Arlington',
  '22213': 'Arlington',
  
  // Alexandria
  '22301': 'Alexandria',
  '22302': 'Alexandria',
  '22303': 'Alexandria',
  '22304': 'Alexandria',
  '22305': 'Alexandria',
  '22306': 'Fairfax',
  '22307': 'Fairfax',
  '22308': 'Fairfax',
  '22309': 'Fairfax',
  '22310': 'Fairfax',
  '22311': 'Alexandria',
  '22312': 'Fairfax',
  '22314': 'Alexandria',
  '22315': 'Fairfax',
  
  // Loudoun
  '20105': 'Loudoun',
  '20117': 'Loudoun',
  '20120': 'Loudoun',
  '20121': 'Loudoun',
  '20129': 'Loudoun',
  '20130': 'Loudoun',
  '20132': 'Loudoun',
  '20135': 'Loudoun',
  '20141': 'Loudoun',
  '20147': 'Loudoun',
  '20148': 'Loudoun',
  '20152': 'Loudoun',
  '20158': 'Loudoun',
  '20164': 'Loudoun',
  '20165': 'Loudoun',
  '20166': 'Loudoun',
  '20175': 'Loudoun',
  '20176': 'Loudoun',
  
  // Prince William
  '22025': 'Prince William',
  '22026': 'Prince William',
  '22110': 'Prince William',
  '22111': 'Prince William',
  '22112': 'Prince William',
  '22172': 'Prince William',
  '22191': 'Prince William',
  '22192': 'Prince William',
  '22193': 'Prince William',
  '22194': 'Prince William',
  '20109': 'Prince William',
  '20110': 'Manassas',
  '20111': 'Manassas',
  '20112': 'Prince William',
  '20155': 'Prince William',
  '20169': 'Prince William',
  '20181': 'Prince William',
  
  // Richmond area
  '23173': 'Richmond',
  '23219': 'Richmond',
  '23220': 'Richmond',
  '23221': 'Richmond',
  '23222': 'Richmond',
  '23223': 'Richmond',
  '23224': 'Richmond',
  '23225': 'Richmond',
  '23226': 'Richmond',
  '23227': 'Richmond',
  '23228': 'Henrico',
  '23229': 'Henrico',
  '23230': 'Richmond',
  '23231': 'Henrico',
  '23233': 'Henrico',
  '23234': 'Chesterfield',
  '23235': 'Chesterfield',
  '23236': 'Chesterfield',
  '23237': 'Chesterfield',
  '23238': 'Henrico',
  '23294': 'Henrico',
};

/**
 * Validation result for a lead location.
 */
export interface ValidationResult {
  isValid: boolean;
  isVirginia: boolean;
  county: string | null;
  region: string | null;
  message: string;
}

/**
 * Validates if a ZIP code is in Virginia.
 * 
 * @param zipCode - The ZIP code to validate
 * @returns True if the ZIP code is in Virginia
 */
export function isVirginiaZipCode(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  if (cleanZip.length !== 5) {
    return false;
  }
  
  const prefix = cleanZip.substring(0, 2);
  return VA_ZIP_PREFIXES.includes(prefix);
}

/**
 * Gets the county for a Virginia ZIP code.
 * 
 * @param zipCode - The ZIP code to look up
 * @returns The county name or null if not found
 */
export function getCountyFromZip(zipCode: string): string | null {
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  return ZIP_TO_COUNTY[cleanZip] || null;
}

/**
 * Gets the region for a county.
 * 
 * @param county - The county name
 * @returns The region name or null if not found
 */
export function getRegionFromCounty(county: string): string | null {
  for (const [region, counties] of Object.entries(VA_COUNTIES)) {
    if (counties.some(c => c.toLowerCase() === county.toLowerCase())) {
      return region;
    }
  }
  return null;
}

/**
 * Validates a lead's location for Virginia service area.
 * 
 * @param zipCode - The lead's ZIP code
 * @param state - The lead's state (optional, for additional validation)
 * @returns Detailed validation result
 */
export function validateLeadLocation(
  zipCode: string,
  state?: string
): ValidationResult {
  // Clean the ZIP code
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  // Check if state is explicitly not Virginia
  if (state && state.toUpperCase() !== 'VA' && state.toLowerCase() !== 'virginia') {
    return {
      isValid: false,
      isVirginia: false,
      county: null,
      region: null,
      message: `Lead is outside Virginia service area (${state})`,
    };
  }
  
  // Validate ZIP code format
  if (cleanZip.length !== 5) {
    return {
      isValid: false,
      isVirginia: false,
      county: null,
      region: null,
      message: 'Invalid ZIP code format',
    };
  }
  
  // Check if ZIP is in Virginia
  const isVA = isVirginiaZipCode(cleanZip);
  
  if (!isVA) {
    return {
      isValid: false,
      isVirginia: false,
      county: null,
      region: null,
      message: 'ZIP code is outside Virginia',
    };
  }
  
  // Get county and region
  const county = getCountyFromZip(cleanZip);
  const region = county ? getRegionFromCounty(county) : null;
  
  return {
    isValid: true,
    isVirginia: true,
    county,
    region,
    message: county 
      ? `Valid Virginia location: ${county}` 
      : 'Valid Virginia ZIP code',
  };
}

/**
 * Determines if a lead should be auto-archived.
 * Leads outside Virginia are flagged for archival.
 * 
 * @param zipCode - The lead's ZIP code
 * @param state - The lead's state
 * @returns True if the lead should be archived
 */
export function shouldAutoArchive(zipCode: string, state?: string): boolean {
  const validation = validateLeadLocation(zipCode, state);
  return !validation.isVirginia;
}
