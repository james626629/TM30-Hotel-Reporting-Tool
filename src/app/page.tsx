'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { CalendarIcon, ArrowLeft, ArrowRight, Info, CheckCircle, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '@/components/ui/footer';
import { cn } from '@/lib/utils';


// Complete list of nationalities based on ICAO codes
const nationalities = [
  { value: 'AFG', label: 'Afghanistan (AFG)' },
  { value: 'ALB', label: 'Albania (ALB)' },
  { value: 'DZA', label: 'Algeria (DZA)' },
  { value: 'USA', label: 'United States of America (USA)' },
  { value: 'AGO', label: 'Angola (AGO)' },
  { value: 'ARG', label: 'Argentina (ARG)' },
  { value: 'AUS', label: 'Australia (AUS)' },
  { value: 'AUT', label: 'Austria (AUT)' },
  { value: 'AND', label: 'Andorra (AND)' },
  { value: 'ALD', label: 'Almadinah (ALD)' },
  { value: 'ATG', label: 'Antigua and Barbuda (ATG)' },
  { value: 'ARM', label: 'Armenia (ARM)' },
  { value: 'AZE', label: 'Azerbaijan (AZE)' },
  { value: 'AIA', label: 'Anguilla (AIA)' },
  { value: 'ANT', label: 'Netherlands Antilles (ANT)' },
  { value: 'ATF', label: 'French Southern Territories (ATF)' },
  { value: 'AWB', label: 'Aruba (AWB)' },
  { value: 'ASM', label: 'American Samoa (ASM)' },
  { value: 'BHS', label: 'Bahamas (BHS)' },
  { value: 'BHR', label: 'Bahrain (BHR)' },
  { value: 'BGD', label: 'Bangladesh (BGD)' },
  { value: 'BRB', label: 'Barbados (BRB)' },
  { value: 'BEL', label: 'Belgium (BEL)' },
  { value: 'BMU', label: 'Bermuda (BMU)' },
  { value: 'BOL', label: 'Bolivia (BOL)' },
  { value: 'BWA', label: 'Botswana (BWA)' },
  { value: 'BRA', label: 'Brazil (BRA)' },
  { value: 'GBR', label: 'United Kingdom (GBR)' },
  { value: 'B13', label: 'British Hong Kong (B13)' },
  { value: 'BRN', label: 'Brunei (BRN)' },
  { value: 'BGR', label: 'Bulgaria (BGR)' },
  { value: 'MMR', label: 'Myanmar (MMR)' },
  { value: 'B17', label: 'British Colony (B17)' },
  { value: 'BEN', label: 'Benin (BEN)' },
  { value: 'BDI', label: 'Burundi (BDI)' },
  { value: 'BTN', label: 'Bhutan (BTN)' },
  { value: 'BLZ', label: 'Belize (BLZ)' },
  { value: 'BFA', label: 'Burkina Faso (BFA)' },
  { value: 'BIH', label: 'Bosnia and Herzegovina (BIH)' },
  { value: 'BLR', label: 'Belarus (BLR)' },
  { value: 'BVT', label: 'Bouvet Island (BVT)' },
  { value: 'GBN', label: 'Northern Ireland (GBN)' },
  { value: 'KHM', label: 'Cambodia (KHM)' },
  { value: 'CMR', label: 'Cameroon (CMR)' },
  { value: 'CAN', label: 'Canada (CAN)' },
  { value: 'C04', label: 'Caroline Islands (C04)' },
  { value: 'CYM', label: 'Cayman Islands (CYM)' },
  { value: 'CAF', label: 'Central African Republic (CAF)' },
  { value: 'LKA', label: 'Sri Lanka (LKA)' },
  { value: 'TCD', label: 'Chad (TCD)' },
  { value: 'CHL', label: 'Chile (CHL)' },
  { value: 'CHN', label: 'China (CHN)' },
  { value: 'COL', label: 'Colombia (COL)' },
  { value: 'COG', label: 'Congo (COG)' },
  { value: 'CRI', label: 'Costa Rica (CRI)' },
  { value: 'CUB', label: 'Cuba (CUB)' },
  { value: 'C15', label: 'Curacao (C15)' },
  { value: 'CYP', label: 'Cyprus (CYP)' },
  { value: 'CZE', label: 'Czech Republic (CZE)' },
  { value: 'CPV', label: 'Cape Verde (CPV)' },
  { value: 'COM', label: 'Comoros (COM)' },
  { value: 'COK', label: 'Cook Islands (COK)' },
  { value: 'HRV', label: 'Croatia (HRV)' },
  { value: 'CCK', label: 'Cocos Islands (CCK)' },
  { value: 'CXR', label: 'Christmas Island (CXR)' },
  { value: 'COD', label: 'Democratic Republic of the Congo (COD)' },
  { value: 'D02', label: 'Daito (D02)' },
  { value: 'DNK', label: 'Denmark (DNK)' },
  { value: 'DOM', label: 'Dominican Republic (DOM)' },
  { value: 'NLD', label: 'Netherlands (NLD)' },
  { value: 'DIM', label: 'Dinamarcz (DIM)' },
  { value: 'D07', label: "D'Voike (D07)" },
  { value: 'DJI', label: 'Djibouti (DJI)' },
  { value: 'DMA', label: 'Dominica (DMA)' },
  { value: 'E01', label: 'East German (E01)' },
  { value: 'ECU', label: 'Ecuador (ECU)' },
  { value: 'EGY', label: 'Egypt (EGY)' },
  { value: 'ETH', label: 'Ethiopia (ETH)' },
  { value: 'SLV', label: 'El Salvador (SLV)' },
  { value: 'GNQ', label: 'Equatorial Guinea (GNQ)' },
  { value: 'EST', label: 'Estonia (EST)' },
  { value: 'ERI', label: 'Eritrea (ERI)' },
  { value: 'TMP', label: 'East Timor (TMP)' },
  { value: 'FRO', label: 'Faroe Islands (FRO)' },
  { value: 'FJI', label: 'Fiji (FJI)' },
  { value: 'FIN', label: 'Finland (FIN)' },
  { value: 'FRA', label: 'France (FRA)' },
  { value: 'FLK', label: 'Falkland Islands (FLK)' },
  { value: 'FXX', label: 'France Metropolitan (FXX)' },
  { value: 'GAB', label: 'Gabon (GAB)' },
  { value: 'GMB', label: 'Gambia (GMB)' },
  { value: 'DEU', label: 'Germany (DEU)' },
  { value: 'GHA', label: 'Ghana (GHA)' },
  { value: 'GRC', label: 'Greece (GRC)' },
  { value: 'GRL', label: 'Greenland (GRL)' },
  { value: 'GLP', label: 'Guadeloupe (GLP)' },
  { value: 'GTM', label: 'Guatemala (GTM)' },
  { value: 'GIN', label: 'Guinea (GIN)' },
  { value: 'GUY', label: 'Guyana (GUY)' },
  { value: 'GUM', label: 'Guam (GUM)' },
  { value: 'GRD', label: 'Grenada (GRD)' },
  { value: 'GNB', label: 'Guinea-Bissau (GNB)' },
  { value: 'GEO', label: 'Georgia (GEO)' },
  { value: 'GIB', label: 'Gibraltar (GIB)' },
  { value: 'GUF', label: 'French Guiana (GUF)' },
  { value: 'HTI', label: 'Haiti (HTI)' },
  { value: 'HND', label: 'Honduras (HND)' },
  { value: 'HUN', label: 'Hungary (HUN)' },
  { value: 'HKG', label: 'Hong Kong (HKG)' },
  { value: 'HMD', label: 'Heard and McDonald Islands (HMD)' },
  { value: 'ISL', label: 'Iceland (ISL)' },
  { value: 'IND', label: 'India (IND)' },
  { value: 'IDN', label: 'Indonesia (IDN)' },
  { value: 'IRN', label: 'Iran (IRN)' },
  { value: 'IRQ', label: 'Iraq (IRQ)' },
  { value: 'IRL', label: 'Ireland (IRL)' },
  { value: 'ISR', label: 'Israel (ISR)' },
  { value: 'ITA', label: 'Italy (ITA)' },
  { value: 'CIV', label: "Côte d'Ivoire (CIV)" },
  { value: 'IOT', label: 'British Indian Ocean Territory (IOT)' },
  { value: 'JAM', label: 'Jamaica (JAM)' },
  { value: 'JPN', label: 'Japan (JPN)' },
  { value: 'JOR', label: 'Jordan (JOR)' },
  { value: 'KEN', label: 'Kenya (KEN)' },
  { value: 'KOR', label: 'South Korea (KOR)' },
  { value: 'KWT', label: 'Kuwait (KWT)' },
  { value: 'KIR', label: 'Kiribati (KIR)' },
  { value: 'PRK', label: 'North Korea (PRK)' },
  { value: 'KAZ', label: 'Kazakhstan (KAZ)' },
  { value: 'KGZ', label: 'Kyrgyzstan (KGZ)' },
  { value: 'RKS', label: 'Kosovo (RKS)' },
  { value: 'LAO', label: 'Laos (LAO)' },
  { value: 'LBN', label: 'Lebanon (LBN)' },
  { value: 'LSO', label: 'Lesotho (LSO)' },
  { value: 'LBR', label: 'Liberia (LBR)' },
  { value: 'LBY', label: 'Libya (LBY)' },
  { value: 'LIE', label: 'Liechtenstein (LIE)' },
  { value: 'LUX', label: 'Luxembourg (LUX)' },
  { value: 'LVA', label: 'Latvia (LVA)' },
  { value: 'LTU', label: 'Lithuania (LTU)' },
  { value: 'MWI', label: 'Malawi (MWI)' },
  { value: 'MYS', label: 'Malaysia (MYS)' },
  { value: 'MLI', label: 'Mali (MLI)' },
  { value: 'MLT', label: 'Malta (MLT)' },
  { value: 'MTQ', label: 'Martinique (MTQ)' },
  { value: 'MRT', label: 'Mauritania (MRT)' },
  { value: 'MEX', label: 'Mexico (MEX)' },
  { value: 'MCO', label: 'Monaco (MCO)' },
  { value: 'MNG', label: 'Mongolia (MNG)' },
  { value: 'MAR', label: 'Morocco (MAR)' },
  { value: 'MOZ', label: 'Mozambique (MOZ)' },
  { value: 'FSM', label: 'Micronesia (FSM)' },
  { value: 'MDV', label: 'Maldives (MDV)' },
  { value: 'MUS', label: 'Mauritius (MUS)' },
  { value: 'MNP', label: 'Mariana (MNP)' },
  { value: 'MDG', label: 'Madagascar (MDG)' },
  { value: 'MKD', label: 'Macedonia (MKD)' },
  { value: 'MDA', label: 'Moldova (MDA)' },
  { value: 'TKM', label: 'Turkmenistan (TKM)' },
  { value: 'MHL', label: 'Marshall Islands (MHL)' },
  { value: 'MAC', label: 'Macau (MAC)' },
  { value: 'MNE', label: 'Montenegro (MNE)' },
  { value: 'MSR', label: 'Montserrat (MSR)' },
  { value: 'MYT', label: 'Mayotte (MYT)' },
  { value: 'NPL', label: 'Nepal (NPL)' },
  { value: 'N02', label: 'Guinea (N02)' },
  { value: 'NZL', label: 'New Zealand (NZL)' },
  { value: 'NIC', label: 'Nicaragua (NIC)' },
  { value: 'NER', label: 'Niger (NER)' },
  { value: 'NGA', label: 'Nigeria (NGA)' },
  { value: 'NOR', label: 'Norway (NOR)' },
  { value: 'NRU', label: 'Nauru (NRU)' },
  { value: 'NAM', label: 'Namibia (NAM)' },
  { value: 'NCL', label: 'New Caledonia (NCL)' },
  { value: 'NFK', label: 'Norfolk Island (NFK)' },
  { value: 'NIU', label: 'Niue (NIU)' },
  { value: 'OMN', label: 'Oman (OMN)' },
  { value: 'PAK', label: 'Pakistan (PAK)' },
  { value: 'PLT', label: 'Palestine (PLT)' },
  { value: 'PAN', label: 'Panama (PAN)' },
  { value: 'PNG', label: 'Papua New Guinea (PNG)' },
  { value: 'PRY', label: 'Paraguay (PRY)' },
  { value: 'PER', label: 'Peru (PER)' },
  { value: 'PHL', label: 'Philippines (PHL)' },
  { value: 'POL', label: 'Poland (POL)' },
  { value: 'PRT', label: 'Portugal (PRT)' },
  { value: 'P10', label: 'Princeble (P10)' },
  { value: 'PRI', label: 'Puerto Rico (PRI)' },
  { value: 'PLW', label: 'Palau (PLW)' },
  { value: 'PCN', label: 'Pitcairn (PCN)' },
  { value: 'PYF', label: 'French Polynesia (PYF)' },
  { value: 'QAT', label: 'Qatar (QAT)' },
  { value: 'REU', label: 'Reunion Island (REU)' },
  { value: 'ROU', label: 'Romania (ROU)' },
  { value: 'RUS', label: 'Russia (RUS)' },
  { value: 'RWA', label: 'Rwanda (RWA)' },
  { value: 'SLB', label: 'Solomon Islands (SLB)' },
  { value: 'SAU', label: 'Saudi Arabia (SAU)' },
  { value: 'STP', label: 'Sao Tome and Principe (STP)' },
  { value: 'SCT', label: 'Scotland (SCT)' },
  { value: 'SEN', label: 'Senegal (SEN)' },
  { value: 'SLE', label: 'Sierra Leone (SLE)' },
  { value: 'SGP', label: 'Singapore (SGP)' },
  { value: 'SOM', label: 'Somalia (SOM)' },
  { value: 'ZAF', label: 'South Africa (ZAF)' },
  { value: 'ESP', label: 'Spain (ESP)' },
  { value: 'S14', label: 'Spanish Sahara (S14)' },
  { value: 'SDN', label: 'Sudan (SDN)' },
  { value: 'SUR', label: 'Suriname (SUR)' },
  { value: 'SWZ', label: 'Swaziland (SWZ)' },
  { value: 'SWE', label: 'Sweden (SWE)' },
  { value: 'CHE', label: 'Switzerland (CHE)' },
  { value: 'SYR', label: 'Syria (SYR)' },
  { value: 'XXA', label: 'Stateless (XXA)' },
  { value: 'WSM', label: 'Samoa (WSM)' },
  { value: 'SYC', label: 'Seychelles (SYC)' },
  { value: 'SMR', label: 'San Marino (SMR)' },
  { value: 'LCA', label: 'Saint Lucia (LCA)' },
  { value: 'KNA', label: 'Saint Kitts and Nevis (KNA)' },
  { value: 'VCT', label: 'Saint Vincent and the Grenadines (VCT)' },
  { value: 'SVN', label: 'Slovenia (SVN)' },
  { value: 'SVK', label: 'Slovakia (SVK)' },
  { value: 'SGS', label: 'South Georgia and South Sandwich Islands (SGS)' },
  { value: 'SHN', label: 'Saint Helena (SHN)' },
  { value: 'SJM', label: 'Svalbard and Jan Mayen Islands (SJM)' },
  { value: 'SPM', label: 'Saint Pierre and Miquelon (SPM)' },
  { value: 'SRB', label: 'Serbia (SRB)' },
  { value: 'SSD', label: 'South Sudan (SSD)' },
  { value: 'TWN', label: 'Taiwan (TWN)' },
  { value: 'TZA', label: 'Tanzania (TZA)' },
  { value: 'THA', label: 'Thailand (THA)' },
  { value: 'TGO', label: 'Togo (TGO)' },
  { value: 'TTO', label: 'Trinidad and Tobago (TTO)' },
  { value: 'TUN', label: 'Tunisia (TUN)' },
  { value: 'TUR', label: 'Turkey (TUR)' },
  { value: 'TON', label: 'Tonga (TON)' },
  { value: 'T10', label: 'Trust Pacific (T10)' },
  { value: 'TUV', label: 'Tuvalu (TUV)' },
  { value: 'TJK', label: 'Tajikistan (TJK)' },
  { value: 'TCA', label: 'Turks and Caicos Islands (TCA)' },
  { value: 'TKL', label: 'Tokelau (TKL)' },
  { value: 'TLS', label: 'Timor-Leste (TLS)' },
  { value: 'UGA', label: 'Uganda (UGA)' },
  { value: 'URY', label: 'Uruguay (URY)' },
  { value: 'ARE', label: 'United Arab Emirates (ARE)' },
  { value: 'XXX', label: 'Unknown (XXX)' },
  { value: 'UKR', label: 'Ukraine (UKR)' },
  { value: 'UZB', label: 'Uzbekistan (UZB)' },
  { value: 'UNO', label: 'United Nations (UNO)' },
  { value: 'UMI', label: 'United States Minor Outlying Islands (UMI)' },
  { value: 'UNA', label: 'Specialized Agency of United Nations (UNA)' },
  { value: 'UTO', label: 'Utopia (UTO)' },
  { value: 'VAT', label: 'Vatican City (VAT)' },
  { value: 'VEN', label: 'Venezuela (VEN)' },
  { value: 'VNM', label: 'Vietnam (VNM)' },
  { value: 'VUT', label: 'Vanuatu (VUT)' },
  { value: 'VIS', label: 'Virgin Islands (VIS)' },
  { value: 'WLF', label: 'Wallis and Futuna Islands (WLF)' },
  { value: 'XXB', label: 'Refugee (1951 Convention) (XXB)' },
  { value: 'XXC', label: 'Refugee (Other) (XXC)' },
  { value: 'YEM', label: 'Yemen (YEM)' },
  { value: 'YUG', label: 'Yugoslavia (YUG)' },
  { value: 'Y03', label: 'Yemen Rep. (Y03)' },
  { value: 'ZMB', label: 'Zambia (ZMB)' },
  { value: 'ZAR', label: 'Zaire (ZAR)' },
  { value: 'ZIM', label: 'Zimbabwe (ZIM)' },
  { value: 'ZWE', label: 'Zimbabwe (ZWE)' }
];

