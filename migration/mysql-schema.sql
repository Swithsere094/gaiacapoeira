-- ⚠️ HISTÓRICO — ya NO es la fuente de verdad del esquema.
-- Desde que se configuró drizzle-kit, la fuente de verdad es lib/db/schema.ts
-- y los cambios de esquema se hacen vía migraciones versionadas en drizzle/
-- (pnpm db:generate / pnpm db:migrate). Este archivo se conserva solo como
-- referencia de la traducción inicial Postgres -> MySQL; no lo edites para
-- reflejar cambios nuevos de esquema.
--
-- Traducción del esquema Postgres (Supabase) -> MySQL 8
--
-- Primer bloque: las 5 tablas que el código ya usa hoy
-- (cantorias, politica, songs, rodas, usuarios).
--
-- Segundo bloque: el resto de tablas que existen en Supabase pero que
-- ninguna ruta del código consulta todavía (articles, comments, favorites,
-- movements, portuguese_lessons, portuguese_vocabulary,
-- user_lesson_progress) — probablemente pensadas para módulos futuros
-- (blog, favoritos, comentarios, movimientos, clases de portugués).
-- Se migran igual, sin generar código de API para ellas todavía.
--
-- Convención aplicada en todo el archivo: cuando una columna en Postgres
-- tenía un DEFAULT, aquí queda NOT NULL + ese mismo DEFAULT (en vez de
-- dejarla nullable-con-default como en Postgres) para simplificar.
--
-- "profiles" (perfil pensado para usarse junto con Supabase Auth, antes
-- de que el proyecto pasara a su propio sistema de usuarios) se excluyó
-- a propósito: está vacía en producción y no la usa el código.

CREATE TABLE usuarios (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  username      VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NULL,
  role          ENUM('admin','member') NOT NULL DEFAULT 'member',
  apodo         VARCHAR(255)  NULL,
  avatar        TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cantorias (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  video_url   TEXT         NULL,
  description TEXT         NULL,
  event_date  DATE         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE politica (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NULL,
  category    VARCHAR(255) NULL,
  file_url    TEXT         NULL,
  file_name   VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rodas (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  title         VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  video_url     TEXT         NOT NULL,
  thumbnail_url TEXT         NULL,
  location      VARCHAR(255) NULL,
  event_date    DATE         NULL,
  duration      INT          NULL,
  participants  JSON         NULL, -- era text[] en Postgres
  tags          JSON         NULL, -- era text[] en Postgres
  views         INT          NOT NULL DEFAULT 0,
  user_id       CHAR(36)     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rodas_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE songs (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL,
  lyrics      TEXT         NOT NULL,
  translation TEXT         NULL,
  context     TEXT         NULL,
  video_url   TEXT         NULL,
  audio_url   TEXT         NULL,
  mestre      VARCHAR(255) NULL,
  tags        JSON         NULL, -- era text[] en Postgres
  user_id     CHAR(36)     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_songs_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ════════════════════════════════════════════════════════════════════
-- Tablas sin uso todavía en el código (posibles módulos futuros)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE articles (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL,
  excerpt         TEXT         NULL,
  content         TEXT         NOT NULL,
  cover_image_url TEXT         NULL,
  category        VARCHAR(255) NOT NULL,
  tags            JSON         NULL, -- era text[] en Postgres
  published       BOOLEAN      NOT NULL DEFAULT false,
  user_id         CHAR(36)     NULL, -- autor; sobrevive el artículo si se borra el usuario
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_articles_slug (slug),
  CONSTRAINT fk_articles_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movements (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  name               VARCHAR(255) NOT NULL,
  portuguese_name    VARCHAR(255) NULL,
  description        TEXT         NULL,
  video_url          TEXT         NULL,
  thumbnail_url      TEXT         NULL,
  category           VARCHAR(255) NOT NULL,
  difficulty         VARCHAR(100) NOT NULL,
  tips               JSON         NULL, -- era text[] en Postgres
  related_movements  JSON         NULL, -- era array (probablemente de ids) en Postgres
  user_id            CHAR(36)     NULL, -- creador; sobrevive el movimiento si se borra el usuario
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_movements_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE portuguese_lessons (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  content     TEXT         NOT NULL,
  level       VARCHAR(100) NOT NULL,
  category    VARCHAR(255) NOT NULL,
  order_index INT          NOT NULL DEFAULT 0,
  user_id     CHAR(36)     NULL, -- creador; sobrevive la lección si se borra el usuario
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_lessons_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE portuguese_vocabulary (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  lesson_id            CHAR(36)     NULL,
  word                 VARCHAR(255) NOT NULL,
  translation          VARCHAR(255) NOT NULL,
  pronunciation        VARCHAR(255) NULL,
  example_sentence     TEXT         NULL,
  example_translation  TEXT         NULL,
  audio_url            TEXT         NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_vocabulary_lesson FOREIGN KEY (lesson_id) REFERENCES portuguese_lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comments (
  id          CHAR(36)  NOT NULL DEFAULT (UUID()),
  content     TEXT      NOT NULL,
  user_id     CHAR(36)  NOT NULL, -- autor; se borra junto con el usuario
  roda_id     CHAR(36)  NULL,
  article_id  CHAR(36)  NULL,
  song_id     CHAR(36)  NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_usuario FOREIGN KEY (user_id)    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_roda    FOREIGN KEY (roda_id)    REFERENCES rodas(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_song    FOREIGN KEY (song_id)    REFERENCES songs(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favorites (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)  NOT NULL, -- dueño del favorito; se borra junto con el usuario
  roda_id      CHAR(36)  NULL,
  movement_id  CHAR(36)  NULL,
  article_id   CHAR(36)  NULL,
  song_id      CHAR(36)  NULL,
  created_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_favorites_usuario  FOREIGN KEY (user_id)     REFERENCES usuarios(id)  ON DELETE CASCADE,
  CONSTRAINT fk_favorites_roda     FOREIGN KEY (roda_id)     REFERENCES rodas(id)     ON DELETE CASCADE,
  CONSTRAINT fk_favorites_movement FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_article  FOREIGN KEY (article_id)  REFERENCES articles(id)  ON DELETE CASCADE,
  CONSTRAINT fk_favorites_song     FOREIGN KEY (song_id)     REFERENCES songs(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_lesson_progress (
  id            CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)  NOT NULL, -- se borra junto con el usuario
  lesson_id     CHAR(36)  NOT NULL,
  completed     BOOLEAN   NOT NULL DEFAULT false,
  score         INT       NULL,
  completed_at  DATETIME  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_progress_usuario FOREIGN KEY (user_id)   REFERENCES usuarios(id)          ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson  FOREIGN KEY (lesson_id) REFERENCES portuguese_lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
