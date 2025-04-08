/*
  # Inserção das categorias iniciais
  
  1. Dados
    - Categorias principais de serviços
    - Subcategorias para cada categoria principal
    
  2. Estrutura
    - Inserção em duas etapas para garantir integridade referencial
    - Uso de variáveis temporárias para armazenar IDs
*/

-- Inserir categorias principais
DO $$
DECLARE
  v_alimentacao_id uuid;
  v_comunicacao_id uuid;
  v_construcao_id uuid;
  v_distribuicao_id uuid;
  v_entretenimento_id uuid;
  v_meio_ambiente_id uuid;
  v_saude_id uuid;
  v_seguranca_id uuid;
  v_tecnologia_id uuid;
  v_transporte_id uuid;
  v_turismo_id uuid;
  v_educacionais_id uuid;
  v_financeiros_id uuid;
  v_pessoais_id uuid;
  v_profissionais_id uuid;
  v_sociais_id uuid;
BEGIN
  -- Inserir categorias principais e armazenar IDs
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Alimentação', 'servicos-de-alimentacao')
    RETURNING id INTO v_alimentacao_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Comunicação', 'servicos-de-comunicacao')
    RETURNING id INTO v_comunicacao_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Construção', 'servicos-de-construcao')
    RETURNING id INTO v_construcao_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Distribuição', 'servicos-de-distribuicao')
    RETURNING id INTO v_distribuicao_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Entretenimento e Cultura', 'servicos-de-entretenimento-e-cultura')
    RETURNING id INTO v_entretenimento_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Meio Ambiente', 'servicos-de-meio-ambiente')
    RETURNING id INTO v_meio_ambiente_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Saúde', 'servicos-de-saude')
    RETURNING id INTO v_saude_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Segurança', 'servicos-de-seguranca')
    RETURNING id INTO v_seguranca_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Tecnologia', 'servicos-de-tecnologia')
    RETURNING id INTO v_tecnologia_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Transporte', 'servicos-de-transporte')
    RETURNING id INTO v_transporte_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços de Turismo e Hospitalidade', 'servicos-de-turismo-e-hospitalidade')
    RETURNING id INTO v_turismo_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços Educacionais', 'servicos-educacionais')
    RETURNING id INTO v_educacionais_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços Financeiros', 'servicos-financeiros')
    RETURNING id INTO v_financeiros_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços Pessoais', 'servicos-pessoais')
    RETURNING id INTO v_pessoais_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços Profissionais e Empresariais', 'servicos-profissionais-e-empresariais')
    RETURNING id INTO v_profissionais_id;
    
  INSERT INTO main_categories (name, slug) VALUES
    ('Serviços Sociais', 'servicos-sociais')
    RETURNING id INTO v_sociais_id;

  -- Inserir subcategorias para cada categoria principal
  -- Alimentação
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Bares', 'bares', v_alimentacao_id),
    ('Catering', 'catering', v_alimentacao_id),
    ('Fast Food', 'fast-food', v_alimentacao_id),
    ('Restaurantes', 'restaurantes', v_alimentacao_id);

  -- Comunicação
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Mídia e Imprensa', 'midia-e-imprensa', v_comunicacao_id),
    ('Serviços Audiovisuais', 'servicos-audiovisuais', v_comunicacao_id),
    ('Serviços Postais', 'servicos-postais', v_comunicacao_id),
    ('Telecomunicações', 'telecomunicacoes', v_comunicacao_id);

  -- Construção
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Acabamento e Decoração', 'acabamento-e-decoracao', v_construcao_id),
    ('Construção Civil', 'construcao-civil', v_construcao_id),
    ('Instalações Especializadas', 'instalacoes-especializadas', v_construcao_id),
    ('Reformas', 'reformas', v_construcao_id);

  -- Distribuição
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Comércio Atacadista', 'comercio-atacadista', v_distribuicao_id),
    ('Comércio Varejista', 'comercio-varejista', v_distribuicao_id),
    ('Franquias', 'franquias', v_distribuicao_id),
    ('Representação Comercial', 'representacao-comercial', v_distribuicao_id);

  -- Entretenimento e Cultura
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Cinemas e Teatros', 'cinemas-e-teatros', v_entretenimento_id),
    ('Eventos Culturais', 'eventos-culturais', v_entretenimento_id),
    ('Museus e Galerias', 'museus-e-galerias', v_entretenimento_id),
    ('Produção Artística', 'producao-artistica', v_entretenimento_id);

  -- Meio Ambiente
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Consultorias Ambientais', 'consultorias-ambientais', v_meio_ambiente_id),
    ('Energias Renováveis', 'energias-renovaveis', v_meio_ambiente_id),
    ('Gestão de Resíduos', 'gestao-de-residuos', v_meio_ambiente_id),
    ('Saneamento', 'saneamento', v_meio_ambiente_id);

  -- Saúde
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Consultórios Médicos', 'consultorios-medicos', v_saude_id),
    ('Diagnósticos e Exames', 'diagnosticos-e-exames', v_saude_id),
    ('Hospitais e Clínicas', 'hospitais-e-clinicas', v_saude_id),
    ('Serviços Odontológicos', 'servicos-odontologicos', v_saude_id);

  -- Segurança
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Segurança da Informação', 'seguranca-da-informacao', v_seguranca_id),
    ('Segurança Patrimonial', 'seguranca-patrimonial', v_seguranca_id),
    ('Sistemas de Segurança', 'sistemas-de-seguranca', v_seguranca_id),
    ('Vigilância', 'vigilancia', v_seguranca_id);

  -- Tecnologia
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Consultoria em TI', 'consultoria-em-ti', v_tecnologia_id),
    ('Desenvolvimento de Software', 'desenvolvimento-de-software', v_tecnologia_id),
    ('Hospedagem e Cloud', 'hospedagem-e-cloud', v_tecnologia_id),
    ('Suporte Técnico', 'suporte-tecnico', v_tecnologia_id);

  -- Transporte
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Logística e Armazenagem', 'logistica-e-armazenagem', v_transporte_id),
    ('Transporte Aéreo', 'transporte-aereo', v_transporte_id),
    ('Transporte Marítimo', 'transporte-maritimo', v_transporte_id),
    ('Transporte Terrestre', 'transporte-terrestre', v_transporte_id);

  -- Turismo e Hospitalidade
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Agências de Viagens', 'agencias-de-viagens', v_turismo_id),
    ('Eventos e Conferências', 'eventos-e-conferencias', v_turismo_id),
    ('Hotelaria', 'hotelaria', v_turismo_id),
    ('Serviços de Guia', 'servicos-de-guia', v_turismo_id);

  -- Educacionais
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Educação Básica', 'educacao-basica', v_educacionais_id),
    ('Educação Continuada', 'educacao-continuada', v_educacionais_id),
    ('Educação Superior', 'educacao-superior', v_educacionais_id),
    ('Educação Técnica', 'educacao-tecnica', v_educacionais_id),
    ('Treinamentos Corporativos', 'treinamentos-corporativos', v_educacionais_id);

  -- Financeiros
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Bancos e Instituições Financeiras', 'bancos-e-instituicoes-financeiras', v_financeiros_id),
    ('Crédito e Financiamento', 'credito-e-financiamento', v_financeiros_id),
    ('Investimentos', 'investimentos', v_financeiros_id),
    ('Seguros', 'seguros', v_financeiros_id);

  -- Pessoais
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Beleza e Estética', 'beleza-e-estetica', v_pessoais_id),
    ('Fitness e Bem-estar', 'fitness-e-bem-estar', v_pessoais_id),
    ('Serviços de Reparos', 'servicos-de-reparos', v_pessoais_id),
    ('Serviços Domésticos', 'servicos-domesticos', v_pessoais_id);

  -- Profissionais e Empresariais
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Serviços de Arquitetura e Engenharia', 'servicos-de-arquitetura-e-engenharia', v_profissionais_id),
    ('Serviços de Consultoria', 'servicos-de-consultoria', v_profissionais_id),
    ('Serviços de Contabilidade e Auditoria', 'servicos-de-contabilidade-e-auditoria', v_profissionais_id),
    ('Serviços de Publicidade e Marketing', 'servicos-de-publicidade-e-marketing', v_profissionais_id),
    ('Serviços Jurídicos', 'servicos-juridicos', v_profissionais_id);

  -- Sociais
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Assistência Social', 'assistencia-social', v_sociais_id),
    ('Cuidados para Idosos', 'cuidados-para-idosos', v_sociais_id),
    ('Instituições Filantrópicas', 'instituicoes-filantropicas', v_sociais_id),
    ('Serviços Comunitários', 'servicos-comunitarios', v_sociais_id);

END $$;