// Gender options
const genders = [
  { value: 'M', label: 'Male (M)' },
  { value: 'F', label: 'Female (F)' },
];

// Language options with flag emojis (English first as default)
const languages = [
  { value: 'en', label: 'ENGLISH', flag: '🇬🇧', nativeLabel: 'English' },
  { value: 'th', label: 'ไทย (Thai)', flag: '🇹🇭', nativeLabel: 'ไทย' },
  { value: 'zh', label: '繁體中文 (Chinese (Traditional))', flag: '🇨🇳', nativeLabel: '繁體中文' },
  { value: 'ru', label: 'Русский (Russian)', flag: '🇷🇺', nativeLabel: 'Русский' },
];

export default function TM30FormPage() {
  // Step management
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [submissionData, setSubmissionData] = React.useState<{ submissionId?: string; roomKeyNumber?: string; numberOfGuests?: number; numberOfNights?: number; translations?: any } | null>(null);

  // Step 1: Consent and Information
  const [hasConsented, setHasConsented] = React.useState<boolean>(false);

  // Step 2: Number of Guests and Hotel Information
  const [numberOfGuests, setNumberOfGuests] = React.useState<number>(1);
  const [numberOfNights, setNumberOfNights] = React.useState<number>(1);

  // Step 3: Hotel and Contact Info
  const [email, setEmail] = React.useState<string>('');
  const [selectedHotel, setSelectedHotel] = React.useState<string>('');
  const [roomNumber, setRoomNumber] = React.useState<string>('');
  const [availableHotels, setAvailableHotels] = React.useState<{ id: string; name: string; rooms: Record<string, string> }[]>([]);
  const [isLoadingHotels, setIsLoadingHotels] = React.useState<boolean>(false);

  // Step 4: Guest Information (existing fields for guest 1)
  const [firstName, setFirstName] = React.useState<string>('');
  const [middleName, setMiddleName] = React.useState<string>('');
  const [lastName, setLastName] = React.useState<string>('');
  const [gender, setGender] = React.useState<string>('');
  const [passportNumber, setPassportNumber] = React.useState<string>('');
  const [nationality, setNationality] = React.useState<string>('');
  const [birthDate, setBirthDate] = React.useState<Date | undefined>();
  const [checkoutDate, setCheckoutDate] = React.useState<Date | undefined>();
  const [checkinDate, setCheckinDate] = React.useState<Date | undefined>();
  const [phoneNumber, setPhoneNumber] = React.useState<string>('');

  // Guest 2 information (new fields)
  const [firstName2, setFirstName2] = React.useState<string>('');
  const [middleName2, setMiddleName2] = React.useState<string>('');
  const [lastName2, setLastName2] = React.useState<string>('');
  const [gender2, setGender2] = React.useState<string>('');
  const [passportNumber2, setPassportNumber2] = React.useState<string>('');
  const [nationality2, setNationality2] = React.useState<string>('');
  const [birthDate2, setBirthDate2] = React.useState<Date | undefined>();
  const [checkoutDate2, setCheckoutDate2] = React.useState<Date | undefined>();
  const [checkinDate2, setCheckinDate2] = React.useState<Date | undefined>();
  const [phoneNumber2, setPhoneNumber2] = React.useState<string>('');

  // --- START: NEW STATE FOR MULTI-ROOM BOOKING ---
  const [numberOfRooms, setNumberOfRooms] = React.useState<number>(1);
  const [currentRoomIndex, setCurrentRoomIndex] = React.useState<number>(0); // 0-based index
  const [allSubmissionsData, setAllSubmissionsData] = React.useState<{ submissionId?: string; roomKeyNumber?: string; numberOfGuests?: number; numberOfNights?: number; guestName?: string; roomNumber?: string; hotelName?: string; email?: string }[]>([]);
  // --- END: NEW STATE FOR MULTI-ROOM BOOKING ---

  // For nationality search
  const [nationalitySearch, setNationalitySearch] = React.useState<string>('');
  const [nationalitySearch2, setNationalitySearch2] = React.useState<string>('');

  // --- START: INSERT PASSPORT PHOTO STATE AND HANDLER HERE ---
  const [passportPhoto, setPassportPhoto] = React.useState<File | null>(null);
  const [passportPhoto2, setPassportPhoto2] = React.useState<File | null>(null); // For the second guest

  const [passportPhotoPreview, setPassportPhotoPreview] = React.useState<string | null>(null);
  const [passportPhotoPreview2, setPassportPhotoPreview2] = React.useState<string | null>(null);

  const [passportPhotoError, setPassportPhotoError] = React.useState<string | null>(null);
  const [passportPhotoError2, setPassportPhotoError2] = React.useState<string | null>(null);

  // For nationality popover
  const [openNationality, setOpenNationality] = React.useState(false);
  const [openNationality2, setOpenNationality2] = React.useState(false);

  // Place this inside your component function, before the return statement
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

const resetForNextRoom = () => {
  // Resets only the data for a single room/guest registration
  setNumberOfGuests(1);
  setNumberOfNights(1);
  setEmail('');
  setSelectedHotel('');
  setRoomNumber('');
  setFirstName('');
  setMiddleName('');
  setLastName('');
  setGender('');
  setPassportNumber('');
  setNationality('');
  setBirthDate(undefined);
  setCheckoutDate(undefined);
  setCheckinDate(undefined);
  setPhoneNumber('');
  setFirstName2('');
  setMiddleName2('');
  setLastName2('');
  setGender2('');
  setPassportNumber2('');
  setNationality2('');
  setBirthDate2(undefined);
  setCheckoutDate2(undefined);
  setCheckinDate2(undefined);
  setPhoneNumber2('');
  setPassportPhoto(null);
  setPassportPhoto2(null);
  setPassportPhotoPreview(null);
  setPassportPhotoPreview2(null);
  };



  const handlePassportPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, guestNumber: number) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      if (guestNumber === 1) {
        setPassportPhoto(null);
        setPassportPhotoPreview(null);
      } else {
        setPassportPhoto2(null);
        setPassportPhotoPreview2(null);
      }
      return;
    }

    const imageCompressionModule = await import('browser-image-compression');
    const imageCompression = imageCompressionModule.default;

    const options = {
      maxSizeMB: 2, // Max file size in MB
      maxWidthOrHeight: 1920, // Max width or height
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      if (guestNumber === 1) {
        setPassportPhotoError(null);
        setPassportPhoto(compressedFile);
        setPassportPhotoPreview(URL.createObjectURL(compressedFile));
      } else { // guestNumber === 2
        setPassportPhotoError2(null);
        setPassportPhoto2(compressedFile);
        setPassportPhotoPreview2(URL.createObjectURL(compressedFile));
      }
    } catch (error) {
      const errorMessage = t('common.imageCompressionError');
      if (guestNumber === 1) {
        setPassportPhotoError(errorMessage);
        setPassportPhoto(null);
        setPassportPhotoPreview(null);
      } else {
        setPassportPhotoError2(errorMessage);
        setPassportPhoto2(null);
        setPassportPhotoPreview2(null);
      }
    }
  };
  // --- END: INSERT PASSPORT PHOTO STATE AND HANDLER HERE ---

  // Form submission state
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Load hotel data when component mounts
  React.useEffect(() => {
    const loadHotelData = async () => {
      setIsLoadingHotels(true);
      try {
        // Fetch hotel data from the API
        const response = await fetch('/api/hotels');
        if (response.ok) {
          const data = await response.json();
          setAvailableHotels(data.hotels || []);
        } else {
          console.error('Failed to fetch hotel data from API');
          setAvailableHotels([]);
        }
      } catch (error) {
        console.error('Failed to load hotel data:', error);
        setAvailableHotels([]);
      } finally {
        setIsLoadingHotels(false);
      }
    };

    loadHotelData();
  }, []);

  // Filtered nationalities for search
  const filteredNationalities = React.useMemo(() => {
    if (!nationalitySearch.trim()) return nationalities;
    const search = nationalitySearch.trim().toLowerCase();
    return nationalities.filter(
      (nat) =>
        nat.label.toLowerCase().includes(search) ||
        nat.value.toLowerCase().includes(search)
    );
  }, [nationalitySearch]);

  // Filtered nationalities for guest 2 search
  const filteredNationalities2 = React.useMemo(() => {
    if (!nationalitySearch2.trim()) return nationalities;
    const search = nationalitySearch2.trim().toLowerCase();
    return nationalities.filter(
      (nat) =>
        nat.label.toLowerCase().includes(search) ||
        nat.value.toLowerCase().includes(search)
    );
  }, [nationalitySearch2]);

  // Get available rooms for selected hotel
  const availableRooms = React.useMemo(() => {
    const hotel = availableHotels.find(h => h.id === selectedHotel);
    return hotel ? Object.keys(hotel.rooms) : [];
  }, [selectedHotel, availableHotels]);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSubmissionData(null);
    setHasConsented(false);
    setNumberOfGuests(1);
    setNumberOfNights(1);
    setEmail('');
    setSelectedHotel('');
    setRoomNumber('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('');
    setPassportNumber('');
    setNationality('');
    setBirthDate(undefined);
    setCheckoutDate(undefined);
    setCheckinDate(undefined);
    setPhoneNumber('');
    // Reset guest 2 fields
    setFirstName2('');
    setMiddleName2('');
    setLastName2('');
    setGender2('');
    setPassportNumber2('');
    setNationality2('');
    setBirthDate2(undefined);
    setCheckoutDate2(undefined);
    setCheckinDate2(undefined);
    setPhoneNumber2('');
    // Reset passport photos and previews
    setPassportPhoto(null);
    setPassportPhoto2(null);
    setPassportPhotoPreview(null);
    setPassportPhotoPreview2(null);
    setSubmitMessage(null);
    setSubmitError(null);
  };

  // Form submission
  const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  };

  // Replace the old handleSubmit function with this one
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsSubmitting(true);
  setSubmitMessage(null);
  setSubmitError(null);

  const hotel = availableHotels.find(h => h.id === selectedHotel);

  // Use FormData to handle file uploads
  const formData = new FormData();

  // Append all form fields to the FormData object
  formData.append('numberOfGuests', numberOfGuests.toString());
  formData.append('numberOfNights', numberOfNights.toString());
  formData.append('email', email);
  formData.append('hotelName', hotel?.name || '');
  formData.append('roomNumber', roomNumber);

  // Guest 1 data
  formData.append('firstName', firstName);
  formData.append('middleName', middleName);
  formData.append('lastName', lastName);
  formData.append('gender', gender);
  formData.append('passportNumber', passportNumber);
  formData.append('nationality', nationality);
  if (birthDate) formData.append('birthDate', format(birthDate, 'dd/MM/yyyy'));
  if (checkinDate) formData.append('checkinDate', format(checkinDate, 'dd/MM/yyyy'));
  if (checkoutDate) formData.append('checkoutDate', format(checkoutDate, 'dd/MM/yyyy'));
  formData.append('phoneNumber', phoneNumber);
  if (passportPhoto) {
    if (typeof passportPhoto.name !== 'string') {
      setSubmitError('Invalid passport photo file name. Please choose a different file.');
      setIsSubmitting(false);
      return;
    }
    // FIX: Create a unique filename for guest 1 to prevent iPhone camera conflicts
    const uniqueFilename1 = `guest1_${sanitizeFilename(passportPhoto.name)}`;
    const sanitizedFile = new File([passportPhoto], uniqueFilename1, {
      type: passportPhoto.type,
    });
    formData.append('passportPhoto', sanitizedFile);
  }

  // Guest 2 data (only if 2 guests selected)
  if (numberOfGuests === 2) {
    formData.append('firstName2', firstName2);
    formData.append('middleName2', middleName2);
    formData.append('lastName2', lastName2);
    formData.append('gender2', gender2);
    formData.append('passportNumber2', passportNumber2);
    formData.append('nationality2', nationality2);
    if (birthDate2) formData.append('birthDate2', format(birthDate2, 'dd/MM/yyyy'));
    if (checkinDate2) formData.append('checkinDate2', format(checkinDate2, 'dd/MM/yyyy'));
    if (checkoutDate2) formData.append('checkoutDate2', format(checkoutDate2, 'dd/MM/yyyy'));
    formData.append('phoneNumber2', phoneNumber2);
    if (passportPhoto2) {
      if (typeof passportPhoto2.name !== 'string') {
        setSubmitError('Invalid passport photo file name for Guest 2. Please choose a different file.');
        setIsSubmitting(false);
        return;
      }
      // FIX: Create a unique filename for guest 2 to prevent iPhone camera conflicts
      const uniqueFilename2 = `guest2_${sanitizeFilename(passportPhoto2.name)}`;
      const sanitizedFile2 = new File([passportPhoto2], uniqueFilename2, {
        type: passportPhoto2.type,
      });
      formData.append('passportPhoto2', sanitizedFile2);
    }
  }

  formData.append('consent', 'true');
  formData.append('language', i18n.language || 'en');

  console.log('Submitting Form Data...');

  try {
    const response = await fetch('/api/submit-tm30', {
      method: 'POST',
      body: formData, // Send FormData object directly
      // DO NOT set Content-Type header, the browser does it automatically
    });

    const result = await response.json();
    if (response.ok) {
      // Store the submission data for display on the success page
      setSubmissionData(result);

      // --- START: UPDATED SUCCESS HANDLING FOR MULTI-ROOM ---

      // Store this room's submission data for the final summary page
      // Make sure 'firstName' and 'lastName' are available in this scope
      setAllSubmissionsData(prev => [...prev, {
        ...result,
        guestName: numberOfGuests === 1
          ? `${firstName} ${lastName}`
          : `${firstName} ${lastName} & ${firstName2} ${lastName2}`,
        roomNumber: roomNumber,
        hotelName: hotel?.name || '',
        email: email
      }]);

      // Check if there are more rooms to process
      if (currentRoomIndex < numberOfRooms - 1) {
        // If there are more rooms, loop to the next room:
        setCurrentRoomIndex(prev => prev + 1); // Increment the current room index
        resetForNextRoom(); // Clear the form fields for the next room's data entry
        setCurrentStep(3); // Go back to the start of the guest info process (which is now Step 3)
      } else {
        // If all rooms are done, go to the final summary screen
        setCurrentStep(6);
      }
      // --- END: UPDATED SUCCESS HANDLING FOR MULTI-ROOM ---
    } else {
      // Error handling if the API call was not successful
      setSubmitError(`Registration for Room ${currentRoomIndex + 1} failed: ${result.error || 'Unknown error'} ${result.details ? `- ${result.details}` : ''}`);
    }
  } catch (error) {
    console.error('Network or other error during submission:', error);
    setSubmitError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
  }

  setIsSubmitting(false);
};


  // Step 1: Information and Consent Screen
  const renderStep1 = () => (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <CardTitle className="text-lg sm:text-xl">{t('step1.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-2">{t('step1.informationNotice')}</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            {t('step1.informationText')}
          </p>
        </div>

        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500">
          <h3 className="font-semibold text-yellow-900 mb-2">{t('step1.retentionPolicy')}</h3>
          <p className="text-yellow-800 text-sm leading-relaxed">
            {t('step1.retentionText')}
          </p>
        </div>

        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
          <h3 className="font-semibold text-green-900 mb-2">{t('step1.dataSecurity')}</h3>
          <p className="text-green-800 text-sm leading-relaxed">
            {t('step1.securityText')}
          </p>
        </div>

        <div className="pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
              required
            />
            <Label htmlFor="consent" className="text-sm font-normal">
              {t('step1.consentText')}
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          onClick={nextStep}
          className="w-full sm:w-auto"
          disabled={!hasConsented}
        >
          <span className="text-sm sm:text-base">{t('step1.continueButton')}</span>
          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Step 2
  // Add this new render function inside your TM30FormPage component
  const renderRoomSelectionStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{t('step2.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="numberOfRooms" className="required">
            {t('step2.numberOfRoomsLabel')}
          </Label>
          <Select
            name="numberOfRooms"
            value={numberOfRooms.toString()}
            onValueChange={(value) => setNumberOfRooms(Number.parseInt(value))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={t('step2.numberOfRoomsPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((rooms) => (
                <SelectItem key={rooms} value={rooms.toString()}>
                  {rooms} {rooms === 1 ? t('step2.room') : t('step2.rooms')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {t('step2.helperText')}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        {/* The "Back" button */}
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('step4.backButton')}
        </Button>
        {/* The "Continue" button */}
        <Button onClick={nextStep} className="w-full sm:w-auto">
          {t('step1.continueButton')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );


  // Step 3: Number of Guests Selection
  const renderStep3 = () => (
    <Card className="max-w-full mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">{t('step3.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="required">{t('step3.numberOfGuests')} </Label>
            <div className="mt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="guests-1"
                  name="numberOfGuests"
                  value="1"
                  checked={numberOfGuests === 1}
                  onChange={() => setNumberOfGuests(1)}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="guests-1" className="text-sm font-normal cursor-pointer">
                  {t('step3.oneGuest')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="guests-2"
                  name="numberOfGuests"
                  value="2"
                  checked={numberOfGuests === 2}
                  onChange={() => setNumberOfGuests(2)}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="guests-2" className="text-sm font-normal cursor-pointer">
                  {t('step3.twoGuests')}
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('step3.guestSelectionHelper')}
            </p>
          </div>

          <div>
            <Label htmlFor="numberOfNights" className="required">{t('step3.numberOfNights')} </Label>
            <Select name="numberOfNights" value={numberOfNights.toString()} onValueChange={(value) => setNumberOfNights(Number.parseInt(value))} required>
              <SelectTrigger>
                <SelectValue placeholder={t('step3.numberOfNightsPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((nights) => (
                  <SelectItem key={nights} value={nights.toString()}>
                    {nights} {nights === 1 ? t('step3.night') : t('step3.nights')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {t('step3.numberOfNightsHelper')}
            </p>
          </div>

          {/* --- START: Passport Photo Upload --- */}
        <div>
          <Label htmlFor="passportPhoto" className="required">
            {t('step3.passportPhotoLabel')}
          </Label>
          <input
            id="passportPhoto"
            name="passportPhoto"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => handlePassportPhotoChange(e, 1)}
            required
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {passportPhotoPreview && (
            <div className="mt-4">
              <img
                src={passportPhotoPreview}
                alt="Passport photo preview"
                className="max-h-40 rounded-lg shadow-md"
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {t('step3.passportPhotoHelper')}
          </p>
          {passportPhotoError && <p className="text-sm text-red-600 mt-2">{passportPhotoError}</p>}
        </div>
        {/* --- Conditionally Render Passport Photo for Guest 2 --- */}
        {numberOfGuests === 2 && (
          <div>
            <Label htmlFor="passportPhoto2" className="required">
              {t('step3.passportPhotoLabelGuest2')} {/* Recommended: Use a specific label */}
            </Label>
            <input
              id="passportPhoto2"
              name="passportPhoto2"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => handlePassportPhotoChange(e, 2)}
              required
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {passportPhotoPreview2 && (
              <div className="mt-4">
                <img
                  src={passportPhotoPreview2}
                  alt="Passport photo preview 2"
                  className="max-h-40 rounded-lg shadow-md"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t('step3.passportPhotoHelper')}
            </p>
            {passportPhotoError2 && <p className="text-sm text-red-600 mt-2">{passportPhotoError2}</p>}
        </div>
        )}
        {/* --- END: Passport Photo Upload --- */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('step3.backButton')}
        </Button>
        <Button
          onClick={nextStep}
          className="w-full sm:w-auto"
          disabled={!passportPhoto || (numberOfGuests === 2 && !passportPhoto2)}
        >
          <span className="hidden sm:inline">{t('step3.continueButton')}</span>
          <span className="sm:hidden">{t('step3.continueButtonMobile')}</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Step 4: Hotel and Contact Information
  const renderStep4 = () => (
    <Card className="max-w-full mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">{t('step4.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="required">{t('step4.email')} </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('step4.emailPlaceholder')}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('step4.emailHelper')}
            </p>
          </div>

          {/* Hotel Selection */}
          <div>
            <Label htmlFor="hotel" className="required">{t('step4.hotel')} </Label>
            {isLoadingHotels ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : (
              <Select name="hotel" value={selectedHotel} onValueChange={setSelectedHotel} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('step4.hotelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableHotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t('step4.hotelHelper')}
            </p>
          </div>

          {/* Room Number */}
          {selectedHotel && (
            <div>
              <Label htmlFor="roomNumber" className="required">{t('step4.roomNumber')} </Label>
              <Select name="roomNumber" value={roomNumber} onValueChange={setRoomNumber} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('step4.roomPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roomNumber && (
                <p className="text-xs text-green-600 mt-1">
                  {t('step4.roomKeyHelper')}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
              {t('step4.roomHelper')}
            </p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('step4.backButton')}
        </Button>
        <Button
          onClick={nextStep}
          disabled={!email || !selectedHotel || !roomNumber}
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">{t('step4.continueButton')}</span>
          <span className="sm:hidden">{t('step4.continueButtonMobile')}</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Step 5: Guest Information
  const renderStep5 = () => (
    <Card className="max-w-full mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">
          {numberOfGuests === 1 ? t('step5.titleSingle') : t('step5.titleMultiple')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest 1 Section */}
          <div className="space-y-4">
            {numberOfGuests > 1 && (
              <div className="border-b pb-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('step5.guest1Info')}
                </h3>
              </div>
            )}

            {/* First Name */}
            <div>
              <Label htmlFor="firstName">
                {t('step5.firstName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middleName">{t('step5.middleName')}</Label>
              <Input
                id="middleName"
                name="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName">
                {t('step5.lastName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">
                {t('step5.gender')} <span className="text-red-500">*</span>
              </Label>
              <Select name="gender" value={gender} onValueChange={setGender} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('step5.genderPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Passport Number */}
            <div>
              <Label htmlFor="passportNumber">
                {t('step5.passportNumber')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="passportNumber"
                name="passportNumber"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                required
              />
            </div>

            {/* Nationality */}
            <div>
              <Label htmlFor="nationality">
                {t('step5.nationality')} <span className="text-red-500">*</span>
              </Label>
              <Popover open={openNationality} onOpenChange={setOpenNationality}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openNationality}
                    className="w-full justify-between font-normal"
                  >
                    {nationality
                      ? nationalities.find((nat) => nat.value === nationality)?.label
                      : t('step5.nationalityPlaceholder')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t('step5.nationalitySearch')}
                      value={nationalitySearch}
                      onValueChange={setNationalitySearch}
                    />
                    <CommandEmpty>{t('common.noResultsFound')}</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {filteredNationalities.map((nat) => (
                        <CommandItem
                          key={nat.value}
                          value={nat.value}
                          onSelect={(currentValue) => {
                            setNationality(currentValue === nationality ? "" : currentValue);
                            setOpenNationality(false); // Closes this specific popover
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              nationality === nat.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {nat.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>



            {/* Birth Date */}
            <div>
              <Label htmlFor="birthDate">
                {t('step5.birthDate')} <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="birthDate" variant={'outline'} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, 'dd/MM/yyyy') : <span>{t('step5.birthDatePlaceholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    // REVERTED: Use "dropdown-buttons" for v8
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

           {/* Check-in Date */}
          <div>
            <Label htmlFor="checkinDate">
              {t('step5.checkinDate')} <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="checkinDate" variant={'outline'} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkinDate ? format(checkinDate, 'dd/MM/yyyy') : <span>{t('step5.checkinDatePlaceholder')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 min-w-[280px]">
                <Calendar
                  mode="single"
                  selected={checkinDate}
                  onSelect={setCheckinDate}
                  initialFocus
                  // CHANGE 1: Disable all dates up to and including yesterday.
                  // This makes today (the current date) selectable.
                  disabled={(date) => date <= yesterday}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div>
            <Label htmlFor="checkoutDate">
              {t('step5.checkoutDate')} <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                {/* CHANGE 2: Disable the button until a check-in date is chosen. */}
                <Button id="checkoutDate" variant={'outline'} className="w-full justify-start text-left font-normal" disabled={!checkinDate}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkoutDate ? format(checkoutDate, 'dd/MM/yyyy') : <span>{t('step5.checkoutDatePlaceholder')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 min-w-[280px]">
                <Calendar
                  mode="single"
                  selected={checkoutDate}
                  onSelect={setCheckoutDate}
                  initialFocus
                  // FIX: Ensure the function always returns a boolean.
                  // If checkinDate exists, compare it; otherwise, return false.
                  disabled={(date) => (checkinDate ? date <= checkinDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>




            {/* Phone Number */}
            <div>
              <Label htmlFor="phoneNumber">{t('step5.phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Guest 2 Information - Only show if 2 guests selected */}
          {numberOfGuests === 2 && (
            <div className="space-y-4 mt-8">
              <div className="border-b pb-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('step5.guest2Info')}
                </h3>
              </div>

              {/* Guest 2 First Name */}
              <div>
                <Label htmlFor="firstName2">
                  {t('step5.firstName2')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName2"
                  name="firstName2"
                  value={firstName2}
                  onChange={(e) => setFirstName2(e.target.value)}
                  required
                />
              </div>

              {/* Middle Name */}
              <div>
                <Label htmlFor="middleName2">{t('step5.middleName2')}</Label>
                <Input
                  id="middleName2"
                  name="middleName2"
                  value={middleName2}
                  onChange={(e) => setMiddleName2(e.target.value)}
                />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName2">
                  {t('step5.lastName2')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName2"
                  name="lastName2"
                  value={lastName2}
                  onChange={(e) => setLastName2(e.target.value)}
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender2">
                  {t('step5.gender2')} <span className="text-red-500">*</span>
                </Label>
                <Select name="gender2" value={gender2} onValueChange={setGender2} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('step5.genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Passport Number */}
              <div>
                <Label htmlFor="passportNumber2">
                  {t('step5.passportNumber2')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="passportNumber2"
                  name="passportNumber2"
                  value={passportNumber2}
                  onChange={(e) => setPassportNumber2(e.target.value)}
                  required
                />
              </div>

              {/* Nationality 2 */}
              <div>
                <Label htmlFor="nationality2">
                  {t('step5.nationality2')} <span className="text-red-500">*</span>
                </Label>
                <Popover open={openNationality2} onOpenChange={setOpenNationality2}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openNationality2}
                      className="w-full justify-between font-normal"
                    >
                      {nationality2
                        ? nationalities.find((nat) => nat.value === nationality2)?.label
                        : t('step5.nationalityPlaceholder')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder={t('step5.nationalitySearch')}
                        value={nationalitySearch2}
                        onValueChange={setNationalitySearch2}
                      />
                      <CommandEmpty>{t('common.noResultsFound')}</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {filteredNationalities2.map((nat) => (
                          <CommandItem
                            key={nat.value}
                            value={nat.value}
                            onSelect={(currentValue) => {
                              setNationality2(currentValue === nationality2 ? "" : currentValue);
                              setOpenNationality2(false); // Closes this specific popover
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                nationality2 === nat.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {nat.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Birth Date */}
              <div>
                <Label htmlFor="birthDate2">
                  {t('step5.birthDate2')} <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birthDate2"
                      variant={'outline'}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthDate2 ? format(birthDate2, 'dd/MM/yyyy') : <span>{t('step5.birthDatePlaceholder')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={birthDate2}
                      onSelect={setBirthDate2}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      // ADD THIS LINE to hide the redundant text label
                      classNames={{ caption_label: "hidden" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

             {/* Check-in Date (Guest 2) */}
            <div>
              <Label htmlFor="checkinDate2">
                {t('step5.checkinDate2')} <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="checkinDate2" variant={'outline'} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkinDate2 ? format(checkinDate2, 'dd/MM/yyyy') : <span>{t('step5.checkinDatePlaceholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkinDate2}
                    onSelect={setCheckinDate2}
                    initialFocus
                    // CHANGE 1: Use the 'yesterday' constant to allow selecting today's date.
                    disabled={(date) => date <= yesterday}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out Date (Guest 2) */}
            <div>
              <Label htmlFor="checkoutDate2">
                {t('step5.checkoutDate2')} <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  {/* CHANGE 2: Disable the button until a check-in date is chosen. */}
                  <Button id="checkoutDate2" variant={'outline'} className="w-full justify-start text-left font-normal" disabled={!checkinDate2}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkoutDate2 ? format(checkoutDate2, 'dd/MM/yyyy') : <span>{t('step5.checkoutDatePlaceholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkoutDate2}
                    onSelect={setCheckoutDate2}
                    captionLayout="dropdown"
                    navLayout="around"
                    initialFocus
                    // CHANGE 3: Link to the check-in date and ensure a boolean is always returned.
                    disabled={(date) => (checkinDate2 ? date <= checkinDate2 : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phoneNumber2">{t('step5.phoneNumber2')}</Label>
                <Input
                  id="phoneNumber2"
                  name="phoneNumber2"
                  value={phoneNumber2}
                  onChange={(e) => setPhoneNumber2(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between pt-6 gap-3">
            <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('step5.backButton')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !firstName || !lastName || !passportNumber || !gender || !nationality || !birthDate || !checkinDate || !checkoutDate || (numberOfGuests === 2 && (!firstName2 || !lastName2 || !passportNumber2 || !gender2 || !nationality2 || !birthDate2 || !checkinDate2 || !checkoutDate2))}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? t('step5.submittingButton') : t('step5.submitButton')}
            </Button>
          </div>

          {/* Client-side validation message for guest 1 */}
          {(!firstName || !lastName || !passportNumber || !gender || !nationality || !birthDate || !checkinDate || !checkoutDate) && (
            <p className="mt-4 text-sm text-orange-600">
              {t('step5.requiredFieldsGuest1')}
            </p>
          )}

          {/* Client-side validation message for guest 2 */}
          {numberOfGuests === 2 && (!firstName2 || !lastName2 || !passportNumber2 || !gender2 || !nationality2 || !birthDate2 || !checkinDate2 || !checkoutDate2) && (
            <p className="mt-4 text-sm text-orange-600">
              {t('step5.requiredFieldsGuest2')}
            </p>
          )}

          {submitMessage && <p className="mt-4 text-sm text-green-600">{submitMessage}</p>}
          {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}
        </form>
      </CardContent>
    </Card>
  );

  // Step 6: Thank You / Success Screen
  const renderStep6 = () => {
    // Determine if we have multiple rooms (use allSubmissionsData) or single room scenario
    const isMultipleRooms = allSubmissionsData.length > 1;
    const totalRoomsRegistered = isMultipleRooms ? allSubmissionsData.length : 1;

    // For multiple rooms, get data from allSubmissionsData; for single room, use current state
    const displayData = isMultipleRooms ? allSubmissionsData : [submissionData];

    // Get hotel info
    const hotel = availableHotels.find(h => h.id === selectedHotel);

    // Get email translations from the last submission
    const emailTranslations = submissionData?.translations;

    return (
      <Card className="max-w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-green-700">{t('step6.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-600 h-24 w-24 sm:h-32 sm:w-32" />
            <div className="text-center mt-4">
              <p className="text-green-700 font-semibold">
                {t('step6.successText')}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {isMultipleRooms
                  // If multiple rooms, use the key for multiple room registration
                  // The 'count' variable will handle pluralization for "room/rooms"
                  ? t('step6.registeredMultipleRooms', { count: totalRoomsRegistered })

                  // If a single room, use the key for single room registration
                  // The 'count' variable will handle pluralization for "guest/guests"
                  : t('step6.registeredSingleRoom', { count: numberOfGuests })
                }
              </p>
            </div>
          </div>

          {submitMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-800">{submitMessage}</p>
            </div>
          )}

          {/* Registration Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {isMultipleRooms ? t('step6.registrationSummaryTitle') : t('step6.emailSentTitle')}
            </h3>

           {/* For multiple rooms, show summary of all registrations */}
            {isMultipleRooms ? (
              <div className="space-y-4">
                <p className="text-sm text-blue-800 mb-4">
                  {t('step6.summary.emailConfirmationNotice')}
                </p>

                {allSubmissionsData.map((submission, index) => (
                  <div key={index} className="bg-white border border-blue-100 rounded p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {t('step6.summary.roomRegistrationTitle', { roomNumber: index + 1 })}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                        <h5 className="font-semibold text-blue-900 mb-1">{t('step6.summary.roomInfoTitle')}</h5>
                        <p className="text-sm mb-1">
                          <strong>{t('step6.summary.roomNumberLabel')}</strong> {submission.roomNumber || t('common.notAvailable')}
                        </p>
                        <p className="text-sm">
                          <strong>{t('step6.summary.roomKeyLabel')}</strong> {submission.roomKeyNumber || t('common.willBeProvided')}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <h5 className="font-semibold text-gray-800 mb-1">{t('step6.summary.registrationDetailsTitle')}</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li><strong>{t('step6.summary.submissionIdLabel')}</strong> {submission.submissionId}</li>
                          <li><strong>{t('step6.summary.guestsLabel')}</strong> {submission.guestName}</li>
                          <li><strong>{t('step6.summary.numGuestsLabel')}</strong> {submission.numberOfGuests}</li>
                          <li><strong>{t('step6.summary.numNightsLabel')}</strong> {submission.numberOfNights}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single room registration display */
              <div>
                <p className="text-sm text-blue-800 mb-4">
                  {t('step6.emailSentText')} <strong>{email}</strong>
                </p>

                <div className="bg-white border border-blue-100 rounded p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {emailTranslations?.guestWelcome?.replace('{{hotelName}}', hotel?.name || selectedHotel || '') ||
                     t('step6.welcomeTitle')?.replace('{{hotelName}}', hotel?.name || selectedHotel || '')}
                  </h4>

                  <p className="text-sm text-gray-700 mb-3">
                    {numberOfGuests === 1
                      // Use the key for a single guest greeting
                      ? t('step6.greeting_oneGuest', {
                          firstName: firstName,
                          lastName: lastName
                        })
                      // Use the key for a two-guest greeting
                      : t('step6.greeting_twoGuests', {
                          firstName: firstName,
                          lastName: lastName,
                          firstName2: firstName2,
                          lastName2: lastName2
                        })
                    }
                  </p>


                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 my-3">
                    <h5 className="font-semibold text-blue-900 mb-1">
                      {emailTranslations?.guestRoomInfo || t('step6.roomInfoTitle')}
                    </h5>
                    <p className="text-sm mb-1">
                      <strong>{emailTranslations?.guestRoomNumber || t('step6.roomNumber')}</strong> {roomNumber}
                    </p>
                    <p className="text-sm">
                      <strong>{emailTranslations?.guestRoomKey || t('step6.roomKeyCode')}</strong> {submissionData?.roomKeyNumber || 'Will be provided'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <h5 className="font-semibold text-gray-800 mb-1">
                      {emailTranslations?.guestRegDetails || t('step6.registrationDetails')}
                    </h5>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      <li>{emailTranslations?.guestSubmissionId || t('step6.submissionId')} {submissionData?.submissionId || 'Processing...'}</li>
                      <li>{t('step6.NoGuests')} {numberOfGuests}</li>
                      <li>{t('step6.NoNights')} {numberOfNights}</li>
                      {numberOfGuests === 2 && (
                        <>
                          <li>Guest 1: {firstName} {lastName}</li>
                          <li>Guest 2: {firstName2} {lastName2}</li>
                        </>
                      )}
                      <li>{emailTranslations?.guestCheckinDate || t('step6.checkinDate')} {checkinDate ? format(checkinDate, 'dd/MM/yyyy') : 'Not provided'}</li>
                      <li>{emailTranslations?.guestCheckoutDate || t('step6.checkoutDate')} {checkoutDate ? format(checkoutDate, 'dd/MM/yyyy') : 'Not provided'}</li>
                    </ul>
                  </div>

                  <p className="text-sm text-gray-700 mt-3">
                    {emailTranslations?.guestHelp || t('step6.helpText')}
                  </p>

                  <p className="text-sm text-gray-700 mt-2">
                    {emailTranslations?.guestEnjoy || t('step6.enjoyStayText')}
                  </p>

                  <p className="text-xs text-gray-600 mt-3 italic">
                    {emailTranslations?.guestPrivacy || t('step6.privacyNotice')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {t('step6.keepRecordsText')}
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={resetForm}>
            {t('step6.registerAnotherButton')}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 md:p-8 max-w-3xl">
          <header className="flex flex-col items-center mb-8">
            <div className="w-full flex justify-end mb-4">
              <Select
                value={i18n.language || 'en'}
                onValueChange={(lang) => i18n.changeLanguage(lang)}
                defaultValue="en"
              >
                <SelectTrigger className="w-[120px] sm:w-[140px] md:w-[180px] bg-gray-800 text-white border-gray-600 hover:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="text-sm sm:text-base shrink-0">
                        {languages.find(l => l.value === (i18n.language || 'en'))?.flag || '🇬🇧'}
                      </span>
                      <span className="font-medium text-xs sm:text-sm truncate">
                        {languages.find(l => l.value === (i18n.language || 'en'))?.nativeLabel || 'ENGLISH'}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg min-w-[180px] sm:min-w-[220px]">
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-base shrink-0 min-w-[20px]">{lang.flag}</span>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900 truncate w-full">{lang.nativeLabel}</span>
                          <span className="text-xs text-gray-500 truncate w-full hidden sm:block">{lang.label}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-center px-4">{t('title')}</h1>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-6 px-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      step < currentStep || (step === currentStep && currentStep === 6)
                          ? 'bg-green-600 text-white'
                          : step === currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 6 && (
                    <div
                      className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 ${
                        step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 text-xs sm:text-sm text-muted-foreground text-center px-4">
              {currentStep === 1 && `${t('common.step')} 1: ${t('step1.title')}`}
              {currentStep === 2 && `${t('common.step')} 2: ${t('step2.title')}`}
              {currentStep === 3 && `${t('common.step')} 3: ${t('step3.title')}`}
              {currentStep === 4 && `${t('common.step')} 4: ${t('step4.title')}`}
              {currentStep === 5 && `${t('common.step')} 5: ${t('step5.title')}`}
              {currentStep === 6 && `${t('common.step')} 6: ${t('common.complete')}`}
            </div>
          </header>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderRoomSelectionStep()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
