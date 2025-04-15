import { useState } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import InputMask from 'react-input-mask';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const BUSINESS_SEGMENTS = [
  'Açougue',
  'Agronegócio',
  'Alimentação',
  'Atacado',
  'Automotivo',
  'Cabeleireiro e Barbearia',
  'Comércio',
  'Construção Civil',
  'Educação',
  'Energia',
  'Estética e Beleza',
  'Farmácia',
  'Financeiro',
  'Imobiliário',
  'Indústria',
  'Loja de Calçados',
  'Loja de Eletrônicos',
  'Loja de Materiais de Construção',
  'Loja de Roupas',
  'Manicure e Pedicure',
  'Mercearia',
  'Oficina Mecânica',
  'Padaria e Confeitaria',
  'Papelaria',
  'Pet Shop',
  'Prestação de Serviços',
  'Saúde',
  'Serviços Contábeis',
  'Serviços de Consultoria',
  'Serviços de Limpeza',
  'Serviços de Manutenção Veicular',
  'Serviços Jurídicos',
  'Tecnologia',
  'Telecomunicações',
  'Transportes',
  'Troca de Pneus',
  'Turismo',
  'Varejo'
];

export function RegistrationForm() {
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cnpj');
  const [document, setDocument] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [segment, setSegment] = useState('');
  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [segmentSearch, setSegmentSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSegments = BUSINESS_SEGMENTS.filter(s => 
    s.toLowerCase().includes(segmentSearch.toLowerCase())
  );

  function resetForm() {
    setDocumentType('cnpj');
    setDocument('');
    setCompanyName('');
    setTradingName('');
    setEmail('');
    setWhatsapp('');
    setSegment('');
    setSegmentSearch('');
    setError(null);
  }

  // Função para validar CNPJ
  function isValidCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (parseInt(cnpj.charAt(12)) !== digito) return false;
    
    // Segundo dígito verificador
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    digito = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (parseInt(cnpj.charAt(13)) !== digito) return false;
    
    return true;
  }

  // Função para validar CPF
  function isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let digito = 11 - (soma % 11);
    if (digito === 10 || digito === 11) digito = 0;
    if (digito !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    digito = 11 - (soma % 11);
    if (digito === 10 || digito === 11) digito = 0;
    if (digito !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  // Função para consultar CNPJ na BrasilAPI
  async function consultarCNPJ(cnpj: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
      
      if (!isValidCNPJ(cnpjLimpo)) {
        setError('CNPJ inválido. Verifique os números digitados.');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('CNPJ não encontrado na base de dados.');
        } else {
          setError('Erro ao consultar CNPJ. Tente novamente mais tarde.');
        }
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Preencher os campos do formulário com os dados retornados
      setCompanyName(data.razao_social || '');
      setTradingName(data.nome_fantasia || '');
      setEmail(data.email || '');
      
      // Tentar identificar o segmento com base no CNAE principal
      if (data.cnae_fiscal_descricao) {
        const descricaoCnae = data.cnae_fiscal_descricao.toLowerCase();
        
        // Mapear descrição CNAE para segmentos do formulário
        const segmentoEncontrado = BUSINESS_SEGMENTS.find(seg =>
          descricaoCnae.includes(seg.toLowerCase())
        );
        
        if (segmentoEncontrado) {
          setSegment(segmentoEncontrado);
        }
      }
      
    } catch (err) {
      console.error('Erro ao consultar CNPJ:', err);
      setError('Erro ao processar a consulta. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  // Add this function to handle document type change
  function handleDocumentTypeChange(type: 'cpf' | 'cnpj') {
    setDocumentType(type);
    setDocument(''); // Clear document field
    setError(null); // Clear any previous errors
    
    // If switching from CNPJ to CPF, also clear company related fields
    if (type === 'cpf') {
      setCompanyName('');
      setTradingName('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios básicos
      if (!document || !email || !whatsapp || !segment) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const documentoLimpo = document.replace(/[^\d]/g, '');

      // Validação específica por tipo de documento
      if (documentType === 'cnpj') {
        if (!isValidCNPJ(documentoLimpo)) {
          throw new Error('CNPJ inválido');
        }
        // Para CNPJ, razão social é obrigatória
        if (!companyName) {
          throw new Error('Razão Social é obrigatória para CNPJ');
        }
      } else {
        // Validação de CPF
        if (!isValidCPF(documentoLimpo)) {
          throw new Error('CPF inválido');
        }
      }

      // Salvar no banco
      const { error: dbError } = await supabase
        .from('registrations')
        .insert({
          document_type: documentType,
          document: documentoLimpo,
          company_name: documentType === 'cnpj' ? companyName : null,
          trading_name: documentType === 'cnpj' ? tradingName : null,
          email,
          whatsapp: whatsapp.replace(/\D/g, ''),
          segment
        });

      if (dbError) throw dbError;

      // Mostrar confirmação
      const result = await Swal.fire({
        title: 'Cadastro realizado!',
        text: 'Seu cadastro foi realizado com sucesso.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb'
      });

      // Limpar formulário e redirecionar
      if (result.isConfirmed) {
        resetForm();
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar:', err);
      setError(err.message || 'Erro ao realizar cadastro');
      toast.error(err.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="container py-8">
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
                  className={cn(
                    "w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex items-center justify-between",
                    isSegmentOpen && "border-primary ring-2 ring-primary"
                  )}
                >
                  <span className={segment ? "text-foreground" : "text-muted-foreground"}>
                    {segment || 'Selecione um segmento'}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isSegmentOpen && "transform rotate-180"
                  )} />
                </button>
                
                {isSegmentOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg">
                    <div className="p-2 border-b border-border">
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
                    
                    <div className="max-h-60 overflow-auto py-1">
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
                              "w-full px-4 py-2 text-left hover:bg-accent transition-colors text-sm",
                              segment === s && "bg-primary/10 text-primary"
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
                    onClick={() => handleDocumentTypeChange('cnpj')}
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
                    onClick={() => handleDocumentTypeChange('cpf')}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  {documentType === 'cnpj' && (
                    <button
                      type="button"
                      onClick={() => consultarCNPJ(document)}
                      disabled={isLoading || !document}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="px-4 py-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

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
                    required={documentType === 'cnpj'}
                  />
                </div>
              )}

              {/* Trading Name */}
              {documentType === 'cnpj' && (
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
              )}

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
                  required
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>

      <footer className="py-3 mt-4 border-t border-border">
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