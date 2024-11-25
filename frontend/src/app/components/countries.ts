
  const twoLetterISO = [
    "ae", "ar", "at", "au", "be", "bg", "br", "ca", "ch", "cn", "co", "cu", "cz", "de", "eg",
    "fr", "gb", "gr", "hk", "hu", "id", "ie", "il", "in", "it", "jp", "kr", "lt", "lv", "ma",
    "mx", "my", "ng", "nl", "no", "nz", "ph", "pl", "pt", "ro", "rs", "ru", "sa", "se", "sg",
    "si", "sk", "th", "tr", "tw", "ua", "us", "ve", "za"
  ];
  
  const isoCountries: { [key: string]: string } = {
    'AE': 'United Arab Emirates', 'AR': 'Argentina', 'AT': 'Austria', 'AU': 'Australia',
    'BE': 'Belgium', 'BG': 'Bulgaria', 'BR': 'Brazil', 'CA': 'Canada', 'CH': 'Switzerland',
    'CN': 'China', 'CO': 'Colombia', 'CU': 'Cuba', 'CZ': 'Czech Republic', 'DE': 'Germany',
    'EG': 'Egypt', 'FR': 'France', 'GB': 'United Kingdom', 'GR': 'Greece', 'HK': 'Hong Kong',
    'HU': 'Hungary', 'ID': 'Indonesia', 'IE': 'Ireland', 'IL': 'Israel', 'IN': 'India',
    'IT': 'Italy', 'JP': 'Japan', 'KR': 'Korea', 'LT': 'Lithuania', 'LV': 'Latvia',
    'MA': 'Morocco', 'MX': 'Mexico', 'MY': 'Malaysia', 'NG': 'Nigeria', 'NL': 'Netherlands',
    'NO': 'Norway', 'NZ': 'New Zealand', 'PH': 'Philippines', 'PL': 'Poland', 'PT': 'Portugal',
    'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russian Federation', 'SA': 'Saudi Arabia',
    'SE': 'Sweden', 'SG': 'Singapore', 'SI': 'Slovenia', 'SK': 'Slovakia', 'TH': 'Thailand',
    'TR': 'Turkey', 'TW': 'Taiwan', 'UA': 'Ukraine', 'US': 'United States', 'VE': 'Venezuela',
    'ZA': 'South Africa'
  };
  
  // Function to get the country name by country code
  function getCountryName(countryCode: string): string {
    return isoCountries[countryCode] || countryCode;
  }
  
  // Function to generate countries array
  export const countries = twoLetterISO.map((isoCode) => {
    return {
      iso_2_alpha: isoCode,
      countryName: getCountryName(isoCode.toUpperCase())
    };
  });