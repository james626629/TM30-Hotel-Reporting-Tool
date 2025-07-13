import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 mb-2">{t('footer.needHelp')}</h3>
            <p className="text-sm text-gray-600">{t('footer.contactText')}</p>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-4 text-center">
            {/* Phone */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium">{t('footer.phone')}:</span>
              <a href="tel:+66 826356266" 
               className="text-xs sm:text-sm text-blue-600 hover:underline">
                +66 826356266
              </a>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs sm:text-sm font-medium">{t('footer.whatsapp')}:</span>
              <a
                href="https://wa.me/+66826356266" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-green-600 hover:underline"
              >
                +66 826356266
              </a>
            </div>

            {/* Line */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <div className="h-4 w-4 bg-green-500 rounded-sm flex items-center justify-center">
                <span className="text-xs text-white font-bold">L</span>
              </div>
              <span className="text-xs sm:text-sm font-medium">{t('footer.line')}:</span>
              <a
                href="https://line.me/ti/p/~isaraks" // need to change link
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-green-600 hover:underline"
              >
                @อิศ (Is)The KPI Plus
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 px-2">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
