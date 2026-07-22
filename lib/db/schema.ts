import { sql } from "drizzle-orm"
import {
  mysqlTable,
  varchar,
  char,
  text,
  int,
  boolean,
  date,
  datetime,
  customType,
  mysqlEnum,
} from "drizzle-orm/mysql-core"

// mysql2 no parsea columnas JSON de vuelta a objetos JS (las devuelve como
// string crudo) — a diferencia de lo que hacía Supabase con los text[] de
// Postgres. Este tipo custom hace el JSON.stringify/parse en ambas
// direcciones para que el resto del código siga trabajando con arrays.
const jsonArray = customType<{ data: string[]; driverData: string }>({
  dataType() {
    return "json"
  },
  toDriver(value) {
    return JSON.stringify(value)
  },
  fromDriver(value) {
    return typeof value === "string" ? JSON.parse(value) : value
  },
})

export const usuarios = mysqlTable("usuarios", {
  id: char("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: mysqlEnum("role", ["admin", "member"]).notNull().default("member"),
  apodo: varchar("apodo", { length: 255 }),
  avatar: text("avatar"),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const cantorias = mysqlTable("cantorias", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  video_url: text("video_url"),
  description: text("description"),
  event_date: date("event_date", { mode: "string" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const politica = mysqlTable("politica", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  category: varchar("category", { length: 255 }),
  file_url: text("file_url"),
  file_name: varchar("file_name", { length: 255 }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const rodas = mysqlTable("rodas", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  video_url: text("video_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  location: varchar("location", { length: 255 }),
  event_date: date("event_date", { mode: "string" }),
  duration: int("duration"),
  participants: jsonArray("participants"),
  tags: jsonArray("tags"),
  views: int("views").notNull().default(0),
  user_id: char("user_id", { length: 36 }).references(() => usuarios.id, { onDelete: "set null" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const songs = mysqlTable("songs", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  lyrics: text("lyrics").notNull(),
  translation: text("translation"),
  context: text("context"),
  video_url: text("video_url"),
  audio_url: text("audio_url"),
  mestre: varchar("mestre", { length: 255 }),
  tags: jsonArray("tags"),
  user_id: char("user_id", { length: 36 }).references(() => usuarios.id, { onDelete: "set null" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ════════════════════════════════════════════════════════════════════
// Tablas sin uso todavía en el código (posibles módulos futuros).
// Ver migration/mysql-schema.sql para las notas sobre cada una.
// ════════════════════════════════════════════════════════════════════

export const articles = mysqlTable("articles", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  cover_image_url: text("cover_image_url"),
  category: varchar("category", { length: 255 }).notNull(),
  tags: jsonArray("tags"),
  published: boolean("published").notNull().default(false),
  user_id: char("user_id", { length: 36 }).references(() => usuarios.id, { onDelete: "set null" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const movements = mysqlTable("movements", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  portuguese_name: varchar("portuguese_name", { length: 255 }),
  description: text("description"),
  video_url: text("video_url"),
  thumbnail_url: text("thumbnail_url"),
  category: varchar("category", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 100 }).notNull(),
  tips: jsonArray("tips"),
  related_movements: jsonArray("related_movements"),
  user_id: char("user_id", { length: 36 }).references(() => usuarios.id, { onDelete: "set null" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const portuguese_lessons = mysqlTable("portuguese_lessons", {
  id: char("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  level: varchar("level", { length: 100 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  order_index: int("order_index").notNull().default(0),
  user_id: char("user_id", { length: 36 }).references(() => usuarios.id, { onDelete: "set null" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const portuguese_vocabulary = mysqlTable("portuguese_vocabulary", {
  id: char("id", { length: 36 }).primaryKey(),
  lesson_id: char("lesson_id", { length: 36 }).references(() => portuguese_lessons.id, { onDelete: "cascade" }),
  word: varchar("word", { length: 255 }).notNull(),
  translation: varchar("translation", { length: 255 }).notNull(),
  pronunciation: varchar("pronunciation", { length: 255 }),
  example_sentence: text("example_sentence"),
  example_translation: text("example_translation"),
  audio_url: text("audio_url"),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const comments = mysqlTable("comments", {
  id: char("id", { length: 36 }).primaryKey(),
  content: text("content").notNull(),
  user_id: char("user_id", { length: 36 }).notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  roda_id: char("roda_id", { length: 36 }).references(() => rodas.id, { onDelete: "cascade" }),
  article_id: char("article_id", { length: 36 }).references(() => articles.id, { onDelete: "cascade" }),
  song_id: char("song_id", { length: 36 }).references(() => songs.id, { onDelete: "cascade" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const favorites = mysqlTable("favorites", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  roda_id: char("roda_id", { length: 36 }).references(() => rodas.id, { onDelete: "cascade" }),
  movement_id: char("movement_id", { length: 36 }).references(() => movements.id, { onDelete: "cascade" }),
  article_id: char("article_id", { length: 36 }).references(() => articles.id, { onDelete: "cascade" }),
  song_id: char("song_id", { length: 36 }).references(() => songs.id, { onDelete: "cascade" }),
  created_at: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const user_lesson_progress = mysqlTable("user_lesson_progress", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  lesson_id: char("lesson_id", { length: 36 }).notNull().references(() => portuguese_lessons.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  score: int("score"),
  completed_at: datetime("completed_at"),
})
