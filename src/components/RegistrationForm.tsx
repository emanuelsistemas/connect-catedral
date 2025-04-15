import { useState } from 'react';
import { Search } from 'lucide-react';
import InputMask from 'react-input-mask';
import { cn } from '../lib/utils';

const BUSINESS_SEGMENTS = [
  'Atacado',
  'Varejo',
  'Prestação de Serviços',
  'Indústria',
  'Comércio',
  'Construção Civil',
  'Transportes',
  'Educação',
  'Saúde',
  'Tecnologia',
  'Alimentação',
  'Turismo',
  'Agronegócio',
  'Automotivo',
  'Financeiro',
  'Imobiliário',
  'Energia',
  'Telecomunicações'
].sort();

export function RegistrationForm() {
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cnpj');
  const [document, setDocument] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [segment, setSegment] = useState('');
  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [segmentSearch, setSegmentSearch] = useState('');

  const filteredSegments = BUSINESS_SEGMENTS.filter(s => 
    s.toLowerCase().includes(segmentSearch.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Handle form submission
    console.log({
      documentType,
      document,
      companyName,
      tradingName,
      email,
      whatsapp,
      segment
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-8">Cadastro</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Segment Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Segmento
                </label>
                <button
                  type="button"
                  onClick={() => setIsSegmentOpen(!isSegmentOpen)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left"
                >
                  {segment || 'Selecione um segmento'}
                </button>
                
                {isSegmentOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={segmentSearch}
                          onChange={(e) => setSegmentSearch(e.target.value)}
                          placeholder="Pesquisar segmento..."
                          className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-auto">
                      {filteredSegments.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Nenhum resultado encontrado
                        </div>
                      ) : (
                        filteredSegments.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSegment(s);
                              setIsSegmentOpen(false);
                              setSegmentSearch('');
                            }}
                            className={cn(
                              "w-full px-4 py-2 text-left hover:bg-secondary transition-colors",
                              segment === s && "bg-primary/10"
                            )}
                          >
                            {s}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tipo de Documento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocumentType('cnpj')}
                    className={cn(
                      "px-4 py-3 rounded-lg border text-center transition-colors",
                      documentType === 'cnpj'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    CNPJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType('cpf')}
                    className={cn(
                      "px-4 py-3 rounded-lg border text-center transition-colors",
                      documentType === 'cpf'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    CPF
                  </button>
                </div>
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {documentType.toUpperCase()}
                </label>
                <div className="relative">
                  <InputMask
                    mask={documentType === 'cnpj' ? "99.999.999/9999-99" : "999.999.999-99"}
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    placeholder={documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Company Name (only for CNPJ) */}
              {documentType === 'cnpj' && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Trading Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  WhatsApp
                </label>
                <InputMask
                  mask="(99) 9 9999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(00) 0 0000-0000"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Cadastrar
            </button>
          </form>
        </div>
      </div>

      <footer className="py-4 border-t border-border">
        <div className="container flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Desenvolvido por{' '}
            <a
              href="https://emasoftware.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-museomoderno font-medium bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent hover:to-primary transition-all duration-300"
            >
              ema-software
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}