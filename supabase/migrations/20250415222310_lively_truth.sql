/*
  # Add new service categories and subcategories
  
  1. Changes
    - Add new main categories: Serviços and Varejo
    - Add corresponding subcategories
    - Preserve existing data
*/

DO $$
DECLARE
  v_servicos_id uuid;
  v_varejo_id uuid;
BEGIN
  -- Insert new main categories
  INSERT INTO main_categories (name, slug)
  VALUES ('Serviços', 'servicos')
  RETURNING id INTO v_servicos_id;

  INSERT INTO main_categories (name, slug)
  VALUES ('Varejo', 'varejo')
  RETURNING id INTO v_varejo_id;

  -- Insert subcategories for Serviços
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Cabeleireiro e Barbearia', 'cabeleireiro-e-barbearia', v_servicos_id),
    ('Manicure e Pedicure', 'manicure-e-pedicure', v_servicos_id),
    ('Estética e Beleza', 'estetica-e-beleza', v_servicos_id),
    ('Oficina Mecânica', 'oficina-mecanica', v_servicos_id),
    ('Troca de Pneus', 'troca-de-pneus', v_servicos_id),
    ('Serviços de Manutenção Veicular', 'servicos-de-manutencao-veicular', v_servicos_id),
    ('Serviços de Limpeza', 'servicos-de-limpeza', v_servicos_id),
    ('Serviços Contábeis', 'servicos-contabeis', v_servicos_id),
    ('Serviços Jurídicos', 'servicos-juridicos', v_servicos_id),
    ('Serviços de Consultoria', 'servicos-de-consultoria', v_servicos_id);

  -- Insert subcategories for Varejo
  INSERT INTO sub_categories (name, slug, main_category_id) VALUES
    ('Padaria e Confeitaria', 'padaria-e-confeitaria', v_varejo_id),
    ('Açougue', 'acougue', v_varejo_id),
    ('Pet Shop', 'pet-shop', v_varejo_id),
    ('Farmácia', 'farmacia', v_varejo_id),
    ('Loja de Roupas', 'loja-de-roupas', v_varejo_id),
    ('Loja de Calçados', 'loja-de-calcados', v_varejo_id),
    ('Loja de Eletrônicos', 'loja-de-eletronicos', v_varejo_id),
    ('Papelaria', 'papelaria', v_varejo_id),
    ('Loja de Materiais de Construção', 'loja-de-materiais-de-construcao', v_varejo_id),
    ('Mercearia', 'mercearia', v_varejo_id);

END $$;