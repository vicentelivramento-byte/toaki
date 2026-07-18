-- ============================================================
-- O MEU PROGNOSTICO  |  Esquema de base de dados (Fase 1)
-- TOAKI - executar no SQL Editor do Supabase
-- ============================================================

-- ---------- 1. ADMINISTRADORES ----------
-- Flag de administracao na tabela de perfis existente.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Para tornares alguem administrador (substitui pelo teu numero):
--   UPDATE public.profiles SET is_admin = true WHERE phone = '351912345678';


-- ---------- 2. GRUPOS ----------
CREATE TABLE IF NOT EXISTS public.prog_grupos (
  id          bigserial PRIMARY KEY,
  nome        text NOT NULL,
  creditos    numeric(10,2) NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ---------- 3. PARTICIPANTES (8 posicoes por grupo) ----------
CREATE TABLE IF NOT EXISTS public.prog_participantes (
  id          bigserial PRIMARY KEY,
  grupo_id    bigint NOT NULL REFERENCES public.prog_grupos(id) ON DELETE CASCADE,
  posicao     smallint NOT NULL CHECK (posicao BETWEEN 1 AND 8),
  phone       text NOT NULL,
  nome        text NOT NULL,
  estado      text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','aceite','recusado')),
  creditos    numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Uma posicao so pode ter UM participante aceite.
CREATE UNIQUE INDEX IF NOT EXISTS prog_pos_unica_aceite
  ON public.prog_participantes (grupo_id, posicao)
  WHERE estado = 'aceite';

-- O mesmo telefone nao se inscreve duas vezes no mesmo grupo.
CREATE UNIQUE INDEX IF NOT EXISTS prog_phone_unico_grupo
  ON public.prog_participantes (grupo_id, phone)
  WHERE estado IN ('pendente','aceite');


-- ---------- 4. LISTAS DE PROGNOSTICOS (uma por grupo/data) ----------
CREATE TABLE IF NOT EXISTS public.prog_listas (
  id          bigserial PRIMARY KEY,
  grupo_id    bigint NOT NULL REFERENCES public.prog_grupos(id) ON DELETE CASCADE,
  data        date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, data)
);

-- Fecho automatico: as 17:00 da vespera da data da lista.
-- (coluna calculada -> nao precisa de rotina agendada)
ALTER TABLE public.prog_listas
  ADD COLUMN IF NOT EXISTS fecha_em timestamptz
  GENERATED ALWAYS AS (((data - 1) + time '17:00') AT TIME ZONE 'Europe/Lisbon') STORED;


-- ---------- 5. PROGNOSTICOS (8 linhas por lista) ----------
CREATE TABLE IF NOT EXISTS public.prog_prognosticos (
  id             bigserial PRIMARY KEY,
  lista_id       bigint NOT NULL REFERENCES public.prog_listas(id) ON DELETE CASCADE,
  posicao        smallint NOT NULL CHECK (posicao BETWEEN 1 AND 8),
  codigo_jogo    text,
  prognostico    text,
  aberta         boolean NOT NULL DEFAULT false,  -- posicao aberta a outro participante
  preenchido_por text,                            -- telefone de quem preencheu
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lista_id, posicao)
);


-- ---------- 6. MOVIMENTOS DE CREDITOS DO GRUPO ----------
CREATE TABLE IF NOT EXISTS public.prog_movimentos (
  id          bigserial PRIMARY KEY,
  grupo_id    bigint NOT NULL REFERENCES public.prog_grupos(id) ON DELETE CASCADE,
  lista_id    bigint REFERENCES public.prog_listas(id) ON DELETE SET NULL,
  tipo        text NOT NULL CHECK (tipo IN ('carregamento','registo','resultado')),
  valor       numeric(10,2) NOT NULL,   -- negativo = saida, positivo = entrada
  foto_url    text,
  criado_por  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- FUNCOES
-- ============================================================

-- Aceitar participante: liga-o a posicao e carrega 20 creditos
-- na conta do participante E na conta do grupo (operacao atomica).
CREATE OR REPLACE FUNCTION public.prog_aceitar_participante(p_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grupo bigint;
BEGIN
  SELECT grupo_id INTO v_grupo
    FROM prog_participantes
   WHERE id = p_id AND estado = 'pendente'
   FOR UPDATE;

  IF v_grupo IS NULL THEN
    RAISE EXCEPTION 'Participante nao encontrado ou ja processado.';
  END IF;

  UPDATE prog_participantes
     SET estado = 'aceite', creditos = creditos + 20
   WHERE id = p_id;

  UPDATE prog_grupos
     SET creditos = creditos + 20
   WHERE id = v_grupo;

  INSERT INTO prog_movimentos (grupo_id, tipo, valor, criado_por)
  VALUES (v_grupo, 'carregamento', 20, 'aceitacao:' || p_id);
END;
$$;


-- Criar lista de um dia com as 8 linhas vazias.
CREATE OR REPLACE FUNCTION public.prog_criar_lista(p_grupo bigint, p_data date)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lista bigint;
BEGIN
  SELECT id INTO v_lista FROM prog_listas WHERE grupo_id = p_grupo AND data = p_data;
  IF v_lista IS NOT NULL THEN
    RETURN v_lista;
  END IF;

  INSERT INTO prog_listas (grupo_id, data) VALUES (p_grupo, p_data) RETURNING id INTO v_lista;

  INSERT INTO prog_prognosticos (lista_id, posicao)
  SELECT v_lista, generate_series(1,8);

  RETURN v_lista;
END;
$$;


-- Registar movimento (registo = saida, resultado = entrada) e atualizar saldo.
CREATE OR REPLACE FUNCTION public.prog_movimento(
  p_grupo bigint, p_lista bigint, p_tipo text, p_valor numeric, p_foto text, p_por text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor numeric;
BEGIN
  IF p_tipo = 'registo' THEN
    v_valor := -abs(p_valor);   -- sai da conta do grupo
  ELSIF p_tipo = 'resultado' THEN
    v_valor := abs(p_valor);    -- entra na conta do grupo
  ELSE
    v_valor := p_valor;
  END IF;

  INSERT INTO prog_movimentos (grupo_id, lista_id, tipo, valor, foto_url, criado_por)
  VALUES (p_grupo, p_lista, p_tipo, v_valor, p_foto, p_por);

  UPDATE prog_grupos SET creditos = creditos + v_valor WHERE id = p_grupo;
END;
$$;


-- ============================================================
-- RLS  (mesmo padrao permissivo das tabelas existentes da app)
-- ============================================================
ALTER TABLE public.prog_grupos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prog_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prog_listas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prog_prognosticos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prog_movimentos    ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['prog_grupos','prog_participantes','prog_listas','prog_prognosticos','prog_movimentos']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_all ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);',
      t, t);
  END LOOP;
END $$;


-- ============================================================
-- DADOS INICIAIS (opcional - cria o primeiro grupo)
-- ============================================================
INSERT INTO public.prog_grupos (nome) VALUES ('Grupo 1')
ON CONFLICT DO NOTHING;
