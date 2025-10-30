import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { geminiService } from '../services/geminiService';

const countries = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", "Arabie saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan",
  "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi",
  "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Chili", "Chine", "Chypre", "Colombie", "Comores", "Congo-Brazzaville", "Congo-Kinshasa", "Corée du Nord", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba",
  "Danemark", "Djibouti", "Dominique",
  "Égypte", "Émirats arabes unis", "Équateur", "Érythrée", "Espagne", "Estonie", "Eswatini", "États-Unis", "Éthiopie",
  "Fidji", "Finlande", "France",
  "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée équatoriale", "Guinée-Bissau", "Guyana",
  "Haïti", "Honduras", "Hongrie",
  "Îles Cook", "Îles Marshall", "Îles Salomon", "Inde", "Indonésie", "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie",
  "Jamaïque", "Japon", "Jordanie",
  "Kazakhstan", "Kenya", "Kirghizistan", "Kiribati", "Koweït",
  "Laos", "Lesotho", "Lettonie", "Liban", "Liberia", "Libye", "Liechtenstein", "Lituanie", "Luxembourg",
  "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique",
  "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigeria", "Niue", "Norvège", "Nouvelle-Zélande",
  "Oman", "Ouganda", "Ouzbékistan",
  "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal",
  "Qatar",
  "République centrafricaine", "République dominicaine", "République tchèque", "Roumanie", "Royaume-Uni", "Russie", "Rwanda",
  "Saint-Kitts-et-Nevis", "Saint-Marin", "Saint-Vincent-et-les-Grenadines", "Sainte-Lucie", "Salvador", "Samoa", "Sao Tomé-et-Principe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie",
  "Tadjikistan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental", "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu",
  "Ukraine", "Uruguay",
  "Vanuatu", "Vatican", "Venezuela", "Viêt Nam",
  "Yémen",
  "Zambie", "Zimbabwe"
].sort((a, b) => a.localeCompare(b));

interface LocationFilterProps {
  country: string;
  cities: string[];
  onChange: (location: { country: string; cities: string[] }) => void;
  onError: (error: string) => void;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({ country, cities, onChange, onError }) => {
  const { t, language } = useTranslations();
  const [selectedCountryCities, setSelectedCountryCities] = useState<string[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isFetchingCities, setIsFetchingCities] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountryChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = e.target.value;
    onChange({ country: countryName, cities: [] }); // Reset cities on country change
    setSelectedCountryCities([]);
    setIsCityDropdownOpen(false);

    if (countryName) {
      setIsFetchingCities(true);
      onError('');
      try {
        const fetchedCities = await geminiService.getCitiesForCountry(countryName, language);
        setSelectedCountryCities(fetchedCities);
      } catch (err) {
        console.error(err);
        onError(t('locationFilter.errorFetchCities'));
      } finally {
        setIsFetchingCities(false);
      }
    }
  }, [language, onChange, onError, t]);

  const handleCityChange = useCallback((cityName: string) => {
    const newCities = cities.includes(cityName)
      ? cities.filter(c => c !== cityName)
      : [...cities, cityName];
    onChange({ country, cities: newCities });
  }, [country, cities, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
          {t('locationFilter.countryLabel')}
        </label>
        <select
          id="country"
          value={country}
          onChange={handleCountryChange}
          className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
        >
          <option value="">{t('locationFilter.countryPlaceholder')}</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {country && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('locationFilter.citiesLabel')}
          </label>
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              disabled={isFetchingCities}
              className="w-full p-4 border border-gray-300 rounded-md shadow-sm bg-white text-left flex justify-between items-center disabled:bg-gray-100"
              aria-haspopup="true"
              aria-expanded={isCityDropdownOpen}
            >
              <span className={cities.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                {isFetchingCities
                  ? t('locationFilter.citiesLoading')
                  : cities.length > 0
                    ? t('locationFilter.citiesSelected', { count: String(cities.length) })
                    : t('locationFilter.citiesPlaceholder')}
              </span>
              <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {isCityDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isFetchingCities ? (
                  <p className="px-4 py-2 text-sm text-gray-500">{t('locationFilter.citiesLoading')}</p>
                ) : selectedCountryCities.length > 0 ? (
                  selectedCountryCities.map(city => (
                    <label key={city} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cities.includes(city)}
                        onChange={() => handleCityChange(city)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ms-3">{city}</span>
                    </label>
                  ))
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-500">{t('locationFilter.noCities')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
