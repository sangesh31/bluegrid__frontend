import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <Globe className="w-4 h-4" />
            <span className="font-semibold">{language === 'en' ? 'English' : 'தமிழ்'}</span>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={`cursor-pointer ${language === 'en' ? 'bg-blue-50 font-semibold' : ''}`}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('ta')}
          className={`cursor-pointer ${language === 'ta' ? 'bg-blue-50 font-semibold' : ''}`}
        >
          <span className="mr-2">🇮🇳</span>
          தமிழ் (Tamil)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher;
